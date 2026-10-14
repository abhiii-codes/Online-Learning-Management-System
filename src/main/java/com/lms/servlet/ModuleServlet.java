package com.lms.servlet;

import com.lms.config.AppContext;
import com.lms.model.Module;
import com.lms.model.Role;
import com.lms.model.User;
import com.lms.service.ModuleService;
import com.lms.util.JsonUtils;
import com.lms.util.SecurityUtils;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

@WebServlet(name = "ModuleServlet", urlPatterns = "/api/modules/*")
public class ModuleServlet extends BaseServlet {

    private final ModuleService moduleService = AppContext.getModuleService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String courseIdStr = req.getParameter("courseId");
        if (courseIdStr != null && !courseIdStr.isBlank()) {
            Long courseId = Long.parseLong(courseIdStr);
            List<Module> modules = moduleService.getModulesForCourse(courseId);
            JsonUtils.sendSuccess(resp, modules);
        } else {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Parameter 'courseId' is required.");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User user = SecurityUtils.requireRole(req, Role.INSTRUCTOR, Role.ADMIN);
        Module module = JsonUtils.readBody(req, Module.class);
        Module created = moduleService.createModule(module, user.getId(), user.getRole() == Role.ADMIN);
        JsonUtils.sendSuccess(resp, HttpServletResponse.SC_CREATED, "Module created successfully", created);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User user = SecurityUtils.requireRole(req, Role.INSTRUCTOR, Role.ADMIN);
        Long id = parseIdFromPath(req);
        if (id == null) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing module ID");
            return;
        }

        Module module = JsonUtils.readBody(req, Module.class);
        module.setId(id);
        Module updated = moduleService.updateModule(module, user.getId(), user.getRole() == Role.ADMIN);
        JsonUtils.sendSuccess(resp, "Module updated successfully", updated);
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User user = SecurityUtils.requireRole(req, Role.INSTRUCTOR, Role.ADMIN);
        Long id = parseIdFromPath(req);
        if (id == null) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing module ID");
            return;
        }

        boolean deleted = moduleService.deleteModule(id, user.getId(), user.getRole() == Role.ADMIN);
        JsonUtils.sendSuccess(resp, "Module deleted successfully", deleted);
    }
}
