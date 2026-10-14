package com.lms.dto;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Student-facing Quiz DTO.
 * Exposes quiz metadata and questions without any answer keys.
 */
public class QuizStudentDto implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long courseId;
    private String title;
    private String description;
    private int timeLimitMinutes;
    private int passingScore;
    private int maxAttempts;
    private LocalDateTime createdAt;
    private List<QuizQuestionStudentDto> questions = new ArrayList<>();
    private Integer studentPreviousScore;
    private Boolean studentPassed;

    public QuizStudentDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getTimeLimitMinutes() { return timeLimitMinutes; }
    public void setTimeLimitMinutes(int timeLimitMinutes) { this.timeLimitMinutes = timeLimitMinutes; }

    public int getPassingScore() { return passingScore; }
    public void setPassingScore(int passingScore) { this.passingScore = passingScore; }

    public int getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(int maxAttempts) { this.maxAttempts = maxAttempts; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<QuizQuestionStudentDto> getQuestions() { return questions; }
    public void setQuestions(List<QuizQuestionStudentDto> questions) { this.questions = questions; }

    public Integer getStudentPreviousScore() { return studentPreviousScore; }
    public void setStudentPreviousScore(Integer studentPreviousScore) { this.studentPreviousScore = studentPreviousScore; }

    public Boolean getStudentPassed() { return studentPassed; }
    public void setStudentPassed(Boolean studentPassed) { this.studentPassed = studentPassed; }
}
