package com.lms.service.impl;

import com.lms.config.DatabaseConfig;
import com.lms.dao.AuditLogDao;
import com.lms.dao.CourseDao;
import com.lms.dao.EnrollmentDao;
import com.lms.dao.UserDao;
import com.lms.model.Course;
import com.lms.model.Enrollment;
import com.lms.service.AnalyticsService;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AnalyticsServiceImpl implements AnalyticsService {

    private final UserDao userDao;
    private final CourseDao courseDao;
    private final EnrollmentDao enrollmentDao;
    private final AuditLogDao auditLogDao;

    public AnalyticsServiceImpl(UserDao userDao, CourseDao courseDao, EnrollmentDao enrollmentDao, AuditLogDao auditLogDao) {
        this.userDao = userDao;
        this.courseDao = courseDao;
        this.enrollmentDao = enrollmentDao;
        this.auditLogDao = auditLogDao;
    }

    @Override
    public Map<String, Object> getAdminDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userDao.countAll(null));
        stats.put("totalStudents", userDao.countAll("STUDENT"));
        stats.put("totalInstructors", userDao.countAll("INSTRUCTOR"));
        stats.put("totalCourses", courseDao.countAll(null, null, null));
        stats.put("databaseType", DatabaseConfig.getActiveDatabaseType());
        stats.put("recentAuditLogs", auditLogDao.findRecent(10));

        // Total active enrollments count via JDBC
        String sql = "SELECT COUNT(*) FROM enrollments";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                stats.put("totalEnrollments", rs.getInt(1));
            }
        } catch (Exception e) {
            stats.put("totalEnrollments", 0);
        }

        return stats;
    }

    @Override
    public Map<String, Object> getInstructorDashboardStats(Long instructorId) {
        Map<String, Object> stats = new HashMap<>();
        List<Course> courses = courseDao.findByInstructorId(instructorId);
        stats.put("coursesAuthored", courses.size());

        int totalStudents = 0;
        for (Course c : courses) {
            totalStudents += c.getEnrolledCount();
        }
        stats.put("totalStudentsEnrolled", totalStudents);

        // Pending un-graded submissions for this instructor's courses
        String pendingSql = "SELECT COUNT(s.id) FROM submissions s " +
                            "JOIN assignments a ON s.assignment_id = a.id " +
                            "JOIN courses c ON a.course_id = c.id " +
                            "WHERE c.instructor_id = ? AND s.status = 'SUBMITTED'";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(pendingSql)) {
            stmt.setLong(1, instructorId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    stats.put("pendingGradingCount", rs.getInt(1));
                }
            }
        } catch (Exception e) {
            stats.put("pendingGradingCount", 0);
        }

        stats.put("courses", courses);
        return stats;
    }

    @Override
    public Map<String, Object> getStudentDashboardStats(Long studentId) {
        Map<String, Object> stats = new HashMap<>();
        List<Enrollment> enrollments = enrollmentDao.findByUserId(studentId);
        stats.put("enrolledCoursesCount", enrollments.size());

        int completedCount = 0;
        int totalProgress = 0;
        for (Enrollment e : enrollments) {
            if ("COMPLETED".equalsIgnoreCase(e.getStatus()) || e.getProgressPercent() >= 100) {
                completedCount++;
            }
            totalProgress += e.getProgressPercent();
        }

        stats.put("completedCoursesCount", completedCount);
        double avgProgress = enrollments.isEmpty() ? 0.0 : Math.round(((double) totalProgress / enrollments.size()) * 10.0) / 10.0;
        stats.put("averageProgressPercent", avgProgress);
        stats.put("enrollments", enrollments);

        return stats;
    }
}
