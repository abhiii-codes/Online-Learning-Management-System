package com.lms.dao.impl;

import com.lms.config.DatabaseConfig;
import com.lms.dao.AssignmentDao;
import com.lms.exception.DatabaseOperationException;
import com.lms.model.Assignment;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class AssignmentDaoImpl implements AssignmentDao {

    @Override
    public Optional<Assignment> findById(Long id) {
        String sql = "SELECT a.id, a.course_id, a.title, a.instructions, a.max_points, a.due_date, a.created_at, " +
                     "(SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) AS submission_count " +
                     "FROM assignments a WHERE a.id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to query assignment by id: " + id, e);
        }
        return Optional.empty();
    }

    @Override
    public List<Assignment> findByCourseId(Long courseId) {
        String sql = "SELECT a.id, a.course_id, a.title, a.instructions, a.max_points, a.due_date, a.created_at, " +
                     "(SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) AS submission_count " +
                     "FROM assignments a WHERE a.course_id = ? ORDER BY a.due_date ASC";
        List<Assignment> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch course assignments: " + courseId, e);
        }
        return list;
    }

    @Override
    public List<Assignment> findByCourseIdForStudent(Long courseId, Long studentId) {
        String sql = "SELECT a.id, a.course_id, a.title, a.instructions, a.max_points, a.due_date, a.created_at, " +
                     "(SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) AS submission_count, " +
                     "sub.grade AS student_grade, " +
                     "CASE WHEN sub.id IS NOT NULL THEN TRUE ELSE FALSE END AS is_submitted " +
                     "FROM assignments a " +
                     "LEFT JOIN submissions sub ON a.id = sub.assignment_id AND sub.student_id = ? " +
                     "WHERE a.course_id = ? ORDER BY a.due_date ASC";
        List<Assignment> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, studentId);
            stmt.setLong(2, courseId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Assignment a = mapRow(rs);
                    a.setSubmittedByCurrentStudent(rs.getBoolean("is_submitted"));
                    Object gradeObj = rs.getObject("student_grade");
                    if (gradeObj != null) {
                        a.setCurrentStudentGrade(((Number) gradeObj).doubleValue());
                    }
                    list.add(a);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch assignments for student", e);
        }
        return list;
    }

    @Override
    public Assignment create(Assignment assignment) {
        String sql = "INSERT INTO assignments (course_id, title, instructions, max_points, due_date) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, assignment.getCourseId());
            stmt.setString(2, assignment.getTitle());
            stmt.setString(3, assignment.getInstructions());
            stmt.setInt(4, assignment.getMaxPoints());
            stmt.setTimestamp(5, Timestamp.valueOf(assignment.getDueDate()));

            stmt.executeUpdate();
            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    assignment.setId(keys.getLong(1));
                }
            }
            return assignment;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error creating assignment: " + assignment.getTitle(), e);
        }
    }

    @Override
    public boolean update(Assignment assignment) {
        String sql = "UPDATE assignments SET title = ?, instructions = ?, max_points = ?, due_date = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, assignment.getTitle());
            stmt.setString(2, assignment.getInstructions());
            stmt.setInt(3, assignment.getMaxPoints());
            stmt.setTimestamp(4, Timestamp.valueOf(assignment.getDueDate()));
            stmt.setLong(5, assignment.getId());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error updating assignment: " + assignment.getId(), e);
        }
    }

    @Override
    public boolean delete(Long id) {
        String sql = "DELETE FROM assignments WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to delete assignment: " + id, e);
        }
    }

    private Assignment mapRow(ResultSet rs) throws SQLException {
        Assignment a = new Assignment();
        a.setId(rs.getLong("id"));
        a.setCourseId(rs.getLong("course_id"));
        a.setTitle(rs.getString("title"));
        a.setInstructions(rs.getString("instructions"));
        a.setMaxPoints(rs.getInt("max_points"));
        Timestamp dueTs = rs.getTimestamp("due_date");
        if (dueTs != null) {
            a.setDueDate(dueTs.toLocalDateTime());
        }
        Timestamp createdTs = rs.getTimestamp("created_at");
        if (createdTs != null) {
            a.setCreatedAt(createdTs.toLocalDateTime());
        }
        a.setSubmissionCount(rs.getInt("submission_count"));
        return a;
    }
}
