package com.lms.service.impl;

import com.lms.config.DatabaseConfig;
import com.lms.dao.*;
import com.lms.exception.*;
import com.lms.model.*;
import com.lms.service.SubmissionService;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

public class SubmissionServiceImpl implements SubmissionService {

    private final SubmissionDao submissionDao;
    private final AssignmentDao assignmentDao;
    private final CourseDao courseDao;
    private final EnrollmentDao enrollmentDao;
    private final NotificationDao notificationDao;
    private final AuditLogDao auditLogDao;

    public SubmissionServiceImpl(SubmissionDao submissionDao, AssignmentDao assignmentDao,
                                 CourseDao courseDao, EnrollmentDao enrollmentDao,
                                 NotificationDao notificationDao, AuditLogDao auditLogDao) {
        this.submissionDao = submissionDao;
        this.assignmentDao = assignmentDao;
        this.courseDao = courseDao;
        this.enrollmentDao = enrollmentDao;
        this.notificationDao = notificationDao;
        this.auditLogDao = auditLogDao;
    }

    @Override
    public Submission submitAssignment(Long assignmentId, Long studentId, String text, String fileUrl) {
        Assignment assignment = assignmentDao.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", assignmentId));

        if (!enrollmentDao.exists(studentId, assignment.getCourseId())) {
            throw new ForbiddenException("You must be enrolled in the course to submit assignments.");
        }

        if (text == null || text.isBlank()) {
            throw new ValidationException("Submission text or content cannot be empty.");
        }

        Optional<Submission> existing = submissionDao.findByAssignmentAndStudent(assignmentId, studentId);
        if (existing.isPresent()) {
            throw new ValidationException("You have already submitted this assignment.");
        }

        Submission submission = new Submission(null, assignmentId, studentId, text, fileUrl);
        Submission saved = submissionDao.create(submission);

        auditLogDao.create(new AuditLog(studentId, "ASSIGNMENT_SUBMITTED", "SUBMISSION", saved.getId(),
                "Assignment " + assignment.getTitle() + " submitted by student " + studentId, "127.0.0.1"));

        return saved;
    }

    @Override
    public Submission gradeSubmission(Long submissionId, double grade, String feedback, Long instructorId, boolean isAdmin) {
        Submission submission = submissionDao.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", submissionId));

        Assignment assignment = assignmentDao.findById(submission.getAssignmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", submission.getAssignmentId()));

        Course course = courseDao.findById(assignment.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", assignment.getCourseId()));

        // Enforce course ownership: only the author instructor or admin can grade
        if (!isAdmin && !course.getInstructorId().equals(instructorId)) {
            throw new ForbiddenException("You do not have permission to grade submissions for this course.");
        }

        if (grade < 0 || grade > assignment.getMaxPoints()) {
            throw new ValidationException("Grade must be between 0 and " + assignment.getMaxPoints());
        }

        // Execute grading, notification, and audit log atomically inside TransactionManager
        return com.lms.util.TransactionManager.execute(conn -> {
            submissionDao.gradeSubmission(conn, submissionId, grade, feedback, instructorId);

            Notification notif = new Notification(
                    null,
                    submission.getStudentId(),
                    "Grade Posted: " + assignment.getTitle(),
                    String.format("Your submission has been evaluated. Score: %.1f / %d. Feedback: %s",
                            grade, assignment.getMaxPoints(), feedback != null ? feedback : "None"),
                    NotificationType.GRADE
            );
            notificationDao.create(conn, notif);

            AuditLog log = new AuditLog(
                    instructorId,
                    "SUBMISSION_GRADED",
                    "SUBMISSION",
                    submissionId,
                    String.format("Instructor graded submission %d: %.1f points", submissionId, grade),
                    "127.0.0.1"
            );
            auditLogDao.create(conn, log);

            submission.setGrade(grade);
            submission.setFeedback(feedback);
            submission.setGradedBy(instructorId);
            submission.setStatus(SubmissionStatus.GRADED);
            return submission;
        });
    }

    @Override
    public List<Submission> getSubmissionsForAssignment(Long assignmentId, Long currentUserId, boolean isAdmin) {
        Assignment assignment = assignmentDao.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", assignmentId));
        Course course = courseDao.findById(assignment.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", assignment.getCourseId()));

        if (!isAdmin && !course.getInstructorId().equals(currentUserId)) {
            throw new ForbiddenException("You do not have permission to view all submissions for this assignment.");
        }

        return submissionDao.findByAssignmentId(assignmentId);
    }

    @Override
    public Submission getStudentSubmission(Long assignmentId, Long studentId) {
        return submissionDao.findByAssignmentAndStudent(assignmentId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("No submission found for student in assignment " + assignmentId));
    }

    @Override
    public Submission getSubmissionById(Long id, Long currentUserId, boolean isInstructor, boolean isAdmin) {
        Submission submission = submissionDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", id));

        // Security requirement: Prevent students from viewing other students' grades/submissions
        if (!isAdmin && !isInstructor && !submission.getStudentId().equals(currentUserId)) {
            throw new ForbiddenException("Access denied: You cannot view other students' submissions.");
        }

        return submission;
    }
}
