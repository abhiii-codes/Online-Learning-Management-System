package com.lms.service.impl;

import com.lms.dao.AuditLogDao;
import com.lms.dao.CourseDao;
import com.lms.dao.EnrollmentDao;
import com.lms.dao.NotificationDao;
import com.lms.exception.AlreadyEnrolledException;
import com.lms.exception.CourseFullException;
import com.lms.exception.DatabaseOperationException;
import com.lms.exception.DuplicateKeyException;
import com.lms.exception.ForbiddenException;
import com.lms.exception.ResourceNotFoundException;
import com.lms.exception.ValidationException;
import com.lms.model.*;
import com.lms.service.EnrollmentService;
import com.lms.util.TransactionManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

/**
 * Service implementation for student enrollments.
 * Demonstrates:
 * 1. Global Symmetrical Lock Order: Exclusive lock taken on courses FIRST (via increment/decrementEnrolledCount),
 *    serializing concurrent enrollments and drops for the same course and eliminating InnoDB lock upgrade deadlocks.
 * 2. Fresh Snapshot Error Priority: Increment taken first; if 0 rows returned, reads state to disambiguate
 *    AlreadyEnrolledException from CourseFullException. If 1 row returned, fresh read throws AlreadyEnrolledException
 *    on active records, rolling back the increment.
 * 3. Conditional Reactivation & Drop Rollback: Reactivations require status='DROPPED' and drops require status = 'ACTIVE'.
 *    If 0 rows are updated, throws to roll back course counter modification, preventing counter drift in both directions.
 * 4. Automatic Deadlock Retry: Reusable TransactionManager retries on SQLState 40001 / MySQL Error 1213 / Lock Wait Timeout 1205.
 * 5. Full Audit Logging with Remote IP: Client remote IP logged for both enrollment and drop operations.
 * 6. Best-effort Post-commit Alerts: Decouples student notifications from critical enrollment transactions.
 */
public class EnrollmentServiceImpl implements EnrollmentService {

    private static final Logger LOGGER = LoggerFactory.getLogger(EnrollmentServiceImpl.class);

    private final EnrollmentDao enrollmentDao;
    private final CourseDao courseDao;
    private final NotificationDao notificationDao;
    private final AuditLogDao auditLogDao;

    public EnrollmentServiceImpl(EnrollmentDao enrollmentDao, CourseDao courseDao,
                                 NotificationDao notificationDao, AuditLogDao auditLogDao) {
        this.enrollmentDao = enrollmentDao;
        this.courseDao = courseDao;
        this.notificationDao = notificationDao;
        this.auditLogDao = auditLogDao;
    }

    @Override
    public Enrollment enrollStudent(Long userId, Long courseId) {
        return enrollStudent(userId, courseId, "127.0.0.1");
    }

    @Override
    public Enrollment enrollStudent(Long userId, Long courseId, String clientIp) {
        Course course = courseDao.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));

        if (course.getStatus() != CourseStatus.PUBLISHED) {
            throw new ValidationException("Cannot enroll in an unpublished course.");
        }

        try {
            // Execute ACID enrollment transaction via TransactionManager
            Enrollment created = TransactionManager.execute(conn -> {
                // STEP 1: Take exclusive (X) lock on parent course FIRST and conditionally increment enrolled_count.
                // Inverting the lock order prevents InnoDB deadlocks between concurrent foreign-key S-locks.
                boolean seatReserved = courseDao.incrementEnrolledCount(conn, courseId);
                if (!seatReserved) {
                    // Step A: Disambiguate error priority: check if student is already enrolled (highest priority)
                    java.util.Optional<Enrollment> existingOpt = enrollmentDao.findByUserAndCourse(conn, userId, courseId);
                    if (existingOpt.isPresent()) {
                        Enrollment existing = existingOpt.get();
                        if ("ACTIVE".equalsIgnoreCase(existing.getStatus()) || "COMPLETED".equalsIgnoreCase(existing.getStatus())) {
                            throw new AlreadyEnrolledException(userId, courseId);
                        }
                    }

                    // Step B: Check fresh course state to distinguish full capacity from mid-flight unpublish/archive
                    Course freshCourse = courseDao.findById(conn, courseId)
                            .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
                    if (freshCourse.getStatus() != CourseStatus.PUBLISHED) {
                        throw new ValidationException("Course is no longer open for enrollment (current status: " + freshCourse.getStatus() + ").");
                    }

                    throw new CourseFullException(courseId, freshCourse.getCapacity());
                }

                // STEP 2: Course X-lock held. Read fresh enrollment state within transaction boundary.
                java.util.Optional<Enrollment> existingOpt = enrollmentDao.findByUserAndCourse(conn, userId, courseId);
                Enrollment result;

                if (existingOpt.isPresent()) {
                    Enrollment existing = existingOpt.get();
                    if ("ACTIVE".equalsIgnoreCase(existing.getStatus()) || "COMPLETED".equalsIgnoreCase(existing.getStatus())) {
                        // Already enrolled! Throw domain exception -> TransactionManager rolls back the course increment!
                        throw new AlreadyEnrolledException(userId, courseId);
                    } else if ("DROPPED".equalsIgnoreCase(existing.getStatus())) {
                        // Reactivate conditionally where status = 'DROPPED'.
                        // If 0 rows updated (e.g. concurrent reactivation race), throw to roll back the increment!
                        boolean reactivated = enrollmentDao.updateStatusIfDropped(conn, userId, courseId, "ACTIVE");
                        if (!reactivated) {
                            throw new AlreadyEnrolledException("Failed to reactivate enrollment: state conflict or already active.");
                        }
                        existing.setStatus("ACTIVE");
                        result = existing;
                    } else {
                        throw new AlreadyEnrolledException(userId, courseId);
                    }
                } else {
                    // STEP 3: Safe child insert under already-held parent X-lock
                    Enrollment enrollment = new Enrollment();
                    enrollment.setUserId(userId);
                    enrollment.setCourseId(courseId);
                    enrollment.setProgressPercent(0);
                    enrollment.setStatus("ACTIVE");
                    result = enrollmentDao.create(conn, enrollment);
                }

                // STEP 4: Append security audit log inside transaction boundary with real client IP
                AuditLog log = new AuditLog(
                        userId,
                        "COURSE_ENROLLED",
                        "ENROLLMENT",
                        result.getId(),
                        "Student " + userId + " enrolled into course " + course.getCode(),
                        clientIp != null ? clientIp : "127.0.0.1"
                );
                auditLogDao.create(conn, log);

                return result;
            });

            created.setCourseTitle(course.getTitle());
            created.setCourseCode(course.getCode());

            // Best-effort post-commit notification: A failure to create a notification must NOT
            // roll back a successful, verified enrollment transaction.
            try {
                Notification notif = new Notification(
                        null,
                        userId,
                        "Course Enrollment Confirmed",
                        "You have successfully enrolled in " + course.getTitle() + " (" + course.getCode() + ").",
                        NotificationType.ENROLLMENT
                );
                notificationDao.create(notif);
            } catch (Exception notifEx) {
                LOGGER.warn("Non-critical: Failed to send enrollment notification for user {}: {}", userId, notifEx.getMessage());
            }

            return created;
        } catch (DuplicateKeyException dke) {
            // Translate generic unique key constraint violation into specific domain AlreadyEnrolledException
            throw new AlreadyEnrolledException(userId, courseId);
        }
    }

    @Override
    public List<Enrollment> getStudentEnrollments(Long userId) {
        return enrollmentDao.findByUserId(userId);
    }

    @Override
    public List<Enrollment> getCourseEnrollments(Long courseId, Long currentUserId, boolean isAdmin) {
        Course course = courseDao.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
        if (!isAdmin && !course.getInstructorId().equals(currentUserId)) {
            throw new ForbiddenException("You do not have permission to view rosters for this course.");
        }
        return enrollmentDao.findByCourseId(courseId);
    }

    @Override
    public boolean dropCourse(Long userId, Long courseId) {
        return dropCourse(userId, courseId, "127.0.0.1");
    }

    @Override
    public boolean dropCourse(Long userId, Long courseId, String clientIp) {
        // Fast-path pre-check: verify student has an active enrollment before contending for course X-lock.
        // Prevents un-enrolled students from spamming drops and serializing the hot course row.
        java.util.Optional<Enrollment> preCheck = enrollmentDao.findByUserAndCourse(userId, courseId);
        if (preCheck.isEmpty() || !"ACTIVE".equalsIgnoreCase(preCheck.get().getStatus())) {
            throw new ValidationException("Student " + userId + " does not have an active enrollment to drop in course " + courseId);
        }

        // Symmetric unenrollment workflow:
        // CRITICAL: Always acquire locks in the SAME global order (courses X-lock FIRST, then enrollments)
        // to prevent cross-transaction deadlocks with concurrent enrollStudent operations.
        return TransactionManager.execute(conn -> {
            // STEP 1: Lock course row FIRST and atomically decrement counter
            boolean decremented = courseDao.decrementEnrolledCount(conn, courseId);
            if (!decremented) {
                LOGGER.error("CRITICAL: Counter drift detected on course {}! Decrement rejected because enrolled_count is already 0. Run reconcile query.", courseId);
                throw new DatabaseOperationException("Course enrollment counter synchronization failure for course: " + courseId);
            }

            // STEP 2: Conditionally update enrollment status to DROPPED where status = 'ACTIVE'.
            // If 0 rows are updated (e.g. concurrent double-drop race),
            // throw ValidationException so TransactionManager rolls back the course decrement,
            // preventing the counter from drifting downwards!
            boolean updated = enrollmentDao.updateStatusIfActive(conn, userId, courseId, "DROPPED");
            if (!updated) {
                throw new ValidationException("Student " + userId + " does not have an active enrollment to drop in course " + courseId);
            }

            // STEP 3: Append security audit log for drop event with client IP
            AuditLog log = new AuditLog(
                    userId,
                    "COURSE_DROPPED",
                    "ENROLLMENT",
                    courseId,
                    "Student " + userId + " dropped course " + courseId,
                    clientIp != null ? clientIp : "127.0.0.1"
            );
            auditLogDao.create(conn, log);

            return true;
        });
    }
}
