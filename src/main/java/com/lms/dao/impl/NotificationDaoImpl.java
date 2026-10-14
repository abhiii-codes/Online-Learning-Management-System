package com.lms.dao.impl;

import com.lms.config.DatabaseConfig;
import com.lms.dao.NotificationDao;
import com.lms.exception.DatabaseOperationException;
import com.lms.model.Notification;
import com.lms.model.NotificationType;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class NotificationDaoImpl implements NotificationDao {

    @Override
    public Notification create(Notification notification) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return create(conn, notification);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to persist notification", e);
        }
    }

    @Override
    public Notification create(Connection conn, Notification notification) {
        String sql = "INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, notification.getUserId());
            stmt.setString(2, notification.getTitle());
            stmt.setString(3, notification.getMessage());
            stmt.setString(4, notification.getType() != null ? notification.getType().name() : NotificationType.INFO.name());
            stmt.setBoolean(5, notification.isRead());

            stmt.executeUpdate();
            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    notification.setId(keys.getLong(1));
                }
            }
            return notification;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error creating notification", e);
        }
    }

    @Override
    public List<Notification> findByUserId(Long userId) {
        String sql = "SELECT id, user_id, title, message, type, is_read, created_at FROM notifications " +
                     "WHERE user_id = ? ORDER BY created_at DESC LIMIT 50";
        List<Notification> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Notification n = new Notification();
                    n.setId(rs.getLong("id"));
                    n.setUserId(rs.getLong("user_id"));
                    n.setTitle(rs.getString("title"));
                    n.setMessage(rs.getString("message"));
                    String typeStr = rs.getString("type");
                    if (typeStr != null) {
                        n.setType(NotificationType.valueOf(typeStr));
                    }
                    n.setRead(rs.getBoolean("is_read"));
                    Timestamp ts = rs.getTimestamp("created_at");
                    if (ts != null) {
                        n.setCreatedAt(ts.toLocalDateTime());
                    }
                    list.add(n);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch user notifications: " + userId, e);
        }
        return list;
    }

    @Override
    public boolean markAsRead(Long notificationId, Long userId) {
        String sql = "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, notificationId);
            stmt.setLong(2, userId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to mark notification read", e);
        }
    }

    @Override
    public boolean markAllAsRead(Long userId) {
        String sql = "UPDATE notifications SET is_read = TRUE WHERE user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to mark all notifications read", e);
        }
    }
}
