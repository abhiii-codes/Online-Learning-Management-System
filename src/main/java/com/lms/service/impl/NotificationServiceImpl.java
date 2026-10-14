package com.lms.service.impl;

import com.lms.dao.NotificationDao;
import com.lms.model.Notification;
import com.lms.service.NotificationService;

import java.util.List;

public class NotificationServiceImpl implements NotificationService {

    private final NotificationDao notificationDao;

    public NotificationServiceImpl(NotificationDao notificationDao) {
        this.notificationDao = notificationDao;
    }

    @Override
    public List<Notification> getUserNotifications(Long userId) {
        return notificationDao.findByUserId(userId);
    }

    @Override
    public boolean markAsRead(Long notificationId, Long userId) {
        return notificationDao.markAsRead(notificationId, userId);
    }

    @Override
    public boolean markAllAsRead(Long userId) {
        return notificationDao.markAllAsRead(userId);
    }
}
