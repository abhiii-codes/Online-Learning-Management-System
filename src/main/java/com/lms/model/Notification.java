package com.lms.model;

import java.time.LocalDateTime;

/**
 * Domain model representing in-app user notifications.
 */
public class Notification {

    private Long id;
    private Long userId;
    private String title;
    private String message;
    private NotificationType type = NotificationType.INFO;
    private boolean read = false;
    private LocalDateTime createdAt;

    public Notification() {
    }

    public Notification(Long id, Long userId, String title, String message, NotificationType type) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.message = message;
        this.type = type != null ? type : NotificationType.INFO;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
