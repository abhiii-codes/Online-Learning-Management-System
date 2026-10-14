package com.lms.dao.impl;

import com.lms.config.DatabaseConfig;
import com.lms.dao.SubmissionDao;
import com.lms.exception.DatabaseOperationException;
import com.lms.model.Submission;
import com.lms.model.SubmissionStatus;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class SubmissionDaoImpl implements SubmissionDao {

    private static final String SELECT_BASE =
            "SELECT s.id, s.assignment_id, s.student_id, s.submission_text, s.file_url, s.submitted_at, " +
            "s.grade, s.feedback, s.graded_by, s.graded_at, s.status, " +
            "a.title AS assignment_title, u.name AS student_name, u.email AS student_email, g.name AS grader_name " +
            "FROM submissions s " +
            "JOIN assignments a ON s.assignment_id = a.id " +
            "JOIN users u ON s.student_id = u.id " +
            "LEFT JOIN users g ON s.graded_by = g.id ";

    @Override
    public Optional<Submission> findById(Long id) {
        String sql = SELECT_BASE + "WHERE s.id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to find submission by id: " + id, e);
        }
        return Optional.empty();
    }

    @Override
    public Optional<Submission> findByAssignmentAndStudent(Long assignmentId, Long studentId) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return findByAssignmentAndStudent(conn, assignmentId, studentId);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to query student submission", e);
        }
    }

    @Override
    public Optional<Submission> findByAssignmentAndStudent(Connection conn, Long assignmentId, Long studentId) {
        String sql = SELECT_BASE + "WHERE s.assignment_id = ? AND s.student_id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, assignmentId);
            stmt.setLong(2, studentId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error finding submission", e);
        }
        return Optional.empty();
    }

    @Override
    public List<Submission> findByAssignmentId(Long assignmentId) {
        String sql = SELECT_BASE + "WHERE s.assignment_id = ? ORDER BY s.submitted_at DESC";
        List<Submission> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, assignmentId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch submissions for assignment: " + assignmentId, e);
        }
        return list;
    }

    @Override
    public List<Submission> findByStudentId(Long studentId) {
        String sql = SELECT_BASE + "WHERE s.student_id = ? ORDER BY s.submitted_at DESC";
        List<Submission> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, studentId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch student submissions: " + studentId, e);
        }
        return list;
    }

    @Override
    public Submission create(Submission submission) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return create(conn, submission);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to create submission", e);
        }
    }

    @Override
    public Submission create(Connection conn, Submission submission) {
        String sql = "INSERT INTO submissions (assignment_id, student_id, submission_text, file_url, status) " +
                     "VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, submission.getAssignmentId());
            stmt.setLong(2, submission.getStudentId());
            stmt.setString(3, submission.getSubmissionText());
            stmt.setString(4, submission.getFileUrl());
            stmt.setString(5, SubmissionStatus.SUBMITTED.name());

            stmt.executeUpdate();
            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    submission.setId(keys.getLong(1));
                }
            }
            return submission;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error saving submission", e);
        }
    }

    @Override
    public boolean gradeSubmission(Long submissionId, double grade, String feedback, Long gradedBy) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return gradeSubmission(conn, submissionId, grade, feedback, gradedBy);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to grade submission: " + submissionId, e);
        }
    }

    @Override
    public boolean gradeSubmission(Connection conn, Long submissionId, double grade, String feedback, Long gradedBy) {
        String sql = "UPDATE submissions SET grade = ?, feedback = ?, graded_by = ?, graded_at = CURRENT_TIMESTAMP, " +
                     "status = 'GRADED' WHERE id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setDouble(1, grade);
            stmt.setString(2, feedback);
            stmt.setLong(3, gradedBy);
            stmt.setLong(4, submissionId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error grading submission: " + submissionId, e);
        }
    }

    @Override
    public List<Double> findGradesByStudentAndCourse(Long studentId, Long courseId) {
        String sql = "SELECT s.grade FROM submissions s " +
                     "JOIN assignments a ON s.assignment_id = a.id " +
                     "WHERE s.student_id = ? AND a.course_id = ? AND s.grade IS NOT NULL";
        List<Double> grades = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, studentId);
            stmt.setLong(2, courseId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    grades.add(rs.getDouble("grade"));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch student grades", e);
        }
        return grades;
    }

    private Submission mapRow(ResultSet rs) throws SQLException {
        Submission s = new Submission();
        s.setId(rs.getLong("id"));
        s.setAssignmentId(rs.getLong("assignment_id"));
        s.setAssignmentTitle(rs.getString("assignment_title"));
        s.setStudentId(rs.getLong("student_id"));
        s.setStudentName(rs.getString("student_name"));
        s.setStudentEmail(rs.getString("student_email"));
        s.setSubmissionText(rs.getString("submission_text"));
        s.setFileUrl(rs.getString("file_url"));

        Timestamp subTs = rs.getTimestamp("submitted_at");
        if (subTs != null) {
            s.setSubmittedAt(subTs.toLocalDateTime());
        }

        Object gradeObj = rs.getObject("grade");
        if (gradeObj != null) {
            s.setGrade(((Number) gradeObj).doubleValue());
        }

        s.setFeedback(rs.getString("feedback"));
        long graderId = rs.getLong("graded_by");
        if (!rs.wasNull()) {
            s.setGradedBy(graderId);
        }
        s.setGraderName(rs.getString("grader_name"));

        Timestamp gradTs = rs.getTimestamp("graded_at");
        if (gradTs != null) {
            s.setGradedAt(gradTs.toLocalDateTime());
        }

        String statusStr = rs.getString("status");
        if (statusStr != null) {
            s.setStatus(SubmissionStatus.valueOf(statusStr));
        }

        return s;
    }
}
