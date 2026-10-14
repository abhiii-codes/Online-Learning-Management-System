package com.lms.servlet;

import com.lms.config.AppContext;
import com.lms.dto.CreateQuestionRequest;
import com.lms.dto.CreateQuizRequest;
import com.lms.dto.QuizStudentDto;
import com.lms.dto.SubmitQuizRequest;
import com.lms.exception.ForbiddenException;
import com.lms.exception.ResourceNotFoundException;
import com.lms.exception.ValidationException;
import com.lms.model.*;
import com.lms.service.QuizService;
import com.lms.util.JsonUtils;
import com.lms.util.SecurityUtils;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Quiz REST Servlet controller.
 * Demonstrates:
 * 1. Strict regex-based path routing table preventing unintended path fallthroughs.
 * 2. Role-based endpoint authorization (instructors own courses; students submit attempts).
 * 3. DTO boundary separation: answer keys stripped via QuizStudentDto for student views.
 * 4. Zero Tomcat HTML error pages: all errors throw domain exceptions intercepted by BaseServlet.
 */
@WebServlet(name = "QuizServlet", urlPatterns = "/api/quizzes/*")
public class QuizServlet extends BaseServlet {

    private final QuizService quizService = AppContext.getQuizService();

    private static final Pattern QUIZ_BY_ID_PATTERN = Pattern.compile("^/(\\d+)$");
    private static final Pattern QUIZ_ATTEMPTS_PATTERN = Pattern.compile("^/(\\d+)/attempts$");
    private static final Pattern QUIZ_QUESTIONS_PATTERN = Pattern.compile("^/(\\d+)/questions$");
    private static final Pattern QUIZ_SUBMIT_PATTERN = Pattern.compile("^/(\\d+)/submit$");
    private static final Pattern DELETE_QUESTION_PATTERN = Pattern.compile("^/(\\d+)/questions/(\\d+)$");

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();
        Optional<User> currentUser = SecurityUtils.getCurrentUser(req);

        // 1. GET /api/quizzes?courseId={id}
        if (path == null || path.isEmpty() || "/".equals(path)) {
            String courseIdStr = req.getParameter("courseId");
            if (courseIdStr != null && !courseIdStr.isBlank()) {
                Long courseId;
                try {
                    courseId = Long.parseLong(courseIdStr.trim());
                } catch (NumberFormatException e) {
                    throw new ValidationException("Query parameter 'courseId' must be a valid integer.");
                }
                Long userId = currentUser.map(User::getId).orElse(null);
                List<Quiz> quizzes = quizService.getQuizzesForCourse(courseId, userId);
                JsonUtils.sendSuccess(resp, quizzes);
                return;
            }
            throw new ValidationException("Query parameter 'courseId' is required.");
        }

        // 2. GET /api/quizzes/{id}/attempts
        Matcher attemptsMatcher = QUIZ_ATTEMPTS_PATTERN.matcher(path);
        if (attemptsMatcher.matches()) {
            User user = SecurityUtils.requireUser(req);
            Long quizId = Long.parseLong(attemptsMatcher.group(1));
            if (user.getRole() == Role.STUDENT) {
                List<QuizAttempt> attempts = quizService.getStudentAttempts(user.getId(), quizId);
                JsonUtils.sendSuccess(resp, attempts);
            } else {
                List<QuizAttempt> attempts = quizService.getQuizAttemptsForInstructor(quizId, user.getId(), user.getRole() == Role.ADMIN);
                JsonUtils.sendSuccess(resp, attempts);
            }
            return;
        }

        // 3. GET /api/quizzes/{id}
        Matcher quizMatcher = QUIZ_BY_ID_PATTERN.matcher(path);
        if (quizMatcher.matches()) {
            Long quizId = Long.parseLong(quizMatcher.group(1));
            if (currentUser.isPresent() && (currentUser.get().getRole() == Role.ADMIN || currentUser.get().getRole() == Role.INSTRUCTOR)) {
                try {
                    Quiz fullQuiz = quizService.getQuizForInstructorOrAdmin(quizId, currentUser.get().getId(), currentUser.get().getRole() == Role.ADMIN);
                    JsonUtils.sendSuccess(resp, fullQuiz);
                    return;
                } catch (ForbiddenException fe) {
                    // Instructor does not own this course: drop through to student DTO view (answers stripped)
                }
            }

            Long studentId = currentUser.map(User::getId).orElse(null);
            QuizStudentDto studentView = quizService.getQuizForStudent(quizId, studentId);
            JsonUtils.sendSuccess(resp, studentView);
            return;
        }

        throw new ResourceNotFoundException("Endpoint", path);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();

        // 1. POST /api/quizzes (or /) -> Create Quiz
        if (path == null || path.isEmpty() || "/".equals(path)) {
            User user = SecurityUtils.requireRole(req, Role.INSTRUCTOR, Role.ADMIN);
            CreateQuizRequest reqDto = JsonUtils.readBody(req, CreateQuizRequest.class);
            if (reqDto == null) {
                throw new ValidationException("Request body cannot be empty.");
            }
            Quiz created = quizService.createQuiz(reqDto, user.getId(), user.getRole() == Role.ADMIN);
            JsonUtils.sendSuccess(resp, HttpServletResponse.SC_CREATED, "Quiz created successfully", created);
            return;
        }

        // 2. POST /api/quizzes/{id}/submit -> Submit Quiz Attempt
        Matcher submitMatcher = QUIZ_SUBMIT_PATTERN.matcher(path);
        if (submitMatcher.matches()) {
            User student = SecurityUtils.requireRole(req, Role.STUDENT);
            Long quizId = Long.parseLong(submitMatcher.group(1));

            SubmitQuizRequest reqDto = JsonUtils.readBody(req, SubmitQuizRequest.class);
            if (reqDto == null) {
                throw new ValidationException("Request body cannot be empty.");
            }

            QuizAttempt attempt = quizService.submitQuizAttempt(quizId, student.getId(), reqDto.getAnswers(), student.getRole());
            JsonUtils.sendSuccess(resp, HttpServletResponse.SC_CREATED, "Quiz attempt evaluated", attempt);
            return;
        }

        // 3. POST /api/quizzes/{id}/questions -> Add Question
        Matcher questionsMatcher = QUIZ_QUESTIONS_PATTERN.matcher(path);
        if (questionsMatcher.matches()) {
            User user = SecurityUtils.requireRole(req, Role.INSTRUCTOR, Role.ADMIN);
            Long quizId = Long.parseLong(questionsMatcher.group(1));

            CreateQuestionRequest reqDto = JsonUtils.readBody(req, CreateQuestionRequest.class);
            if (reqDto == null) {
                throw new ValidationException("Request body cannot be empty.");
            }

            QuizQuestion created = quizService.addQuestion(quizId, reqDto, user.getId(), user.getRole() == Role.ADMIN);
            JsonUtils.sendSuccess(resp, HttpServletResponse.SC_CREATED, "Question added", created);
            return;
        }

        throw new ResourceNotFoundException("Endpoint", path);
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User user = SecurityUtils.requireRole(req, Role.INSTRUCTOR, Role.ADMIN);
        String path = req.getPathInfo();

        if (path != null) {
            Matcher delMatcher = DELETE_QUESTION_PATTERN.matcher(path);
            if (delMatcher.matches()) {
                Long questionId = Long.parseLong(delMatcher.group(2));
                boolean deleted = quizService.deleteQuestion(questionId, user.getId(), user.getRole() == Role.ADMIN);
                JsonUtils.sendSuccess(resp, "Question deleted", deleted);
                return;
            }
        }

        throw new ResourceNotFoundException("Endpoint", path);
    }
}
