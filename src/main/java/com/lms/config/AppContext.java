package com.lms.config;

import com.lms.dao.*;
import com.lms.dao.impl.*;
import com.lms.service.*;
import com.lms.service.impl.*;

/**
 * Pure Java Application Context and Service Registry.
 * Implements Factory and Service Locator patterns without Spring or external DI frameworks.
 * Deliberately demonstrates Core Java object graph composition and decoupling.
 */
public final class AppContext {

    // DAOs
    private static final UserDao USER_DAO = new UserDaoImpl();
    private static final CourseDao COURSE_DAO = new CourseDaoImpl();
    private static final ModuleDao MODULE_DAO = new ModuleDaoImpl();
    private static final LessonDao LESSON_DAO = new LessonDaoImpl();
    private static final EnrollmentDao ENROLLMENT_DAO = new EnrollmentDaoImpl();
    private static final AssignmentDao ASSIGNMENT_DAO = new AssignmentDaoImpl();
    private static final SubmissionDao SUBMISSION_DAO = new SubmissionDaoImpl();
    private static final QuizDao QUIZ_DAO = new QuizDaoImpl();
    private static final NotificationDao NOTIFICATION_DAO = new NotificationDaoImpl();
    private static final AuditLogDao AUDIT_LOG_DAO = new AuditLogDaoImpl();
    private static final SystemSettingDao SYSTEM_SETTING_DAO = new SystemSettingDaoImpl();

    // Services
    private static final AuthService AUTH_SERVICE = new AuthServiceImpl(USER_DAO);
    private static final UserService USER_SERVICE = new UserServiceImpl(USER_DAO);
    private static final CourseService COURSE_SERVICE = new CourseServiceImpl(COURSE_DAO, MODULE_DAO, LESSON_DAO, ASSIGNMENT_DAO, QUIZ_DAO, AUDIT_LOG_DAO, USER_DAO);
    private static final ModuleService MODULE_SERVICE = new ModuleServiceImpl(MODULE_DAO, COURSE_DAO);
    private static final LessonService LESSON_SERVICE = new LessonServiceImpl(LESSON_DAO, MODULE_DAO, COURSE_DAO, ENROLLMENT_DAO);
    private static final EnrollmentService ENROLLMENT_SERVICE = new EnrollmentServiceImpl(ENROLLMENT_DAO, COURSE_DAO, NOTIFICATION_DAO, AUDIT_LOG_DAO);
    private static final AssignmentService ASSIGNMENT_SERVICE = new AssignmentServiceImpl(ASSIGNMENT_DAO, COURSE_DAO);
    private static final SubmissionService SUBMISSION_SERVICE = new SubmissionServiceImpl(SUBMISSION_DAO, ASSIGNMENT_DAO, COURSE_DAO, ENROLLMENT_DAO, NOTIFICATION_DAO, AUDIT_LOG_DAO);
    private static final QuizService QUIZ_SERVICE = new QuizServiceImpl(QUIZ_DAO, COURSE_DAO, ENROLLMENT_DAO, NOTIFICATION_DAO, AUDIT_LOG_DAO);
    private static final ProgressService PROGRESS_SERVICE = new ProgressServiceImpl(LESSON_DAO, SUBMISSION_DAO, QUIZ_DAO, ENROLLMENT_DAO);
    private static final NotificationService NOTIFICATION_SERVICE = new NotificationServiceImpl(NOTIFICATION_DAO);
    private static final AuditLogService AUDIT_LOG_SERVICE = new AuditLogServiceImpl(AUDIT_LOG_DAO);
    private static final AnalyticsService ANALYTICS_SERVICE = new AnalyticsServiceImpl(USER_DAO, COURSE_DAO, ENROLLMENT_DAO, AUDIT_LOG_DAO);

    private AppContext() {
    }

    public static UserDao getUserDao() { return USER_DAO; }
    public static CourseDao getCourseDao() { return COURSE_DAO; }
    public static ModuleDao getModuleDao() { return MODULE_DAO; }
    public static LessonDao getLessonDao() { return LESSON_DAO; }
    public static EnrollmentDao getEnrollmentDao() { return ENROLLMENT_DAO; }
    public static AssignmentDao getAssignmentDao() { return ASSIGNMENT_DAO; }
    public static SubmissionDao getSubmissionDao() { return SUBMISSION_DAO; }
    public static QuizDao getQuizDao() { return QUIZ_DAO; }
    public static NotificationDao getNotificationDao() { return NOTIFICATION_DAO; }
    public static AuditLogDao getAuditLogDao() { return AUDIT_LOG_DAO; }
    public static SystemSettingDao getSystemSettingDao() { return SYSTEM_SETTING_DAO; }

    public static AuthService getAuthService() { return AUTH_SERVICE; }
    public static UserService getUserService() { return USER_SERVICE; }
    public static CourseService getCourseService() { return COURSE_SERVICE; }
    public static ModuleService getModuleService() { return MODULE_SERVICE; }
    public static LessonService getLessonService() { return LESSON_SERVICE; }
    public static EnrollmentService getEnrollmentService() { return ENROLLMENT_SERVICE; }
    public static AssignmentService getAssignmentService() { return ASSIGNMENT_SERVICE; }
    public static SubmissionService getSubmissionService() { return SUBMISSION_SERVICE; }
    public static QuizService getQuizService() { return QUIZ_SERVICE; }
    public static ProgressService getProgressService() { return PROGRESS_SERVICE; }
    public static NotificationService getNotificationService() { return NOTIFICATION_SERVICE; }
    public static AuditLogService getAuditLogService() { return AUDIT_LOG_SERVICE; }
    public static AnalyticsService getAnalyticsService() { return ANALYTICS_SERVICE; }
}
