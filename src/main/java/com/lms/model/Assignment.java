package com.lms.model;

import java.time.LocalDateTime;

/**
 * Domain model representing a Course Assignment.
 */
public class Assignment {

    private Long id;
    private Long courseId;
    private String title;
    private String instructions;
    private int maxPoints = 100;
    private LocalDateTime dueDate;
    private LocalDateTime createdAt;

    // Computed attributes for views
    private int submissionCount = 0;
    private boolean submittedByCurrentStudent = false;
    private Double currentStudentGrade = null;

    public Assignment() {
    }

    public Assignment(Long id, Long courseId, String title, String instructions, int maxPoints, LocalDateTime dueDate) {
        this.id = id;
        this.courseId = courseId;
        this.title = title;
        this.instructions = instructions;
        this.maxPoints = maxPoints;
        this.dueDate = dueDate;
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
            throw new IllegalArgumentException("Assignment title cannot be empty.");
        }
        this.title = title.trim();
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public int getMaxPoints() {
        return maxPoints;
    }

    public void setMaxPoints(int maxPoints) {
        if (maxPoints <= 0) {
            throw new IllegalArgumentException("Max points must be greater than zero.");
        }
        this.maxPoints = maxPoints;
    }

    public LocalDateTime getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public int getSubmissionCount() {
        return submissionCount;
    }

    public void setSubmissionCount(int submissionCount) {
        this.submissionCount = submissionCount;
    }

    public boolean isSubmittedByCurrentStudent() {
        return submittedByCurrentStudent;
    }

    public void setSubmittedByCurrentStudent(boolean submittedByCurrentStudent) {
        this.submittedByCurrentStudent = submittedByCurrentStudent;
    }

    public Double getCurrentStudentGrade() {
        return currentStudentGrade;
    }

    public void setCurrentStudentGrade(Double currentStudentGrade) {
        this.currentStudentGrade = currentStudentGrade;
    }
}
