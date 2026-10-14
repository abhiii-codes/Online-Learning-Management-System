package com.lms.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Domain model representing a Quiz.
 * Demonstrates composition: A Quiz contains an ordered list of QuizQuestions.
 */
public class Quiz {

    private Long id;
    private Long courseId;
    private String title;
    private String description;
    private int timeLimitMinutes = 30;
    private int passingScore = 60;
    private int maxAttempts = 3;
    private LocalDateTime createdAt;

    // Composition: A Quiz has multiple QuizQuestions
    private List<QuizQuestion> questions = new ArrayList<>();

    // Aggregated / computed stats
    private int questionCount = 0;
    private Integer studentPreviousScore = null;
    private Boolean studentPassed = null;

    public Quiz() {
    }

    public Quiz(Long id, Long courseId, String title, String description, int timeLimitMinutes, int passingScore) {
        this.id = id;
        this.courseId = courseId;
        this.title = title;
        this.description = description;
        this.timeLimitMinutes = timeLimitMinutes;
        this.passingScore = passingScore;
        this.maxAttempts = 3;
    }

    public Quiz(Long id, Long courseId, String title, String description, int timeLimitMinutes, int passingScore, int maxAttempts) {
        this.id = id;
        this.courseId = courseId;
        this.title = title;
        this.description = description;
        this.timeLimitMinutes = timeLimitMinutes;
        this.passingScore = passingScore;
        this.maxAttempts = maxAttempts;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Quiz title cannot be empty.");
        }
        this.title = title.trim();
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getTimeLimitMinutes() {
        return timeLimitMinutes;
    }

    public void setTimeLimitMinutes(int timeLimitMinutes) {
        this.timeLimitMinutes = timeLimitMinutes;
    }

    public int getPassingScore() {
        return passingScore;
    }

    public void setPassingScore(int passingScore) {
        this.passingScore = passingScore;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
        if (maxAttempts <= 0) {
            throw new IllegalArgumentException("Max attempts must be at least 1.");
        }
        this.maxAttempts = maxAttempts;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<QuizQuestion> getQuestions() {
        return questions;
    }

    public void setQuestions(List<QuizQuestion> questions) {
        this.questions = questions != null ? questions : new ArrayList<>();
    }

    public int getQuestionCount() {
        return questionCount;
    }

    public void setQuestionCount(int questionCount) {
        this.questionCount = questionCount;
    }

    public Integer getStudentPreviousScore() {
        return studentPreviousScore;
    }

    public void setStudentPreviousScore(Integer studentPreviousScore) {
        this.studentPreviousScore = studentPreviousScore;
    }

    public Boolean getStudentPassed() {
        return studentPassed;
    }

    public void setStudentPassed(Boolean studentPassed) {
        this.studentPassed = studentPassed;
    }
}
