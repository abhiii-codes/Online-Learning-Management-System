package com.lms.dao.impl;

import com.lms.config.DatabaseConfig;
import com.lms.dao.QuizDao;
import com.lms.exception.DatabaseOperationException;
import com.lms.exception.ResourceNotFoundException;
import com.lms.model.Quiz;
import com.lms.model.QuizAttempt;
import com.lms.model.QuizQuestion;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class QuizDaoImpl implements QuizDao {

    @Override
    public Optional<Quiz> findById(Long id) {
        String sql = "SELECT q.id, q.course_id, q.title, q.description, q.time_limit_minutes, q.passing_score, q.max_attempts, q.created_at, " +
                     "(SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count " +
                     "FROM quizzes q WHERE q.id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Quiz q = mapRow(rs);
                    q.setQuestions(findQuestionsByQuizId(id));
                    return Optional.of(q);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to query quiz by id: " + id, e);
        }
        return Optional.empty();
    }

    @Override
    public List<Quiz> findByCourseId(Long courseId) {
        String sql = "SELECT q.id, q.course_id, q.title, q.description, q.time_limit_minutes, q.passing_score, q.max_attempts, q.created_at, " +
                     "(SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count " +
                     "FROM quizzes q WHERE q.course_id = ? ORDER BY q.id ASC";
        List<Quiz> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch quizzes for course: " + courseId, e);
        }
        return list;
    }

    @Override
    public List<Quiz> findByCourseIdForStudent(Long courseId, Long studentId) {
        String sql = "SELECT q.id, q.course_id, q.title, q.description, q.time_limit_minutes, q.passing_score, q.max_attempts, q.created_at, " +
                     "(SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count, " +
                     "(SELECT MAX(qa.score) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = ?) AS student_best_score, " +
                     "(SELECT MAX(qa.passed) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = ?) AS student_passed " +
                     "FROM quizzes q WHERE q.course_id = ? ORDER BY q.id ASC";
        List<Quiz> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, studentId);
            stmt.setLong(2, studentId);
            stmt.setLong(3, courseId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Quiz q = mapRow(rs);
                    Object bestScore = rs.getObject("student_best_score");
                    if (bestScore != null) {
                        q.setStudentPreviousScore(((Number) bestScore).intValue());
                    }
                    Object passedObj = rs.getObject("student_passed");
                    if (passedObj != null) {
                        q.setStudentPassed(rs.getBoolean("student_passed"));
                    }
                    list.add(q);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch student quizzes", e);
        }
        return list;
    }

    @Override
    public Quiz create(Quiz quiz) {
        String sql = "INSERT INTO quizzes (course_id, title, description, time_limit_minutes, passing_score, max_attempts) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, quiz.getCourseId());
            stmt.setString(2, quiz.getTitle());
            stmt.setString(3, quiz.getDescription());
            stmt.setInt(4, quiz.getTimeLimitMinutes());
            stmt.setInt(5, quiz.getPassingScore());
            stmt.setInt(6, quiz.getMaxAttempts());

            stmt.executeUpdate();
            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    quiz.setId(keys.getLong(1));
                }
            }
            return quiz;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error creating quiz: " + quiz.getTitle(), e);
        }
    }

    @Override
    public boolean update(Quiz quiz) {
        String sql = "UPDATE quizzes SET title = ?, description = ?, time_limit_minutes = ?, passing_score = ?, max_attempts = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, quiz.getTitle());
            stmt.setString(2, quiz.getDescription());
            stmt.setInt(3, quiz.getTimeLimitMinutes());
            stmt.setInt(4, quiz.getPassingScore());
            stmt.setInt(5, quiz.getMaxAttempts());
            stmt.setLong(6, quiz.getId());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error updating quiz: " + quiz.getId(), e);
        }
    }

    @Override
    public boolean delete(Long id) {
        String sql = "DELETE FROM quizzes WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to delete quiz: " + id, e);
        }
    }

    @Override
    public List<QuizQuestion> findQuestionsByQuizId(Long quizId) {
        String sql = "SELECT id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, points, order_index " +
                     "FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index ASC, id ASC";
        List<QuizQuestion> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, quizId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    QuizQuestion q = new QuizQuestion();
                    q.setId(rs.getLong("id"));
                    q.setQuizId(rs.getLong("quiz_id"));
                    q.setQuestionText(rs.getString("question_text"));
                    q.setOptionA(rs.getString("option_a"));
                    q.setOptionB(rs.getString("option_b"));
                    q.setOptionC(rs.getString("option_c"));
                    q.setOptionD(rs.getString("option_d"));
                    q.setCorrectOption(rs.getString("correct_option"));
                    q.setPoints(rs.getInt("points"));
                    q.setOrderIndex(rs.getInt("order_index"));
                    list.add(q);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch questions for quiz: " + quizId, e);
        }
        return list;
    }

    @Override
    public QuizQuestion createQuestion(QuizQuestion question) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return createQuestion(conn, question);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error creating quiz question", e);
        }
    }

    @Override
    public QuizQuestion createQuestion(Connection conn, QuizQuestion question) {
        String sql = "INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, points, order_index) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, question.getQuizId());
            stmt.setString(2, question.getQuestionText());
            stmt.setString(3, question.getOptionA());
            stmt.setString(4, question.getOptionB());
            stmt.setString(5, question.getOptionC());
            stmt.setString(6, question.getOptionD());
            stmt.setString(7, question.getCorrectOption());
            stmt.setInt(8, question.getPoints());
            stmt.setInt(9, question.getOrderIndex());

            stmt.executeUpdate();
            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    question.setId(keys.getLong(1));
                }
            }
            return question;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error creating quiz question", e);
        }
    }

    @Override
    public int getNextQuestionOrderIndex(Connection conn, Long quizId) {
        String sql = "SELECT COALESCE(MAX(order_index), 0) + 1 FROM quiz_questions WHERE quiz_id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, quizId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to calculate next question order index for quiz: " + quizId, e);
        }
        return 1;
    }

    @Override
    public void lockQuizForUpdate(Connection conn, Long quizId) {
        String sql = "SELECT id, course_id, passing_score, max_attempts FROM quizzes WHERE id = ? FOR UPDATE";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, quizId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (!rs.next()) {
                    throw new ResourceNotFoundException("Quiz", quizId);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to acquire exclusive lock on quiz: " + quizId, e);
        }
    }

    @Override
    public boolean deleteQuestion(Long questionId) {
        String sql = "DELETE FROM quiz_questions WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, questionId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to delete quiz question: " + questionId, e);
        }
    }

    @Override
    public QuizAttempt saveAttempt(QuizAttempt attempt) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return saveAttempt(conn, attempt);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to save quiz attempt", e);
        }
    }

    @Override
    public QuizAttempt saveAttempt(Connection conn, QuizAttempt attempt) {
        int nextAttempt = getNextAttemptNumber(conn, attempt.getQuizId(), attempt.getStudentId());
        return saveAttempt(conn, attempt, nextAttempt);
    }

    @Override
    public QuizAttempt saveAttempt(Connection conn, QuizAttempt attempt, int attemptNumber) {
        double percentage = attempt.getTotalPossible() > 0
                ? ((double) attempt.getScore() / attempt.getTotalPossible()) * 100.0
                : 0.0;
        String sql = "INSERT INTO quiz_attempts (quiz_id, student_id, attempt_number, score, total_possible, percentage, passed, answers_json) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, attempt.getQuizId());
            stmt.setLong(2, attempt.getStudentId());
            stmt.setInt(3, attemptNumber);
            stmt.setInt(4, attempt.getScore());
            stmt.setInt(5, attempt.getTotalPossible());
            stmt.setDouble(6, percentage);
            stmt.setBoolean(7, attempt.isPassed());
            stmt.setString(8, attempt.getAnswersJson());

            stmt.executeUpdate();
            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    attempt.setId(keys.getLong(1));
                }
            }
            attempt.setAttemptNumber(attemptNumber);
            return attempt;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error saving quiz attempt", e);
        }
    }

    @Override
    public int getNextAttemptNumber(Connection conn, Long quizId, Long studentId) {
        String sql = "SELECT COALESCE(MAX(attempt_number), 0) + 1 FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, quizId);
            stmt.setLong(2, studentId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to calculate next attempt number for quiz " + quizId + " and student " + studentId, e);
        }
        return 1;
    }

    @Override
    public List<QuizAttempt> findAttemptsByStudent(Long studentId, Long quizId) {
        String sql = "SELECT qa.id, qa.quiz_id, qa.student_id, qa.attempt_number, qa.score, qa.total_possible, qa.passed, qa.answers_json, qa.attempted_at, " +
                     "q.title AS quiz_title, u.name AS student_name " +
                     "FROM quiz_attempts qa " +
                     "JOIN quizzes q ON qa.quiz_id = q.id " +
                     "JOIN users u ON qa.student_id = u.id " +
                     "WHERE qa.student_id = ? AND qa.quiz_id = ? ORDER BY qa.attempt_number ASC";
        List<QuizAttempt> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, studentId);
            stmt.setLong(2, quizId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapAttemptRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch student quiz attempts", e);
        }
        return list;
    }

    @Override
    public List<QuizAttempt> findAllAttemptsForQuiz(Long quizId) {
        String sql = "SELECT qa.id, qa.quiz_id, qa.student_id, qa.attempt_number, qa.score, qa.total_possible, qa.passed, qa.answers_json, qa.attempted_at, " +
                     "q.title AS quiz_title, u.name AS student_name " +
                     "FROM quiz_attempts qa " +
                     "JOIN quizzes q ON qa.quiz_id = q.id " +
                     "JOIN users u ON qa.student_id = u.id " +
                     "WHERE qa.quiz_id = ? ORDER BY qa.attempted_at DESC";
        List<QuizAttempt> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, quizId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapAttemptRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch all quiz attempts", e);
        }
        return list;
    }

    @Override
    public List<Integer> findQuizScoresByStudentAndCourse(Long studentId, Long courseId) {
        String sql = "SELECT MAX(qa.score) AS max_score FROM quiz_attempts qa " +
                     "JOIN quizzes q ON qa.quiz_id = q.id " +
                     "WHERE qa.student_id = ? AND q.course_id = ? " +
                     "GROUP BY q.id";
        List<Integer> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, studentId);
            stmt.setLong(2, courseId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(rs.getInt("max_score"));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch student quiz scores", e);
        }
        return list;
    }

    @Override
    public List<Integer> findQuizMaxPointsByCourse(Long courseId) {
        String sql = "SELECT COALESCE(SUM(qq.points), 100) AS total_points FROM quizzes q " +
                     "LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id " +
                     "WHERE q.course_id = ? " +
                     "GROUP BY q.id";
        List<Integer> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(rs.getInt("total_points"));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch course quiz max points", e);
        }
        return list;
    }

    private Quiz mapRow(ResultSet rs) throws SQLException {
        Quiz q = new Quiz();
        q.setId(rs.getLong("id"));
        q.setCourseId(rs.getLong("course_id"));
        q.setTitle(rs.getString("title"));
        q.setDescription(rs.getString("description"));
        q.setTimeLimitMinutes(rs.getInt("time_limit_minutes"));
        q.setPassingScore(rs.getInt("passing_score"));
        try {
            q.setMaxAttempts(rs.getInt("max_attempts"));
        } catch (SQLException ignored) {
            q.setMaxAttempts(3);
        }
        Timestamp ts = rs.getTimestamp("created_at");
        if (ts != null) {
            q.setCreatedAt(ts.toLocalDateTime());
        }
        q.setQuestionCount(rs.getInt("question_count"));
        return q;
    }

    private QuizAttempt mapAttemptRow(ResultSet rs) throws SQLException {
        QuizAttempt qa = new QuizAttempt();
        qa.setId(rs.getLong("id"));
        qa.setQuizId(rs.getLong("quiz_id"));
        qa.setQuizTitle(rs.getString("quiz_title"));
        qa.setStudentId(rs.getLong("student_id"));
        qa.setStudentName(rs.getString("student_name"));
        try {
            qa.setAttemptNumber(rs.getInt("attempt_number"));
        } catch (SQLException ignored) {
            qa.setAttemptNumber(1);
        }
        qa.setScore(rs.getInt("score"));
        qa.setTotalPossible(rs.getInt("total_possible"));
        qa.setPassed(rs.getBoolean("passed"));
        qa.setAnswersJson(rs.getString("answers_json"));
        Timestamp ts = rs.getTimestamp("attempted_at");
        if (ts != null) {
            qa.setAttemptedAt(ts.toLocalDateTime());
        }
        return qa;
    }
}
