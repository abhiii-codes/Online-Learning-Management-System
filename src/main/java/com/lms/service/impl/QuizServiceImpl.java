package com.lms.service.impl;

import com.lms.dao.*;
import com.lms.dto.CreateQuestionRequest;
import com.lms.dto.CreateQuizRequest;
import com.lms.dto.QuizQuestionStudentDto;
import com.lms.dto.QuizStudentDto;
import com.lms.exception.ConflictException;
import com.lms.exception.ForbiddenException;
import com.lms.exception.ResourceNotFoundException;
import com.lms.exception.ValidationException;
import com.lms.model.*;
import com.lms.service.QuizService;
import com.lms.util.JsonUtils;
import com.lms.util.TransactionManager;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class QuizServiceImpl implements QuizService {

    private final QuizDao quizDao;
    private final CourseDao courseDao;
    private final EnrollmentDao enrollmentDao;
    private final NotificationDao notificationDao;
    private final AuditLogDao auditLogDao;

    public QuizServiceImpl(QuizDao quizDao, CourseDao courseDao, EnrollmentDao enrollmentDao,
                           NotificationDao notificationDao, AuditLogDao auditLogDao) {
        this.quizDao = quizDao;
        this.courseDao = courseDao;
        this.enrollmentDao = enrollmentDao;
        this.notificationDao = notificationDao;
        this.auditLogDao = auditLogDao;
    }

    @Override
    public List<Quiz> getQuizzesForCourse(Long courseId, Long currentUserId) {
        if (currentUserId != null) {
            return quizDao.findByCourseIdForStudent(courseId, currentUserId);
        }
        return quizDao.findByCourseId(courseId);
    }

    @Override
    public Quiz getQuizById(Long id, boolean maskAnswers) {
        Quiz quiz = quizDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", id));

        if (maskAnswers && quiz.getQuestions() != null) {
            List<QuizQuestion> masked = new ArrayList<>();
            for (QuizQuestion q : quiz.getQuestions()) {
                QuizQuestion copy = new QuizQuestion(
                        q.getId(), q.getQuizId(), q.getQuestionText(),
                        q.getOptionA(), q.getOptionB(), q.getOptionC(), q.getOptionD(),
                        null, // MASK CORRECT OPTION FROM CLIENT INSPECTION
                        q.getPoints(), q.getOrderIndex()
                );
                masked.add(copy);
            }
            quiz.setQuestions(masked);
        }

        return quiz;
    }

    @Override
    public Quiz getQuizForInstructorOrAdmin(Long id, Long instructorId, boolean isAdmin) {
        Quiz quiz = quizDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", id));
        Course course = courseDao.findById(quiz.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", quiz.getCourseId()));

        if (!isAdmin && !course.getInstructorId().equals(instructorId)) {
            throw new ForbiddenException("Access denied: You do not have permission to view answer keys for this course.");
        }

        return quiz;
    }

    @Override
    public QuizStudentDto getQuizForStudent(Long id, Long studentId) {
        Quiz quiz = quizDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", id));

        QuizStudentDto dto = new QuizStudentDto();
        dto.setId(quiz.getId());
        dto.setCourseId(quiz.getCourseId());
        dto.setTitle(quiz.getTitle());
        dto.setDescription(quiz.getDescription());
        dto.setTimeLimitMinutes(quiz.getTimeLimitMinutes());
        dto.setPassingScore(quiz.getPassingScore());
        dto.setMaxAttempts(quiz.getMaxAttempts());
        dto.setCreatedAt(quiz.getCreatedAt());

        if (quiz.getQuestions() != null) {
            List<QuizQuestionStudentDto> questions = new ArrayList<>();
            for (QuizQuestion q : quiz.getQuestions()) {
                questions.add(new QuizQuestionStudentDto(
                        q.getId(), q.getQuizId(), q.getQuestionText(),
                        q.getOptionA(), q.getOptionB(), q.getOptionC(), q.getOptionD(),
                        q.getPoints(), q.getOrderIndex()
                ));
            }
            dto.setQuestions(questions);
        }

        if (studentId != null) {
            List<QuizAttempt> attempts = quizDao.findAttemptsByStudent(studentId, id);
            if (!attempts.isEmpty()) {
                int best = attempts.stream().mapToInt(QuizAttempt::getScore).max().orElse(0);
                boolean passed = attempts.stream().anyMatch(QuizAttempt::isPassed);
                dto.setStudentPreviousScore(best);
                dto.setStudentPassed(passed);
            }
        }

        return dto;
    }

    @Override
    public Quiz createQuiz(Quiz quiz, Long instructorId, boolean isAdmin) {
        if (quiz.getTitle() == null || quiz.getTitle().isBlank()) {
            throw new ValidationException("Quiz title is required.");
        }
        Course course = courseDao.findById(quiz.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", quiz.getCourseId()));

        if (!isAdmin && !course.getInstructorId().equals(instructorId)) {
            throw new ForbiddenException("You do not have permission to create quizzes for this course.");
        }

        return quizDao.create(quiz);
    }

    @Override
    public Quiz createQuiz(CreateQuizRequest req, Long instructorId, boolean isAdmin) {
        if (req == null) {
            throw new ValidationException("Quiz creation payload cannot be empty.");
        }
        if (req.getCourseId() == null) {
            throw new ValidationException("Field 'courseId' is required.");
        }
        if (req.getTitle() == null || req.getTitle().isBlank()) {
            throw new ValidationException("Field 'title' is required.");
        }

        Quiz quiz = new Quiz();
        quiz.setCourseId(req.getCourseId());
        quiz.setTitle(req.getTitle().trim());
        quiz.setDescription(req.getDescription() != null ? req.getDescription().trim() : "");
        quiz.setTimeLimitMinutes(req.getTimeLimitMinutes() > 0 ? req.getTimeLimitMinutes() : 30);
        quiz.setPassingScore(req.getPassingScore() >= 0 && req.getPassingScore() <= 100 ? req.getPassingScore() : 60);
        quiz.setMaxAttempts(req.getMaxAttempts() > 0 ? req.getMaxAttempts() : 3);

        return createQuiz(quiz, instructorId, isAdmin);
    }

    @Override
    public QuizQuestion addQuestion(QuizQuestion question, Long instructorId, boolean isAdmin) {
        CreateQuestionRequest req = new CreateQuestionRequest();
        req.setQuestionText(question.getQuestionText());
        req.setOptionA(question.getOptionA());
        req.setOptionB(question.getOptionB());
        req.setOptionC(question.getOptionC());
        req.setOptionD(question.getOptionD());
        req.setCorrectOption(question.getCorrectOption());
        req.setPoints(question.getPoints());
        req.setOrderIndex(question.getOrderIndex());
        return addQuestion(question.getQuizId(), req, instructorId, isAdmin);
    }

    @Override
    public QuizQuestion addQuestion(Long quizId, CreateQuestionRequest req, Long instructorId, boolean isAdmin) {
        if (req == null) {
            throw new ValidationException("Question payload cannot be empty.");
        }
        if (req.getQuestionText() == null || req.getQuestionText().isBlank()) {
            throw new ValidationException("Question text is required.");
        }
        if (req.getOptionA() == null || req.getOptionA().isBlank() ||
            req.getOptionB() == null || req.getOptionB().isBlank() ||
            req.getOptionC() == null || req.getOptionC().isBlank() ||
            req.getOptionD() == null || req.getOptionD().isBlank()) {
            throw new ValidationException("All four options (A, B, C, D) are required.");
        }
        if (req.getCorrectOption() == null || !req.getCorrectOption().trim().toUpperCase(java.util.Locale.ROOT).matches("[A-D]")) {
            throw new ValidationException("Correct option must be one of: A, B, C, D.");
        }

        // Execute question addition inside an atomic transaction with parent quiz lock
        return TransactionManager.execute(conn -> {
            quizDao.lockQuizForUpdate(conn, quizId);

            Quiz quiz = quizDao.findById(quizId)
                    .orElseThrow(() -> new ResourceNotFoundException("Quiz", quizId));
            Course course = courseDao.findById(quiz.getCourseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course", quiz.getCourseId()));

            if (!isAdmin && !course.getInstructorId().equals(instructorId)) {
                throw new ForbiddenException("You do not have permission to add questions to this quiz.");
            }

            int nextOrder = (req.getOrderIndex() != null && req.getOrderIndex() > 0)
                    ? req.getOrderIndex()
                    : quizDao.getNextQuestionOrderIndex(conn, quizId);

            QuizQuestion question = new QuizQuestion();
            question.setQuizId(quizId);
            question.setQuestionText(req.getQuestionText().trim());
            question.setOptionA(req.getOptionA().trim());
            question.setOptionB(req.getOptionB().trim());
            question.setOptionC(req.getOptionC().trim());
            question.setOptionD(req.getOptionD().trim());
            question.setCorrectOption(req.getCorrectOption().trim().toUpperCase(java.util.Locale.ROOT));
            question.setPoints(req.getPoints() > 0 ? req.getPoints() : 10);
            question.setOrderIndex(nextOrder);

            return quizDao.createQuestion(conn, question);
        });
    }

    @Override
    public boolean deleteQuestion(Long questionId, Long instructorId, boolean isAdmin) {
        return quizDao.deleteQuestion(questionId);
    }

    @Override
    public QuizAttempt submitQuizAttempt(Long quizId, Long studentId, Map<Long, String> answers) {
        return submitQuizAttempt(quizId, studentId, answers, Role.STUDENT);
    }

    @Override
    public QuizAttempt submitQuizAttempt(Long quizId, Long studentId, Map<Long, String> answers, Role role) {
        if (role != null && role != Role.STUDENT) {
            throw new ForbiddenException("Access denied: Only registered students can submit quiz attempts.");
        }

        Quiz quiz = quizDao.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", quizId));

        // Enforce active course enrollment requirement
        if (!enrollmentDao.exists(studentId, quiz.getCourseId())) {
            throw new ForbiddenException("You must have an ACTIVE enrollment in this course to attempt this quiz.");
        }

        List<QuizQuestion> questions = quiz.getQuestions();
        if (questions == null || questions.isEmpty()) {
            throw new ValidationException("This quiz currently has no questions.");
        }

        // Validate answer choices: must be valid options A, B, C, D (or null if skipped)
        if (answers != null) {
            for (Map.Entry<Long, String> entry : answers.entrySet()) {
                String choice = entry.getValue();
                if (choice != null && !choice.isBlank()) {
                    String normChoice = choice.trim().toUpperCase(java.util.Locale.ROOT);
                    if (!normChoice.matches("[A-D]")) {
                        throw new ValidationException("Invalid answer selection '" + choice + "' for question " + entry.getKey() + ". Valid choices are A, B, C, D.");
                    }
                }
            }
        }

        int score = 0;
        int totalPossible = 0;
        for (QuizQuestion q : questions) {
            totalPossible += q.getPoints();
            String studentAnswer = answers != null ? answers.get(q.getId()) : null;
            if (studentAnswer != null && studentAnswer.trim().equalsIgnoreCase(q.getCorrectOption())) {
                score += q.getPoints();
            }
        }

        int finalScore = score;
        int finalTotalPossible = totalPossible;
        int percent = totalPossible > 0 ? (int) Math.round(((double) score / totalPossible) * 100.0) : 0;
        boolean passed = percent >= quiz.getPassingScore();

        final String finalAnswersJson;
        String jsonTemp;
        try {
            jsonTemp = JsonUtils.toJson(answers != null ? answers : Map.of());
        } catch (Exception e) {
            jsonTemp = "{}";
        }
        finalAnswersJson = jsonTemp;

        // Execute attempt recording inside an atomic JDBC transaction with parent quiz lock
        return TransactionManager.execute(conn -> {
            // Lock the parent quiz to serialize concurrent attempt evaluation for this quiz
            quizDao.lockQuizForUpdate(conn, quizId);

            int nextAttempt = quizDao.getNextAttemptNumber(conn, quizId, studentId);
            if (nextAttempt > quiz.getMaxAttempts()) {
                throw new ConflictException("Maximum attempt limit (" + quiz.getMaxAttempts() + ") reached for this quiz.");
            }

            QuizAttempt attempt = new QuizAttempt(null, quizId, studentId, finalScore, finalTotalPossible, passed, finalAnswersJson);
            QuizAttempt saved = quizDao.saveAttempt(conn, attempt, nextAttempt);

            Notification notif = new Notification(
                    null,
                    studentId,
                    "Quiz Results: " + quiz.getTitle(),
                    String.format("Attempt #%d - You scored %d / %d (%d%%) - Result: %s",
                            nextAttempt, finalScore, finalTotalPossible, percent, passed ? "PASSED" : "FAILED"),
                    NotificationType.GRADE
            );
            notificationDao.create(conn, notif);

            AuditLog log = new AuditLog(
                    studentId,
                    "QUIZ_ATTEMPTED",
                    "QUIZ",
                    quizId,
                    String.format("Student %d scored %d/%d (Attempt #%d) on quiz %s",
                            studentId, finalScore, finalTotalPossible, nextAttempt, quiz.getTitle()),
                    "127.0.0.1"
            );
            auditLogDao.create(conn, log);

            saved.setQuizTitle(quiz.getTitle());
            return saved;
        });
    }

    @Override
    public List<QuizAttempt> getStudentAttempts(Long studentId, Long quizId) {
        return quizDao.findAttemptsByStudent(studentId, quizId);
    }

    @Override
    public List<QuizAttempt> getQuizAttemptsForInstructor(Long quizId, Long instructorId, boolean isAdmin) {
        Quiz quiz = quizDao.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", quizId));
        Course course = courseDao.findById(quiz.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", quiz.getCourseId()));

        if (!isAdmin && !course.getInstructorId().equals(instructorId)) {
            throw new ForbiddenException("You do not have permission to view attempts for this quiz.");
        }

        return quizDao.findAllAttemptsForQuiz(quizId);
    }
}
