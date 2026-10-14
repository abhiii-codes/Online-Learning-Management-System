package com.lms;

import com.lms.config.AppContext;
import com.lms.config.DatabaseConfig;
import com.lms.dao.*;
import com.lms.model.*;
import com.lms.util.PasswordUtils;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("JDBC Database Integration Test Suite (8 Marks Rubric Coverage)")
public class JdbcDaoPersistenceTest {

    private static UserDao userDao;
    private static CourseDao courseDao;
    private static EnrollmentDao enrollmentDao;
    private static AssignmentDao assignmentDao;
    private static SubmissionDao submissionDao;
    private static QuizDao quizDao;
    private static NotificationDao notificationDao;
    private static AuditLogDao auditLogDao;

    @BeforeAll
    static void setup() {
        DatabaseConfig.initialize();
        userDao = AppContext.getUserDao();
        courseDao = AppContext.getCourseDao();
        enrollmentDao = AppContext.getEnrollmentDao();
        assignmentDao = AppContext.getAssignmentDao();
        submissionDao = AppContext.getSubmissionDao();
        quizDao = AppContext.getQuizDao();
        notificationDao = AppContext.getNotificationDao();
        auditLogDao = AppContext.getAuditLogDao();
    }

    @Test
    @DisplayName("1. User Creation, Retrieval, and Authentication Lookup via JDBC")
    void testUserJdbcLifecycle() {
        String email = "test_student_" + System.currentTimeMillis() + "@lms.edu";
        StudentUser user = new StudentUser(null, "Test Student", email, PasswordUtils.hashPassword("secret123"), "Bio", UserStatus.ACTIVE);

        User created = userDao.create(user);
        assertNotNull(created.getId(), "Generated primary key should be populated");

        Optional<User> retrieved = userDao.findById(created.getId());
        assertTrue(retrieved.isPresent());
        assertEquals("Test Student", retrieved.get().getName());
        assertEquals(Role.STUDENT, retrieved.get().getRole());

        Optional<User> byEmail = userDao.findByEmail(email);
        assertTrue(byEmail.isPresent());
        assertTrue(PasswordUtils.verifyPassword("secret123", byEmail.get().getPasswordHash()));

        // User update
        created.setName("Updated Student");
        assertTrue(userDao.update(created));

        Optional<User> updated = userDao.findById(created.getId());
        assertTrue(updated.isPresent());
        assertEquals("Updated Student", updated.get().getName());
    }

    @Test
    @DisplayName("2. Course Creation, Retrieval, Status Update, and Search via JDBC")
    void testCourseJdbcLifecycle() {
        String code = "CS-TEST-" + (System.currentTimeMillis() % 10000);
        Course course = new Course(null, "Test Concurrency Course", code, "Advanced Concurrency", "CS", 2L);
        course.setStatus(CourseStatus.DRAFT);
        course.setLevel(CourseLevel.ADVANCED);
        course.setCapacity(50);

        Course created = courseDao.create(course);
        assertNotNull(created.getId());

        Optional<Course> retrieved = courseDao.findById(created.getId());
        assertTrue(retrieved.isPresent());
        assertEquals(code, retrieved.get().getCode());

        // Update status to PUBLISHED
        assertTrue(courseDao.updateStatus(created.getId(), CourseStatus.PUBLISHED));
        assertEquals(CourseStatus.PUBLISHED, courseDao.findById(created.getId()).get().getStatus());

        // Search courses
        List<Course> found = courseDao.findAll(null, "PUBLISHED", "Concurrency", 0, 10);
        assertFalse(found.isEmpty());
    }

    @Test
    @DisplayName("3. Course Enrollment and Duplicate Enrollment Prevention via JDBC")
    void testEnrollmentJdbcOperations() {
        Long testCourseId = 1L;
        String email = "enrollee_" + System.currentTimeMillis() + "@lms.edu";
        StudentUser student = (StudentUser) userDao.create(new StudentUser(null, "Enrollee", email, PasswordUtils.hashPassword("pass123"), "Bio", UserStatus.ACTIVE));

        assertFalse(enrollmentDao.exists(student.getId(), testCourseId));

        Enrollment enrollment = new Enrollment(null, student.getId(), testCourseId, 0, "ACTIVE");
        Enrollment created = enrollmentDao.create(enrollment);
        assertNotNull(created.getId());
        assertTrue(enrollmentDao.exists(student.getId(), testCourseId));

        // Update progress
        assertTrue(enrollmentDao.updateProgress(student.getId(), testCourseId, 75));
        Optional<Enrollment> refreshed = enrollmentDao.findByUserAndCourse(student.getId(), testCourseId);
        assertTrue(refreshed.isPresent());
        assertEquals(75, refreshed.get().getProgressPercent());
    }

    @Test
    @DisplayName("4. Assignment Creation, Submission, and Grading via JDBC")
    void testAssignmentAndSubmissionLifecycle() {
        Assignment assignment = new Assignment(null, 1L, "JDBC Lab Test", "Submit raw code", 100, LocalDateTime.now().plusDays(5));
        Assignment createdAssign = assignmentDao.create(assignment);
        assertNotNull(createdAssign.getId());

        // Student submits
        Submission sub = new Submission(null, createdAssign.getId(), 4L, "My solution code", "http://file.url");
        Submission createdSub = submissionDao.create(sub);
        assertNotNull(createdSub.getId());

        // Instructor grades submission
        assertTrue(submissionDao.gradeSubmission(createdSub.getId(), 92.5, "Well written!", 2L));

        Optional<Submission> graded = submissionDao.findById(createdSub.getId());
        assertTrue(graded.isPresent());
        assertEquals(92.5, graded.get().getGrade(), 0.01);
        assertEquals(SubmissionStatus.GRADED, graded.get().getStatus());
    }

    @Test
    @DisplayName("5. Quiz Questions and Quiz Attempt Persistence via JDBC")
    void testQuizJdbcOperations() {
        Quiz quiz = new Quiz(null, 1L, "JDBC Theory Quiz", "Test description", 15, 60);
        Quiz createdQuiz = quizDao.create(quiz);
        assertNotNull(createdQuiz.getId());

        QuizQuestion question = new QuizQuestion(null, createdQuiz.getId(), "What is JDBC?", "Driver", "ORM", "API", "Protocol", "C", 10, 1);
        QuizQuestion createdQ = quizDao.createQuestion(question);
        assertNotNull(createdQ.getId());

        QuizAttempt attempt = new QuizAttempt(null, createdQuiz.getId(), 4L, 10, 10, true, "{\"1\":\"C\"}");
        QuizAttempt savedAttempt = quizDao.saveAttempt(attempt);
        assertNotNull(savedAttempt.getId());
        assertTrue(savedAttempt.isPassed());
    }

    @Test
    @DisplayName("6. Notification and Audit Log Persistence via JDBC")
    void testNotificationAndAuditLogPersistence() {
        Notification notif = new Notification(null, 4L, "System Maintenance", "Scheduled update tonight", NotificationType.INFO);
        Notification savedNotif = notificationDao.create(notif);
        assertNotNull(savedNotif.getId());

        List<Notification> userNotifs = notificationDao.findByUserId(4L);
        assertFalse(userNotifs.isEmpty());

        AuditLog audit = new AuditLog(1L, "SECURITY_AUDIT_TEST", "SECURITY", null, "Manual verification triggered", "127.0.0.1");
        AuditLog savedAudit = auditLogDao.create(audit);
        assertNotNull(savedAudit.getId());

        List<AuditLog> recentLogs = auditLogDao.findRecent(10);
        assertFalse(recentLogs.isEmpty());
    }
}
