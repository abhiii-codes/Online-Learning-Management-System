package com.lms.service.impl;

import com.lms.dao.EnrollmentDao;
import com.lms.dao.LessonDao;
import com.lms.dao.QuizDao;
import com.lms.dao.SubmissionDao;
import com.lms.service.GradingStrategy;
import com.lms.service.ProgressService;

import java.util.List;

public class ProgressServiceImpl implements ProgressService {

    private final LessonDao lessonDao;
    private final SubmissionDao submissionDao;
    private final QuizDao quizDao;
    private final EnrollmentDao enrollmentDao;

    public ProgressServiceImpl(LessonDao lessonDao, SubmissionDao submissionDao, QuizDao quizDao, EnrollmentDao enrollmentDao) {
        this.lessonDao = lessonDao;
        this.submissionDao = submissionDao;
        this.quizDao = quizDao;
        this.enrollmentDao = enrollmentDao;
    }

    @Override
    public int calculateCourseProgress(Long studentId, Long courseId) {
        int totalLessons = lessonDao.countTotalLessons(courseId);
        int completedLessons = lessonDao.countCompletedLessons(studentId, courseId);

        int percent = totalLessons > 0 ? (int) Math.round(((double) completedLessons / totalLessons) * 100.0) : 100;
        enrollmentDao.updateProgress(studentId, courseId, percent);
        return percent;
    }

    @Override
    public double calculateStudentCourseGrade(Long studentId, Long courseId, GradingStrategy strategy) {
        if (strategy == null) {
            strategy = new StandardGradingStrategy();
        }

        List<Double> assignmentGrades = submissionDao.findGradesByStudentAndCourse(studentId, courseId);
        List<Integer> quizScores = quizDao.findQuizScoresByStudentAndCourse(studentId, courseId);
        List<Integer> quizMaxPoints = quizDao.findQuizMaxPointsByCourse(courseId);

        return strategy.calculateFinalGrade(assignmentGrades, quizScores, quizMaxPoints);
    }
}
