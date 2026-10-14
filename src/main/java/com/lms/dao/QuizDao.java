package com.lms.dao;

import com.lms.model.Quiz;
import com.lms.model.QuizAttempt;
import com.lms.model.QuizQuestion;

import java.sql.Connection;
import java.util.List;
import java.util.Optional;

public interface QuizDao {

    Optional<Quiz> findById(Long id);

    List<Quiz> findByCourseId(Long courseId);

    List<Quiz> findByCourseIdForStudent(Long courseId, Long studentId);

    Quiz create(Quiz quiz);

    boolean update(Quiz quiz);

    boolean delete(Long id);

    List<QuizQuestion> findQuestionsByQuizId(Long quizId);

    QuizQuestion createQuestion(QuizQuestion question);

    QuizQuestion createQuestion(Connection conn, QuizQuestion question);

    boolean deleteQuestion(Long questionId);

    QuizAttempt saveAttempt(QuizAttempt attempt);

    QuizAttempt saveAttempt(Connection conn, QuizAttempt attempt);

    QuizAttempt saveAttempt(Connection conn, QuizAttempt attempt, int attemptNumber);

    int getNextAttemptNumber(Connection conn, Long quizId, Long studentId);

    int getNextQuestionOrderIndex(Connection conn, Long quizId);

    void lockQuizForUpdate(Connection conn, Long quizId);

    List<QuizAttempt> findAttemptsByStudent(Long studentId, Long quizId);

    List<QuizAttempt> findAllAttemptsForQuiz(Long quizId);

    List<Integer> findQuizScoresByStudentAndCourse(Long studentId, Long courseId);

    List<Integer> findQuizMaxPointsByCourse(Long courseId);
}
