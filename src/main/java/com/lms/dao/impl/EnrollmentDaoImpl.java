package com.lms.dao.impl;

import com.lms.config.DatabaseConfig;
import com.lms.dao.EnrollmentDao;
import com.lms.exception.DatabaseOperationException;
import com.lms.model.Enrollment;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class EnrollmentDaoImpl implements EnrollmentDao {

    private static final String SELECT_BASE =
            "SELECT e.id, e.user_id, e.course_id, e.enrolled_at, e.progress_percent, e.status, " +
            "u.name AS user_name, u.email AS user_email, c.title AS course_title, c.code AS course_code " +
            "FROM enrollments e " +
            "JOIN users u ON e.user_id = u.id " +
            "JOIN courses c ON e.course_id = c.id ";

    @Override
    public Optional<Enrollment> findByUserAndCourse(Long userId, Long courseId) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return findByUserAndCourse(conn, userId, courseId);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to check enrollment for user " + userId + " and course " + courseId, e);
        }
    }

    @Override
    public Optional<Enrollment> findByUserAndCourse(Connection conn, Long userId, Long courseId) {
        String sql = SELECT_BASE + "WHERE e.user_id = ? AND e.course_id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.setLong(2, courseId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to query enrollment", e);
        }
        return Optional.empty();
    }

    @Override
    public List<Enrollment> findByUserId(Long userId) {
        String sql = SELECT_BASE + "WHERE e.user_id = ? ORDER BY e.enrolled_at DESC";
        List<Enrollment> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch user enrollments: " + userId, e);
        }
        return list;
    }

    @Override
    public List<Enrollment> findByCourseId(Long courseId) {
        String sql = SELECT_BASE + "WHERE e.course_id = ? ORDER BY e.enrolled_at DESC";
        List<Enrollment> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch course enrollments: " + courseId, e);
        }
        return list;
    }

    @Override
    public Enrollment create(Enrollment enrollment) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return create(conn, enrollment);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to create enrollment", e);
        }
    }

    @Override
    public Enrollment create(Connection conn, Enrollment enrollment) {
        String sql = "INSERT INTO enrollments (user_id, course_id, progress_percent, status) VALUES (?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, enrollment.getUserId());
            stmt.setLong(2, enrollment.getCourseId());
            stmt.setInt(3, enrollment.getProgressPercent());
            stmt.setString(4, enrollment.getStatus() != null ? enrollment.getStatus() : "ACTIVE");

            stmt.executeUpdate();
            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    enrollment.setId(keys.getLong(1));
                }
            }
            return enrollment;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error creating enrollment", e);
        }
    }

    @Override
    public boolean updateProgress(Long userId, Long courseId, int progressPercent) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return updateProgress(conn, userId, courseId, progressPercent);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to update enrollment progress", e);
        }
    }

    @Override
    public boolean updateProgress(Connection conn, Long userId, Long courseId, int progressPercent) {
        String sql = "UPDATE enrollments SET progress_percent = ?, status = CASE WHEN ? >= 100 THEN 'COMPLETED' ELSE status END " +
                     "WHERE user_id = ? AND course_id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, progressPercent);
            stmt.setInt(2, progressPercent);
            stmt.setLong(3, userId);
            stmt.setLong(4, courseId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error updating progress", e);
        }
    }

    @Override
    public boolean updateStatus(Long userId, Long courseId, String status) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return updateStatus(conn, userId, courseId, status);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to update enrollment status", e);
        }
    }

    @Override
    public boolean updateStatus(Connection conn, Long userId, Long courseId, String status) {
        String sql = "UPDATE enrollments SET status = ? WHERE user_id = ? AND course_id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, status);
            stmt.setLong(2, userId);
            stmt.setLong(3, courseId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to update enrollment status in transaction", e);
        }
    }

    @Override
    public boolean updateStatusIfActive(Connection conn, Long userId, Long courseId, String newStatus) {
        // Enforce dropping only ACTIVE enrollments: completed courses cannot be dropped to protect transcript integrity
        String sql = "UPDATE enrollments SET status = ? WHERE user_id = ? AND course_id = ? AND status = 'ACTIVE'";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, newStatus);
            stmt.setLong(2, userId);
            stmt.setLong(3, courseId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to conditionally update active enrollment status", e);
        }
    }

    @Override
    public boolean updateStatusIfDropped(Connection conn, Long userId, Long courseId, String newStatus) {
        String sql = "UPDATE enrollments SET status = ? WHERE user_id = ? AND course_id = ? AND status = 'DROPPED'";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, newStatus);
            stmt.setLong(2, userId);
            stmt.setLong(3, courseId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to conditionally reactivate dropped enrollment", e);
        }
    }

    @Override
    public boolean exists(Long userId, Long courseId) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return exists(conn, userId, courseId);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to verify enrollment existence", e);
        }
    }

    @Override
    public boolean exists(Connection conn, Long userId, Long courseId) {
        String sql = "SELECT COUNT(*) FROM enrollments WHERE user_id = ? AND course_id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.setLong(2, courseId);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Error checking enrollment existence", e);
        }
    }

    @Override
    public int countEnrolledStudents(Long courseId) {
        String sql = "SELECT COUNT(*) FROM enrollments WHERE course_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to count enrolled students", e);
        }
        return 0;
    }

    @Override
    public int countUserEnrollments(Long userId) {
        String sql = "SELECT COUNT(*) FROM enrollments WHERE user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to count user enrollments", e);
        }
        return 0;
    }

    private Enrollment mapRow(ResultSet rs) throws SQLException {
        Enrollment e = new Enrollment();
        e.setId(rs.getLong("id"));
        e.setUserId(rs.getLong("user_id"));
        e.setUserName(rs.getString("user_name"));
        e.setUserEmail(rs.getString("user_email"));
        e.setCourseId(rs.getLong("course_id"));
        e.setCourseTitle(rs.getString("course_title"));
        e.setCourseCode(rs.getString("course_code"));
        e.setProgressPercent(rs.getInt("progress_percent"));
        e.setStatus(rs.getString("status"));
        Timestamp ts = rs.getTimestamp("enrolled_at");
        if (ts != null) {
            e.setEnrolledAt(ts.toLocalDateTime());
        }
        return e;
    }
}
