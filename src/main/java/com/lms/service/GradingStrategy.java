package com.lms.service;

import java.util.List;

/**
 * Strategy interface for polymorphic student course grade calculations.
 * Deliberately demonstrates Core Java Interfaces and Runtime Polymorphism.
 */
public interface GradingStrategy {

    /**
     * Calculates the aggregate final course grade percentage (0.0 to 100.0).
     *
     * @param assignmentGrades list of student percentage scores on assignments
     * @param quizScores list of points scored on quizzes
     * @param quizMaxPoints list of maximum possible points for respective quizzes
     * @return computed final grade percentage
     */
    double calculateFinalGrade(List<Double> assignmentGrades, List<Integer> quizScores, List<Integer> quizMaxPoints);

    /**
     * Returns the human-readable identifier of this strategy.
     */
    String getStrategyName();
}
