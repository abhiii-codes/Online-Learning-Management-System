package com.lms.dao.impl;

import com.lms.config.DatabaseConfig;
import com.lms.dao.LessonDao;
import com.lms.exception.DatabaseOperationException;
import com.lms.model.Lesson;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class LessonDaoImpl implements LessonDao {

    @Override
    public List<Lesson> findByModuleId(Long moduleId) {
        String sql = "SELECT id, module_id, title, content_type, content_body, duration_minutes, order_index, created_at " +
                     "FROM lessons WHERE module_id = ? ORDER BY order_index ASC, id ASC";
        List<Lesson> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, moduleId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch lessons for module: " + moduleId, e);
        }
        return list;
    }

    @Override
    public Optional<Lesson> findById(Long id) {
        String sql = "SELECT id, module_id, title, content_type, content_body, duration_minutes, order_index, created_at " +
                     "FROM lessons WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to find lesson by id: " + id, e);
        }
        return Optional.empty();
    }

    @Override
    public Lesson create(Lesson lesson) {
        String sql = "INSERT INTO lessons (module_id, title, content_type, content_body, duration_minutes, order_index) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, lesson.getModuleId());
            stmt.setString(2, lesson.getTitle());
            stmt.setString(3, lesson.getContentType() != null ? lesson.getContentType() : "TEXT");
            stmt.setString(4, lesson.getContentBody());
            stmt.setInt(5, lesson.getDurationMinutes());
            stmt.setInt(6, lesson.getOrderIndex());

            stmt.executeUpdate();
            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    lesson.setId(keys.getLong(1));
                }
            }
            return lesson;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error creating lesson: " + lesson.getTitle(), e);
        }
    }

    @Override
    public boolean update(Lesson lesson) {
        String sql = "UPDATE lessons SET title = ?, content_type = ?, content_body = ?, duration_minutes = ?, order_index = ? " +
                     "WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, lesson.getTitle());
            stmt.setString(2, lesson.getContentType());
            stmt.setString(3, lesson.getContentBody());
            stmt.setInt(4, lesson.getDurationMinutes());
            stmt.setInt(5, lesson.getOrderIndex());
            stmt.setLong(6, lesson.getId());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error updating lesson: " + lesson.getId(), e);
        }
    }

    @Override
    public boolean delete(Long id) {
        String sql = "DELETE FROM lessons WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to delete lesson: " + id, e);
        }
    }

    @Override
    public boolean markCompleted(Long userId, Long lessonId) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return markCompleted(conn, userId, lessonId);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to mark lesson completed", e);
        }
    }

    @Override
    public boolean markCompleted(Connection conn, Long userId, Long lessonId) {
        String checkSql = "SELECT COUNT(*) FROM lesson_progress WHERE user_id = ? AND lesson_id = ?";
        try (PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
            checkStmt.setLong(1, userId);
            checkStmt.setLong(2, lessonId);
            try (ResultSet rs = checkStmt.executeQuery()) {
                if (rs.next() && rs.getInt(1) > 0) {
                    return true; // Already recorded
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Error checking lesson completion status", e);
        }

        String insertSql = "INSERT INTO lesson_progress (user_id, lesson_id, completed) VALUES (?, ?, TRUE)";
        try (PreparedStatement insertStmt = conn.prepareStatement(insertSql)) {
            insertStmt.setLong(1, userId);
            insertStmt.setLong(2, lessonId);
            return insertStmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to record lesson progress", e);
        }
    }

    @Override
    public List<Long> findCompletedLessonIds(Long userId, Long courseId) {
        String sql = "SELECT lp.lesson_id FROM lesson_progress lp " +
                     "JOIN lessons l ON lp.lesson_id = l.id " +
                     "JOIN modules m ON l.module_id = m.id " +
                     "WHERE lp.user_id = ? AND m.course_id = ? AND lp.completed = TRUE";
        List<Long> ids = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.setLong(2, courseId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    ids.add(rs.getLong("lesson_id"));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch completed lesson ids", e);
        }
        return ids;
    }

    @Override
    public int countCompletedLessons(Long userId, Long courseId) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return countCompletedLessons(conn, userId, courseId);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to count completed lessons", e);
        }
    }

    @Override
    public int countCompletedLessons(Connection conn, Long userId, Long courseId) {
        String sql = "SELECT COUNT(DISTINCT lp.lesson_id) FROM lesson_progress lp " +
                     "JOIN lessons l ON lp.lesson_id = l.id " +
                     "JOIN modules m ON l.module_id = m.id " +
                     "WHERE lp.user_id = ? AND m.course_id = ? AND lp.completed = TRUE";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.setLong(2, courseId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to count completed lessons", e);
        }
        return 0;
    }

    @Override
    public int countTotalLessons(Long courseId) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return countTotalLessons(conn, courseId);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to count total course lessons", e);
        }
    }

    @Override
    public int countTotalLessons(Connection conn, Long courseId) {
        String sql = "SELECT COUNT(l.id) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to count total lessons", e);
        }
        return 0;
    }

    private Lesson mapRow(ResultSet rs) throws SQLException {
        Lesson l = new Lesson();
        l.setId(rs.getLong("id"));
        l.setModuleId(rs.getLong("module_id"));
        l.setTitle(rs.getString("title"));
        l.setContentType(rs.getString("content_type"));
        l.setContentBody(rs.getString("content_body"));
        l.setDurationMinutes(rs.getInt("duration_minutes"));
        l.setOrderIndex(rs.getInt("order_index"));
        Timestamp ts = rs.getTimestamp("created_at");
        if (ts != null) {
            l.setCreatedAt(ts.toLocalDateTime());
        }
        return l;
    }
}
