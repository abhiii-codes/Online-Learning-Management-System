package com.lms.dao.impl;

import com.lms.config.DatabaseConfig;
import com.lms.dao.CourseDao;
import com.lms.exception.DatabaseOperationException;
import com.lms.model.Course;
import com.lms.model.CourseLevel;
import com.lms.model.CourseStatus;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * JDBC Implementation of CourseDao.
 */
public class CourseDaoImpl implements CourseDao {

    private static final String SELECT_BASE =
            "SELECT c.id, c.title, c.code, c.description, c.category, c.instructor_id, c.status, c.level, " +
            "c.thumbnail_url, c.capacity, c.enrolled_count, c.created_at, c.updated_at, u.name AS instructor_name " +
            "FROM courses c " +
            "JOIN users u ON c.instructor_id = u.id ";

    @Override
    public Optional<Course> findById(Long id) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return findById(conn, id);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to find course by id: " + id, e);
        }
    }

    @Override
    public Optional<Course> findById(Connection conn, Long id) {
        String sql = SELECT_BASE + "WHERE c.id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToCourse(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to query course by id: " + id, e);
        }
        return Optional.empty();
    }

    @Override
    public Optional<Course> findByCode(String code) {
        String sql = SELECT_BASE + "WHERE UPPER(c.code) = UPPER(?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, code);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToCourse(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to query course by code: " + code, e);
        }
        return Optional.empty();
    }

    @Override
    public List<Course> findAll(String category, String status, String search, int offset, int limit) {
        StringBuilder sql = new StringBuilder(SELECT_BASE);
        List<Object> params = new ArrayList<>();
        List<String> conditions = new ArrayList<>();

        if (category != null && !category.isBlank() && !category.equalsIgnoreCase("ALL")) {
            conditions.add("c.category = ?");
            params.add(category);
        }
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            conditions.add("c.status = ?");
            params.add(status.toUpperCase());
        }
        if (search != null && !search.isBlank()) {
            conditions.add("(LOWER(c.title) LIKE ? OR LOWER(c.code) LIKE ? OR LOWER(c.description) LIKE ?)");
            String pattern = "%" + search.trim().toLowerCase() + "%";
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
        }

        if (!conditions.isEmpty()) {
            sql.append("WHERE ").append(String.join(" AND ", conditions)).append(" ");
        }

        sql.append("ORDER BY c.id DESC LIMIT ? OFFSET ?");
        params.add(limit);
        params.add(offset);

        List<Course> courses = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {

            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    courses.add(mapRowToCourse(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch courses list", e);
        }
        return courses;
    }

    @Override
    public List<Course> findByInstructorId(Long instructorId) {
        String sql = SELECT_BASE + "WHERE c.instructor_id = ? ORDER BY c.id DESC";
        List<Course> courses = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, instructorId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    courses.add(mapRowToCourse(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch instructor courses: " + instructorId, e);
        }
        return courses;
    }

    @Override
    public Course create(Course course) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return create(conn, course);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to create course: " + course.getTitle(), e);
        }
    }

    @Override
    public Course create(Connection conn, Course course) {
        String sql = "INSERT INTO courses (title, code, description, category, instructor_id, status, level, thumbnail_url, capacity) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, course.getTitle());
            stmt.setString(2, course.getCode().toUpperCase());
            stmt.setString(3, course.getDescription());
            stmt.setString(4, course.getCategory());
            stmt.setLong(5, course.getInstructorId());
            stmt.setString(6, course.getStatus() != null ? course.getStatus().name() : CourseStatus.DRAFT.name());
            stmt.setString(7, course.getLevel() != null ? course.getLevel().name() : CourseLevel.BEGINNER.name());
            stmt.setString(8, course.getThumbnailUrl());
            stmt.setInt(9, course.getCapacity());

            int affected = stmt.executeUpdate();
            if (affected == 0) {
                throw new DatabaseOperationException("Creating course failed, no rows affected.");
            }

            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    course.setId(keys.getLong(1));
                }
            }
            return course;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error creating course: " + course.getTitle(), e);
        }
    }

    @Override
    public boolean update(Course course) {
        String sql = "UPDATE courses SET title = ?, code = ?, description = ?, category = ?, status = ?, level = ?, " +
                     "thumbnail_url = ?, capacity = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, course.getTitle());
            stmt.setString(2, course.getCode().toUpperCase());
            stmt.setString(3, course.getDescription());
            stmt.setString(4, course.getCategory());
            stmt.setString(5, course.getStatus().name());
            stmt.setString(6, course.getLevel().name());
            stmt.setString(7, course.getThumbnailUrl());
            stmt.setInt(8, course.getCapacity());
            stmt.setLong(9, course.getId());

            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error updating course: " + course.getId(), e);
        }
    }

    @Override
    public boolean updateStatus(Long courseId, CourseStatus status) {
        String sql = "UPDATE courses SET status = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, status.name());
            stmt.setLong(2, courseId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error updating course status: " + courseId, e);
        }
    }

    @Override
    public boolean delete(Long id) {
        String sql = "DELETE FROM courses WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to delete course: " + id, e);
        }
    }

    @Override
    public boolean incrementEnrolledCount(Connection conn, Long courseId) {
        // Atomic conditional increment: guarantees enrolled_count < capacity AND status = 'PUBLISHED'
        // Acquires exclusive (X) row lock on courses FIRST, eliminating InnoDB deadlock and race conditions
        String sql = "UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ? AND status = 'PUBLISHED' AND enrolled_count < capacity";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            return stmt.executeUpdate() == 1;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to conditionally increment enrolled count for course: " + courseId, e);
        }
    }

    @Override
    public boolean decrementEnrolledCount(Connection conn, Long courseId) {
        // Atomic conditional decrement: strictly enforces enrolled_count > 0 so counter never drifts negative
        String sql = "UPDATE courses SET enrolled_count = enrolled_count - 1 WHERE id = ? AND enrolled_count > 0";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            return stmt.executeUpdate() == 1;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to decrement enrolled count for course: " + courseId, e);
        }
    }

    @Override
    public int countAll(String category, String status, String search) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM courses c ");
        List<Object> params = new ArrayList<>();
        List<String> conditions = new ArrayList<>();

        if (category != null && !category.isBlank() && !category.equalsIgnoreCase("ALL")) {
            conditions.add("c.category = ?");
            params.add(category);
        }
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            conditions.add("c.status = ?");
            params.add(status.toUpperCase());
        }
        if (search != null && !search.isBlank()) {
            conditions.add("(LOWER(c.title) LIKE ? OR LOWER(c.code) LIKE ?)");
            String pattern = "%" + search.trim().toLowerCase() + "%";
            params.add(pattern);
            params.add(pattern);
        }

        if (!conditions.isEmpty()) {
            sql.append("WHERE ").append(String.join(" AND ", conditions));
        }

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to count courses", e);
        }
        return 0;
    }

    private Course mapRowToCourse(ResultSet rs) throws SQLException {
        Course course = new Course();
        course.setId(rs.getLong("id"));
        course.setTitle(rs.getString("title"));
        course.setCode(rs.getString("code"));
        course.setDescription(rs.getString("description"));
        course.setCategory(rs.getString("category"));
        course.setInstructorId(rs.getLong("instructor_id"));
        course.setInstructorName(rs.getString("instructor_name"));

        String statusStr = rs.getString("status");
        if (statusStr != null) {
            course.setStatus(CourseStatus.valueOf(statusStr));
        }
        String levelStr = rs.getString("level");
        if (levelStr != null) {
            course.setLevel(CourseLevel.valueOf(levelStr));
        }

        course.setThumbnailUrl(rs.getString("thumbnail_url"));
        course.setCapacity(rs.getInt("capacity"));
        course.setEnrolledCount(rs.getInt("enrolled_count"));

        Timestamp created = rs.getTimestamp("created_at");
        if (created != null) {
            course.setCreatedAt(created.toLocalDateTime());
        }
        Timestamp updated = rs.getTimestamp("updated_at");
        if (updated != null) {
            course.setUpdatedAt(updated.toLocalDateTime());
        }

        return course;
    }
}
