package com.lms.service;

public interface ProgressService {

    int calculateCourseProgress(Long studentId, Long courseId);

    double calculateStudentCourseGrade(Long studentId, Long courseId, GradingStrategy strategy);
}
