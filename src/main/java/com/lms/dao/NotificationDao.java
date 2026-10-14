package com.lms.dao;

import com.lms.model.Notification;

import java.sql.Connection;
import java.util.List;

public interface NotificationDao {

    Notification create(Notification notification);

    Notification create(Connection conn, Notification notification);

    List<Notification> findByUserId(Long userId);

    boolean markAsRead(Long notificationId, Long userId);

    boolean markAllAsRead(Long userId);
}
