package com.lms.model;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Domain model representing a Lesson within a Module.
 */
public class Lesson implements java.io.Serializable, Comparable<Lesson> {

    private static final long serialVersionUID = 1L;

    private Long id;
    private Long moduleId;
    private String title;
    private String contentType = "TEXT";
    private String contentBody;
    private int durationMinutes = 15;
    private int orderIndex = 1;
    private boolean completed = false; // Evaluated dynamically for the active student
    private LocalDateTime createdAt;

    public Lesson() {
    }

    public Lesson(Long id, Long moduleId, String title, String contentType, String contentBody, int durationMinutes, int orderIndex) {
        this.id = id;
        this.moduleId = moduleId;
        this.title = title;
        this.contentType = contentType != null ? contentType : "TEXT";
        this.contentBody = contentBody;
        this.durationMinutes = durationMinutes;
        this.orderIndex = orderIndex;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getModuleId() {
        return moduleId;
    }

    public void setModuleId(Long moduleId) {
        this.moduleId = moduleId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Lesson title cannot be empty.");
        }
        this.title = title.trim();
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getContentBody() {
        return contentBody;
    }

    public void setContentBody(String contentBody) {
        this.contentBody = contentBody;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(int durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public int getOrderIndex() {
        return orderIndex;
    }

    public void setOrderIndex(int orderIndex) {
        this.orderIndex = orderIndex;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public int compareTo(Lesson other) {
        if (this == other) return 0;
        if (other == null) return 1;
        int modComp = Objects.compare(this.moduleId, other.moduleId, java.util.Comparator.nullsFirst(Long::compareTo));
        if (modComp != 0) return modComp;
        return Integer.compare(this.orderIndex, other.orderIndex);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Lesson other)) return false;
        return Objects.equals(moduleId, other.moduleId) && orderIndex == other.orderIndex;
    }

    @Override
    public int hashCode() {
        return Objects.hash(moduleId, orderIndex);
    }
}
