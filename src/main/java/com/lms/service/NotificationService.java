package com.lms.service;

import com.lms.model.Notification;

import java.util.List;

public interface NotificationService {

    List<Notification> getUserNotifications(Long userId);

    boolean markAsRead(Long notificationId, Long userId);

    boolean markAllAsRead(Long userId);
}
