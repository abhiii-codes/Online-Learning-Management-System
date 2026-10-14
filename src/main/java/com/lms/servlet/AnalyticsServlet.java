package com.lms.servlet;

import com.lms.config.AppContext;
import com.lms.model.Role;
import com.lms.model.User;
import com.lms.service.AnalyticsService;
import com.lms.util.JsonUtils;
import com.lms.util.SecurityUtils;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;

@WebServlet(name = "AnalyticsServlet", urlPatterns = "/api/analytics/*")
public class AnalyticsServlet extends BaseServlet {

    private final AnalyticsService analyticsService = AppContext.getAnalyticsService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User currentUser = SecurityUtils.requireUser(req);
        String path = req.getPathInfo();

        if ("/admin".equals(path)) {
            SecurityUtils.requireRole(req, Role.ADMIN);
            Map<String, Object> stats = analyticsService.getAdminDashboardStats();
            JsonUtils.sendSuccess(resp, stats);
            return;
        }

        if ("/instructor".equals(path)) {
            SecurityUtils.requireRole(req, Role.INSTRUCTOR, Role.ADMIN);
            Map<String, Object> stats = analyticsService.getInstructorDashboardStats(currentUser.getId());
            JsonUtils.sendSuccess(resp, stats);
            return;
        }

        if ("/student".equals(path)) {
            Map<String, Object> stats = analyticsService.getStudentDashboardStats(currentUser.getId());
            JsonUtils.sendSuccess(resp, stats);
            return;
        }

        resp.sendError(HttpServletResponse.SC_NOT_FOUND, "Analytics endpoint not found.");
    }
}
