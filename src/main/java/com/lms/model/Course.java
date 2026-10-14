package com.lms.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Domain model representing an LMS Course.
 * Demonstrates:
 * 1. Encapsulation: private properties with accessors.
 * 2. Composition: A Course contains an ordered collection of Modules, Assignments, and Quizzes.
 */
public class Course implements Comparable<Course> {

    private Long id;
    private String title;
    private String code;
    private String description;
    private String category;
    private Long instructorId;
    private String instructorName;
    private CourseStatus status = CourseStatus.DRAFT;
    private CourseLevel level = CourseLevel.BEGINNER;
    private String thumbnailUrl;
    private int capacity = 100;
    private int enrolledCount = 0;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Composition relationships
    private List<Module> modules = new ArrayList<>();
    private List<Assignment> assignments = new ArrayList<>();
    private List<Quiz> quizzes = new ArrayList<>();

    public Course() {
    }

    public Course(Long id, String title, String code, String description, String category, Long instructorId) {
        this.id = id;
        this.title = title;
        this.code = code;
        this.description = description;
        this.category = category;
        this.instructorId = instructorId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Course title cannot be empty.");
        }
        this.title = title.trim();
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            throw new IllegalArgumentException("Course code cannot be empty.");
        }
        this.code = code.trim().toUpperCase();
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Long getInstructorId() {
        return instructorId;
    }

    public void setInstructorId(Long instructorId) {
        this.instructorId = instructorId;
    }

    public String getInstructorName() {
        return instructorName;
    }

    public void setInstructorName(String instructorName) {
        this.instructorName = instructorName;
    }

    public CourseStatus getStatus() {
        return status;
    }

    public void setStatus(CourseStatus status) {
        this.status = status;
    }

    public CourseLevel getLevel() {
        return level;
    }

    public void setLevel(CourseLevel level) {
        this.level = level;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public int getEnrolledCount() {
        return enrolledCount;
    }

    public void setEnrolledCount(int enrolledCount) {
        this.enrolledCount = enrolledCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<Module> getModules() {
        return modules;
    }

    public void setModules(List<Module> modules) {
        this.modules = modules != null ? modules : new ArrayList<>();
    }

    public List<Assignment> getAssignments() {
        return assignments;
    }

    public void setAssignments(List<Assignment> assignments) {
        this.assignments = assignments != null ? assignments : new ArrayList<>();
    }

    public List<Quiz> getQuizzes() {
        return quizzes;
    }

    public void setQuizzes(List<Quiz> quizzes) {
        this.quizzes = quizzes != null ? quizzes : new ArrayList<>();
    }

    @Override
    public int compareTo(Course other) {
        if (other == null) return 1;
        int titleComp = String.CASE_INSENSITIVE_ORDER.compare(
                this.title != null ? this.title : "",
                other.title != null ? other.title : ""
        );
        if (titleComp != 0) return titleComp;
        return String.CASE_INSENSITIVE_ORDER.compare(
                this.code != null ? this.code : "",
                other.code != null ? other.code : ""
        );
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Course other)) return false;
        return code != null && code.equalsIgnoreCase(other.code);
    }

    @Override
    public int hashCode() {
        return code != null ? code.toUpperCase(java.util.Locale.ROOT).hashCode() : 0;
    }
}
