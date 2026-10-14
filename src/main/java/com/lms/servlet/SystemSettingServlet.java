package com.lms.servlet;

import com.lms.config.AppContext;
import com.lms.dao.SystemSettingDao;
import com.lms.model.Role;
import com.lms.model.SystemSetting;
import com.lms.util.JsonUtils;
import com.lms.util.SecurityUtils;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@WebServlet(name = "SystemSettingServlet", urlPatterns = "/api/settings/*")
public class SystemSettingServlet extends BaseServlet {

    private final SystemSettingDao systemSettingDao = AppContext.getSystemSettingDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<SystemSetting> settings = systemSettingDao.getAllSettings();
        JsonUtils.sendSuccess(resp, settings);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        SecurityUtils.requireRole(req, Role.ADMIN);

        @SuppressWarnings("unchecked")
        Map<String, String> body = JsonUtils.readBody(req, Map.class);
        String key = body.get("key");
        String value = body.get("value");
        String description = body.get("description");

        boolean updated = systemSettingDao.setSetting(key, value, description);
        JsonUtils.sendSuccess(resp, "Setting updated", updated);
    }
}
