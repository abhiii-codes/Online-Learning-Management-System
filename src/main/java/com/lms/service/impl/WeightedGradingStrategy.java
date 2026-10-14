package com.lms.service.impl;

import com.lms.service.GradingStrategy;

import java.util.List;

/**
 * Weighted grading strategy assigning 70% weight to assignments and 30% to quizzes.
 */
public class WeightedGradingStrategy implements GradingStrategy {

    private final double assignmentWeight;
    private final double quizWeight;

    public WeightedGradingStrategy() {
        this(0.70, 0.30);
    }

    public WeightedGradingStrategy(double assignmentWeight, double quizWeight) {
        this.assignmentWeight = assignmentWeight;
        this.quizWeight = quizWeight;
    }

    @Override
    public double calculateFinalGrade(List<Double> assignmentGrades, List<Integer> quizScores, List<Integer> quizMaxPoints) {
        double assignmentAvg = 0.0;
        int assignCount = 0;
        if (assignmentGrades != null && !assignmentGrades.isEmpty()) {
            double sum = 0.0;
            for (Double g : assignmentGrades) {
                if (g != null) {
                    sum += g;
                    assignCount++;
                }
            }
            if (assignCount > 0) {
                assignmentAvg = sum / assignCount;
            }
        }

        double quizAvg = 0.0;
        int quizCount = 0;
        if (quizScores != null && quizMaxPoints != null) {
            double sum = 0.0;
            for (int i = 0; i < Math.min(quizScores.size(), quizMaxPoints.size()); i++) {
                int max = quizMaxPoints.get(i);
                if (max > 0) {
                    sum += ((double) quizScores.get(i) / max) * 100.0;
                    quizCount++;
                }
            }
            if (quizCount > 0) {
                quizAvg = sum / quizCount;
            }
        }

        if (assignCount == 0 && quizCount == 0) {
            return 0.0;
        }

        if (assignCount > 0 && quizCount == 0) {
            return Math.round(assignmentAvg * 100.0) / 100.0;
        }

        if (quizCount > 0 && assignCount == 0) {
            return Math.round(quizAvg * 100.0) / 100.0;
        }

        double finalGrade = (assignmentAvg * assignmentWeight) + (quizAvg * quizWeight);
        return Math.round(finalGrade * 100.0) / 100.0;
    }

    @Override
    public String getStrategyName() {
        return "WEIGHTED_70_30";
    }
}
