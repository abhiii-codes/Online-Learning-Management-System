package com.lms.servlet;

import com.lms.config.AppContext;
import com.lms.model.Notification;
import com.lms.model.User;
import com.lms.service.NotificationService;
import com.lms.util.JsonUtils;
import com.lms.util.SecurityUtils;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

@WebServlet(name = "NotificationServlet", urlPatterns = "/api/notifications/*")
public class NotificationServlet extends BaseServlet {

    private final NotificationService notificationService = AppContext.getNotificationService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User user = SecurityUtils.requireUser(req);
        List<Notification> list = notificationService.getUserNotifications(user.getId());
        JsonUtils.sendSuccess(resp, list);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User user = SecurityUtils.requireUser(req);
        String path = req.getPathInfo();

        if ("/read-all".equals(path)) {
            boolean marked = notificationService.markAllAsRead(user.getId());
            JsonUtils.sendSuccess(resp, "All marked read", marked);
            return;
        }

        if (path != null && path.contains("/read")) {
            Long notifId = Long.parseLong(path.substring(1).replace("/read", ""));
            boolean marked = notificationService.markAsRead(notifId, user.getId());
            JsonUtils.sendSuccess(resp, "Notification marked read", marked);
            return;
        }

        resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid notification action.");
    }
}
