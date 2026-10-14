package com.lms;

import com.lms.config.AppContext;
import com.lms.config.DatabaseConfig;
import com.lms.exception.CourseFullException;
import com.lms.exception.DatabaseOperationException;
import com.lms.exception.DuplicateEnrollmentException;
import com.lms.exception.ForbiddenException;
import com.lms.exception.ValidationException;
import com.lms.model.*;
import com.lms.service.*;
import com.lms.util.PasswordUtils;
import com.lms.util.TransactionManager;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Service Layer Business Logic & Transactional Boundaries Test Suite")
public class ServiceTransactionTest {

    private static EnrollmentService enrollmentService;
    private static CourseService courseService;
    private static SubmissionService submissionService;
    private static UserService userService;

    @BeforeAll
    static void init() {
        DatabaseConfig.initialize();
        enrollmentService = AppContext.getEnrollmentService();
        courseService = AppContext.getCourseService();
        submissionService = AppContext.getSubmissionService();
        userService = AppContext.getUserService();
    }

    @Test
    @DisplayName("1. Enrollment Service: Prevents duplicate course enrollment")
    void testDuplicateEnrollmentPrevention() {
        // Create new student
        String email = "service_student_" + System.currentTimeMillis() + "@lms.edu";
        StudentUser student = new StudentUser(null, "Dup Student", email, PasswordUtils.hashPassword("pass123"), "Bio", UserStatus.ACTIVE);
        student = (StudentUser) userService.createUser(student, "pass123");

        // First enrollment succeeds
        Enrollment e1 = enrollmentService.enrollStudent(student.getId(), 1L);
        assertNotNull(e1.getId());

        // Second enrollment into the same course must throw DuplicateEnrollmentException
        final Long studentId = student.getId();
        assertThrows(DuplicateEnrollmentException.class, () -> {
            enrollmentService.enrollStudent(studentId, 1L);
        }, "Duplicate enrollment must be caught and rejected");
    }

    @Test
    @DisplayName("2. Course Service: Enforces instructor ownership security boundaries")
    void testInstructorOwnershipEnforcement() {
        // Course 1 is authored by Instructor 2 (Prof. Ada Lovelace)
        Course course = courseService.getCourseById(1L);
        assertEquals(2L, course.getInstructorId());

        // Another instructor (ID: 3) attempts to update Course 1 without admin rights
        Course maliciousUpdate = new Course();
        maliciousUpdate.setId(1L);
        maliciousUpdate.setTitle("Hacked Title");

        assertThrows(ForbiddenException.class, () -> {
            courseService.updateCourse(maliciousUpdate, 3L, false); // Instructor 3, isAdmin=false
        }, "Unauthorized instructors must be forbidden from updating other instructors' courses");
    }

    @Test
    @DisplayName("3. Submission Service: Validates grading bounds (0 to maxPoints)")
    void testGradingBoundsValidation() {
        assertThrows(ValidationException.class, () -> {
            submissionService.gradeSubmission(1L, 150.0, "Too high", 2L, true);
        }, "Grades exceeding max points must be rejected");

        assertThrows(ValidationException.class, () -> {
            submissionService.gradeSubmission(1L, -5.0, "Negative", 2L, true);
        }, "Negative grades must be rejected");
    }

    @Test
    @DisplayName("4. Capacity Enforcement: Throws CourseFullException when course capacity is reached")
    void testCapacityEnforcementAndCourseFullException() {
        // Create a tightly capped course with capacity = 1
        String code = "CAP-" + System.currentTimeMillis();
        Course smallCourse = new Course();
        smallCourse.setTitle("Capacity Test Course");
        smallCourse.setCode(code);
        smallCourse.setDescription("Course with capacity 1 to verify CourseFullException");
        smallCourse.setCategory("Computer Science");
        smallCourse.setCapacity(1);
        smallCourse.setStatus(CourseStatus.PUBLISHED);

        Course createdCourse = courseService.createCourse(smallCourse, 2L); // Instructor 2

        // Create student 1 and enroll
        String s1Email = "cap_s1_" + System.currentTimeMillis() + "@lms.edu";
        StudentUser s1 = (StudentUser) userService.createUser(
                new StudentUser(null, "Cap Student 1", s1Email, PasswordUtils.hashPassword("pass123"), "Bio", UserStatus.ACTIVE), "pass123");

        Enrollment e1 = enrollmentService.enrollStudent(s1.getId(), createdCourse.getId());
        assertNotNull(e1.getId(), "First enrollment must succeed when seats are available");

        // Create student 2 and attempt to enroll in the full course
        String s2Email = "cap_s2_" + System.currentTimeMillis() + "@lms.edu";
        StudentUser s2 = (StudentUser) userService.createUser(
                new StudentUser(null, "Cap Student 2", s2Email, PasswordUtils.hashPassword("pass123"), "Bio", UserStatus.ACTIVE), "pass123");

        assertThrows(CourseFullException.class, () -> {
            enrollmentService.enrollStudent(s2.getId(), createdCourse.getId());
        }, "Exceeding course capacity must throw CourseFullException and prevent seat overselling");
    }

    @Test
    @DisplayName("5. Symmetric Drop Course: Decrements enrolled counter atomically upon dropping")
    void testSymmetricCourseDrop() {
        // Create course with capacity = 1
        String code = "DROP-" + System.currentTimeMillis();
        Course course = new Course();
        course.setTitle("Drop Test Course");
        course.setCode(code);
        course.setDescription("Course to test drop and counter decrement");
        course.setCategory("Computer Science");
        course.setCapacity(1);
        course.setStatus(CourseStatus.PUBLISHED);

        Course createdCourse = courseService.createCourse(course, 2L);

        // Student A enrolls
        String aEmail = "drop_a_" + System.currentTimeMillis() + "@lms.edu";
        StudentUser studentA = (StudentUser) userService.createUser(
                new StudentUser(null, "Student A", aEmail, PasswordUtils.hashPassword("pass123"), "Bio", UserStatus.ACTIVE), "pass123");

        enrollmentService.enrollStudent(studentA.getId(), createdCourse.getId());

        // Student B cannot enroll because capacity is 1
        String bEmail = "drop_b_" + System.currentTimeMillis() + "@lms.edu";
        StudentUser studentB = (StudentUser) userService.createUser(
                new StudentUser(null, "Student B", bEmail, PasswordUtils.hashPassword("pass123"), "Bio", UserStatus.ACTIVE), "pass123");

        assertThrows(CourseFullException.class, () -> {
            enrollmentService.enrollStudent(studentB.getId(), createdCourse.getId());
        });

        // Student A drops the course
        boolean dropped = enrollmentService.dropCourse(studentA.getId(), createdCourse.getId());
        assertTrue(dropped, "Dropping course should return true");

        // Now Student B can successfully enroll because seat was atomically released
        Enrollment eB = enrollmentService.enrollStudent(studentB.getId(), createdCourse.getId());
        assertNotNull(eB.getId(), "Student B can enroll after seat is released by Student A");
    }

    @Test
    @DisplayName("6. Re-enrollment after Drop: Reactivates existing row without duplicate key 1062")
    void testReenrollmentAfterDropReactivatesSeat() {
        // Create course with capacity = 2
        String code = "REACT-" + System.currentTimeMillis();
        Course course = new Course();
        course.setTitle("Reactivation Test Course");
        course.setCode(code);
        course.setDescription("Course to test re-enrollment reactivation");
        course.setCategory("Computer Science");
        course.setCapacity(2);
        course.setStatus(CourseStatus.PUBLISHED);

        Course createdCourse = courseService.createCourse(course, 2L);

        // Student registers and enrolls
        String email = "react_student_" + System.currentTimeMillis() + "@lms.edu";
        StudentUser student = (StudentUser) userService.createUser(
                new StudentUser(null, "React Student", email, PasswordUtils.hashPassword("pass123"), "Bio", UserStatus.ACTIVE), "pass123");

        Enrollment e1 = enrollmentService.enrollStudent(student.getId(), createdCourse.getId());
        assertNotNull(e1.getId());
        assertEquals("ACTIVE", e1.getStatus());

        // Student drops the course
        boolean dropped = enrollmentService.dropCourse(student.getId(), createdCourse.getId());
        assertTrue(dropped);

        // Student re-enrolls in the course: must reactivate the row rather than throwing 1062
        Enrollment reEnrolled = enrollmentService.enrollStudent(student.getId(), createdCourse.getId());
        assertNotNull(reEnrolled.getId());
        assertEquals(e1.getId(), reEnrolled.getId(), "Must reuse the existing enrollment ID");
        assertEquals("ACTIVE", reEnrolled.getStatus(), "Status must be reactivated to ACTIVE");

        // Attempting to enroll again while ACTIVE must throw AlreadyEnrolledException
        assertThrows(com.lms.exception.AlreadyEnrolledException.class, () -> {
            enrollmentService.enrollStudent(student.getId(), createdCourse.getId());
        });
    }

    @Test
    @DisplayName("7. Concurrency: 20 simultaneous enrollment threads with capacity=5 yields exactly 5 successes, 15 CourseFullExceptions, and 0 drift")
    void testConcurrentEnrollmentCapacityLimitWithExecutorService() throws Exception {
        int capacity = 5;
        int totalThreads = 20;

        // Ensure connection pool can satisfy 20 concurrent threads simultaneously without starvation
        DatabaseConfig.getDataSource().setMaximumPoolSize(25);

        // Create course with capacity = 5
        String code = "CONCUR-" + System.currentTimeMillis();
        Course course = new Course();
        course.setTitle("Concurrent Capacity Test");
        course.setCode(code);
        course.setDescription("Testing concurrent seat saturation with 20 threads");
        course.setCategory("Computer Science");
        course.setCapacity(capacity);
        course.setStatus(CourseStatus.PUBLISHED);

        Course createdCourse = courseService.createCourse(course, 2L);
        final Long courseId = createdCourse.getId();

        // Pre-create 20 unique students
        List<Long> studentIds = new ArrayList<>();
        for (int i = 0; i < totalThreads; i++) {
            String email = "concur_s" + i + "_" + System.currentTimeMillis() + "@lms.edu";
            StudentUser student = (StudentUser) userService.createUser(
                    new StudentUser(null, "Concur Student " + i, email, PasswordUtils.hashPassword("pass123"), "Bio", UserStatus.ACTIVE),
                    "pass123");
            studentIds.add(student.getId());
        }

        ExecutorService executor = Executors.newFixedThreadPool(totalThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(totalThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger courseFullCount = new AtomicInteger(0);
        AtomicInteger otherErrorCount = new AtomicInteger(0);

        for (Long studentId : studentIds) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    enrollmentService.enrollStudent(studentId, courseId);
                    successCount.incrementAndGet();
                } catch (CourseFullException cfe) {
                    courseFullCount.incrementAndGet();
                } catch (Throwable t) {
                    otherErrorCount.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        // Fire burst of all 20 threads simultaneously
        startLatch.countDown();
        boolean completed = doneLatch.await(15, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(completed, "All 20 threads must complete within timeout");
        assertEquals(5, successCount.get(), "Exactly 5 threads must succeed in acquiring seats");
        assertEquals(15, courseFullCount.get(), "Exactly 15 threads must receive CourseFullException");
        assertEquals(0, otherErrorCount.get(), "Zero unhandled exceptions or deadlocks allowed");

        // Assertion 1: Model check of courses.enrolled_count
        Course courseInDb = courseService.getCourseById(courseId);
        assertEquals(5, courseInDb.getEnrolledCount(), "Courses enrolled_count must exactly match capacity (5)");

        // Assertion 2: Direct SQL COUNT(*) verification on enrollments table
        try (java.sql.Connection conn = DatabaseConfig.getConnection();
             java.sql.PreparedStatement stmt = conn.prepareStatement(
                     "SELECT COUNT(*) FROM enrollments WHERE course_id = ? AND status IN ('ACTIVE', 'COMPLETED')")) {
            stmt.setLong(1, courseId);
            try (java.sql.ResultSet rs = stmt.executeQuery()) {
                assertTrue(rs.next());
                assertEquals(5, rs.getInt(1), "Direct SQL COUNT(*) of active child enrollments must equal exactly 5");
            }
        }

        // Assertion 3: Reconciliation query verification (enrolled_count must perfectly match active rows, 0 drift)
        try (java.sql.Connection conn = DatabaseConfig.getConnection();
             java.sql.PreparedStatement stmt = conn.prepareStatement(
                     "SELECT c.id FROM courses c " +
                     "WHERE c.id = ? AND c.enrolled_count <> (" +
                     "  SELECT COUNT(*) FROM enrollments e " +
                     "  WHERE e.course_id = c.id AND e.status IN ('ACTIVE', 'COMPLETED')" +
                     ")")) {
            stmt.setLong(1, courseId);
            try (java.sql.ResultSet rs = stmt.executeQuery()) {
                assertFalse(rs.next(), "Counter drift query must return 0 rows (cached counter perfectly synchronized with actual child rows)");
            }
        }
    }

    @Test
    @DisplayName("8. Concurrency: Same student attempting 20 simultaneous enrollments yields exactly 1 success and 19 AlreadyEnrolledExceptions")
    void testSameStudentConcurrentEnrollmentFromMultipleThreads() throws Exception {
        int totalThreads = 20;
        DatabaseConfig.getDataSource().setMaximumPoolSize(25);

        // Create open course with plenty of capacity
        String code = "SINGLE-STUDENT-" + System.currentTimeMillis();
        Course course = new Course();
        course.setTitle("Single Student Multi-Tab Test");
        course.setCode(code);
        course.setDescription("Testing duplicate enrollment prevention under high concurrency");
        course.setCategory("Computer Science");
        course.setCapacity(50);
        course.setStatus(CourseStatus.PUBLISHED);

        Course createdCourse = courseService.createCourse(course, 2L);
        final Long courseId = createdCourse.getId();

        // Create 1 single student
        String email = "single_s_" + System.currentTimeMillis() + "@lms.edu";
        StudentUser student = (StudentUser) userService.createUser(
                new StudentUser(null, "MultiTab Student", email, PasswordUtils.hashPassword("pass123"), "Bio", UserStatus.ACTIVE),
                "pass123");
        final Long studentId = student.getId();

        ExecutorService executor = Executors.newFixedThreadPool(totalThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(totalThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger alreadyEnrolledCount = new AtomicInteger(0);
        AtomicInteger otherErrors = new AtomicInteger(0);

        for (int i = 0; i < totalThreads; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    enrollmentService.enrollStudent(studentId, courseId);
                    successCount.incrementAndGet();
                } catch (com.lms.exception.AlreadyEnrolledException aee) {
                    alreadyEnrolledCount.incrementAndGet();
                } catch (Throwable t) {
                    otherErrors.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        // Fire simultaneous burst
        startLatch.countDown();
        boolean completed = doneLatch.await(15, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(completed, "All 20 requests must complete within timeout");
        assertEquals(1, successCount.get(), "Exactly 1 enrollment must succeed for the student");
        assertEquals(19, alreadyEnrolledCount.get(), "Exactly 19 duplicate attempts must receive AlreadyEnrolledException");
        assertEquals(0, otherErrors.get(), "Zero unhandled exceptions or deadlocks allowed");

        // Verify course enrolled count is exactly 1
        Course courseInDb = courseService.getCourseById(courseId);
        assertEquals(1, courseInDb.getEnrolledCount(), "Course enrolled_count must be exactly 1");
    }

    @Test
    @DisplayName("9. Concurrency: Double-drop forces decrement-success then status-update-failure, verifying rollback and zero drift")
    void testConcurrentDoubleDropIntegrityAndZeroDrift() throws Exception {
        int capacity = 10;
        String code = "DOUBLE-DROP-" + System.currentTimeMillis();
        Course course = new Course();
        course.setTitle("Double Drop Test");
        course.setCode(code);
        course.setDescription("Testing concurrent drop rollback");
        course.setCategory("Computer Science");
        course.setCapacity(capacity);
        course.setStatus(CourseStatus.PUBLISHED);

        Course createdCourse = courseService.createCourse(course, 2L);
        final Long courseId = createdCourse.getId();

        // Create 2 students and enroll both so enrolled_count = 2
        String email1 = "drop_s1_" + System.currentTimeMillis() + "@lms.edu";
        StudentUser student1 = (StudentUser) userService.createUser(
                new StudentUser(null, "Drop Student 1", email1, PasswordUtils.hashPassword("pass123"), "Bio", UserStatus.ACTIVE),
                "pass123");

        String email2 = "drop_s2_" + System.currentTimeMillis() + "@lms.edu";
        StudentUser student2 = (StudentUser) userService.createUser(
                new StudentUser(null, "Drop Student 2", email2, PasswordUtils.hashPassword("pass123"), "Bio", UserStatus.ACTIVE),
                "pass123");

        enrollmentService.enrollStudent(student1.getId(), courseId);
        enrollmentService.enrollStudent(student2.getId(), courseId);
        assertEquals(2, courseService.getCourseById(courseId).getEnrolledCount());

        // 2 simultaneous drop attempts for student 1
        // Thread A: decrements 2->1, updates status to DROPPED, commits (count=1).
        // Thread B: decrements 1->0 (>0 floor succeeds!), but status update hits 0 rows (already DROPPED),
        //           throws ValidationException, triggering TransactionManager rollback restoring count to 1!
        int threads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threads);

        AtomicInteger dropSuccess = new AtomicInteger(0);
        AtomicInteger dropFailed = new AtomicInteger(0);

        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    boolean res = enrollmentService.dropCourse(student1.getId(), courseId);
                    if (res) dropSuccess.incrementAndGet();
                } catch (ValidationException ve) {
                    dropFailed.incrementAndGet();
                } catch (Throwable t) {
                    // unexpected
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        boolean completed = doneLatch.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(completed, "Both drop threads must complete within timeout");
        assertEquals(1, dropSuccess.get(), "Exactly 1 drop request must succeed");
        assertEquals(1, dropFailed.get(), "Concurrent double-drop must fail with ValidationException and roll back decrement");

        // Counter must be exactly 1 (student 2 still enrolled), proving rollback restored decrement
        Course courseAfter = courseService.getCourseById(courseId);
        assertEquals(1, courseAfter.getEnrolledCount(), "Enrolled count must be exactly 1 after rollback");

        // Direct SQL count verification
        try (java.sql.Connection conn = DatabaseConfig.getConnection();
             java.sql.PreparedStatement stmt = conn.prepareStatement(
                     "SELECT COUNT(*) FROM enrollments WHERE course_id = ? AND status IN ('ACTIVE', 'COMPLETED')")) {
            stmt.setLong(1, courseId);
            try (java.sql.ResultSet rs = stmt.executeQuery()) {
                assertTrue(rs.next());
                assertEquals(1, rs.getInt(1), "Direct SQL count must match remaining active student");
            }
        }
    }

    @Test
    @DisplayName("10. JDBC & Concurrency: Deadlock retry mechanism retries transient MySQL 1213 / SQLState 40001 collisions")
    void testDeadlockRetryMechanism() {
        AtomicInteger attempts = new AtomicInteger(0);

        String result = TransactionManager.execute(conn -> {
            int attempt = attempts.incrementAndGet();
            if (attempt == 1) {
                // Simulate MySQL error 1213 / SQLState 40001 deadlock collision wrapped by DAO
                java.sql.SQLException deadlock = new java.sql.SQLException("Deadlock found when trying to get lock", "40001", 1213);
                throw new DatabaseOperationException("DAO failure", deadlock);
            }
            return "SUCCESS_ON_RETRY";
        });

        assertEquals("SUCCESS_ON_RETRY", result);
        assertEquals(2, attempts.get(), "TransactionManager must have transparently retried after first deadlock collision");
    }

    @Test
    @DisplayName("11. JDBC: Error 1062 duplicate key violation translated to DuplicateKeyException")
    void testDuplicateKeyExceptionTranslation() {
        assertThrows(com.lms.exception.DuplicateKeyException.class, () -> {
            TransactionManager.execute(conn -> {
                java.sql.SQLException dupKey = new java.sql.SQLException("Duplicate entry 'CS101' for key 'courses.uk_code'", "23000", 1062);
                throw new DatabaseOperationException("DAO insert failure", dupKey);
            });
        }, "TransactionManager must unwrap cause chain and translate MySQL 1062 to DuplicateKeyException");
    }

    @Test
    @DisplayName("12. Concurrency: Concurrent quiz submissions compute distinct attempt numbers without 1062 collisions")
    void testConcurrentQuizSubmissionsDistinctAttemptNumbers() throws Exception {
        QuizService quizService = AppContext.getQuizService();

        // Create student and enroll in course 1
        String email = "quiz_concurrent_" + System.currentTimeMillis() + "@lms.edu";
        StudentUser student = new StudentUser(null, "Quiz Student", email, PasswordUtils.hashPassword("pass123"), "Bio", UserStatus.ACTIVE);
        student = (StudentUser) userService.createUser(student, "pass123");
        enrollmentService.enrollStudent(student.getId(), 1L);

        final Long studentId = student.getId();
        int threads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threads);

        List<QuizAttempt> results = java.util.Collections.synchronizedList(new ArrayList<>());
        List<Throwable> errors = java.util.Collections.synchronizedList(new ArrayList<>());

        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    QuizAttempt attempt = quizService.submitQuizAttempt(1L, studentId, java.util.Map.of(1L, "B", 2L, "C"));
                    results.add(attempt);
                } catch (Throwable t) {
                    errors.add(t);
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        boolean finished = doneLatch.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(finished, "Both submission threads must complete");
        assertTrue(errors.isEmpty(), "No thread should fail with duplicate key collision: " + errors);
        assertEquals(2, results.size(), "Both quiz submissions must succeed");

        int attempt1 = results.get(0).getAttemptNumber();
        int attempt2 = results.get(1).getAttemptNumber();
        assertNotEquals(attempt1, attempt2, "Concurrent submissions must obtain distinct attempt numbers");
        assertTrue((attempt1 == 1 && attempt2 == 2) || (attempt1 == 2 && attempt2 == 1), "Attempt numbers must be sequential 1 and 2");
    }
}
