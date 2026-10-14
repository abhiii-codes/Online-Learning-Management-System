package com.lms.service;

import com.lms.dto.CreateQuestionRequest;
import com.lms.dto.CreateQuizRequest;
import com.lms.dto.QuizStudentDto;
import com.lms.model.Quiz;
import com.lms.model.QuizAttempt;
import com.lms.model.QuizQuestion;
import com.lms.model.Role;

import java.util.List;
import java.util.Map;

public interface QuizService {

    List<Quiz> getQuizzesForCourse(Long courseId, Long currentUserId);

    Quiz getQuizById(Long id, boolean maskAnswers);

    Quiz getQuizForInstructorOrAdmin(Long id, Long instructorId, boolean isAdmin);

    QuizStudentDto getQuizForStudent(Long id, Long studentId);

    Quiz createQuiz(Quiz quiz, Long instructorId, boolean isAdmin);

    Quiz createQuiz(CreateQuizRequest req, Long instructorId, boolean isAdmin);

    QuizQuestion addQuestion(QuizQuestion question, Long instructorId, boolean isAdmin);

    QuizQuestion addQuestion(Long quizId, CreateQuestionRequest req, Long instructorId, boolean isAdmin);

    boolean deleteQuestion(Long questionId, Long instructorId, boolean isAdmin);

    QuizAttempt submitQuizAttempt(Long quizId, Long studentId, Map<Long, String> answers);

    QuizAttempt submitQuizAttempt(Long quizId, Long studentId, Map<Long, String> answers, Role role);

    List<QuizAttempt> getStudentAttempts(Long studentId, Long quizId);

    List<QuizAttempt> getQuizAttemptsForInstructor(Long quizId, Long instructorId, boolean isAdmin);
}
