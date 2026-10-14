package com.lms.servlet;

import com.lms.config.AppContext;
import com.lms.model.AuditLog;
import com.lms.model.Role;
import com.lms.service.AuditLogService;
import com.lms.util.JsonUtils;
import com.lms.util.SecurityUtils;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

@WebServlet(name = "AuditLogServlet", urlPatterns = "/api/audit-logs/*")
public class AuditLogServlet extends BaseServlet {

    private final AuditLogService auditLogService = AppContext.getAuditLogService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        SecurityUtils.requireRole(req, Role.ADMIN);
        int limit = getIntParam(req, "limit", 50);
        List<AuditLog> logs = auditLogService.getRecentLogs(limit);
        JsonUtils.sendSuccess(resp, logs);
    }
}
