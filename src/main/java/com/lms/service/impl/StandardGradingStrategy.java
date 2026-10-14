package com.lms.service.impl;

import com.lms.service.GradingStrategy;

import java.util.List;

/**
 * Standard equal-weight grading strategy.
 */
public class StandardGradingStrategy implements GradingStrategy {

    @Override
    public double calculateFinalGrade(List<Double> assignmentGrades, List<Integer> quizScores, List<Integer> quizMaxPoints) {
        double totalSum = 0.0;
        int count = 0;

        if (assignmentGrades != null) {
            for (Double g : assignmentGrades) {
                if (g != null) {
                    totalSum += g;
                    count++;
                }
            }
        }

        if (quizScores != null && quizMaxPoints != null) {
            for (int i = 0; i < Math.min(quizScores.size(), quizMaxPoints.size()); i++) {
                int score = quizScores.get(i);
                int max = quizMaxPoints.get(i);
                if (max > 0) {
                    totalSum += ((double) score / max) * 100.0;
                    count++;
                }
            }
        }

        if (count == 0) {
            return 0.0;
        }

        return Math.round((totalSum / count) * 100.0) / 100.0;
    }

    @Override
    public String getStrategyName() {
        return "STANDARD_EQUAL_WEIGHT";
    }
}
