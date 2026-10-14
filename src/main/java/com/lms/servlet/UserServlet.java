package com.lms.servlet;

import com.lms.config.AppContext;
import com.lms.model.AdminUser;
import com.lms.model.InstructorUser;
import com.lms.model.Role;
import com.lms.model.StudentUser;
import com.lms.model.User;
import com.lms.model.UserStatus;
import com.lms.service.UserService;
import com.lms.util.JsonUtils;
import com.lms.util.SecurityUtils;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet(name = "UserServlet", urlPatterns = "/api/users/*")
public class UserServlet extends BaseServlet {

    private final UserService userService = AppContext.getUserService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        SecurityUtils.requireRole(req, Role.ADMIN);

        Long id = parseIdFromPath(req);
        if (id != null) {
            User user = userService.getUserById(id);
            JsonUtils.sendSuccess(resp, user);
            return;
        }

        int page = getIntParam(req, "page", 1);
        int size = getIntParam(req, "size", 20);
        String roleFilter = req.getParameter("role");

        List<User> list = userService.listUsers(page, size, roleFilter);
        int total = userService.countUsers(roleFilter);

        Map<String, Object> result = new HashMap<>();
        result.put("users", list);
        result.put("total", total);
        result.put("page", page);
        result.put("size", size);

        JsonUtils.sendSuccess(resp, result);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        SecurityUtils.requireRole(req, Role.ADMIN);

        @SuppressWarnings("unchecked")
        Map<String, Object> body = JsonUtils.readBody(req, Map.class);
        String name = (String) body.get("name");
        String email = (String) body.get("email");
        String password = (String) body.get("password");
        String roleStr = (String) body.get("role");
        String bio = (String) body.get("bio");

        Role role = roleStr != null ? Role.valueOf(roleStr.toUpperCase()) : Role.STUDENT;
        User user;
        switch (role) {
            case ADMIN -> user = new AdminUser();
            case INSTRUCTOR -> user = new InstructorUser();
            default -> user = new StudentUser();
        }
        user.setName(name);
        user.setEmail(email);
        user.setRole(role);
        user.setBio(bio);
        user.setStatus(UserStatus.ACTIVE);

        User created = userService.createUser(user, password);
        JsonUtils.sendSuccess(resp, HttpServletResponse.SC_CREATED, "User created successfully", created);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User currentUser = SecurityUtils.requireUser(req);
        Long id = parseIdFromPath(req);
        if (id == null) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing user ID");
            return;
        }

        if (currentUser.getRole() != Role.ADMIN && !currentUser.getId().equals(id)) {
            resp.sendError(HttpServletResponse.SC_FORBIDDEN, "Cannot update other users");
            return;
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> body = JsonUtils.readBody(req, Map.class);
        User updateRequest = new StudentUser();
        updateRequest.setName((String) body.get("name"));
        updateRequest.setBio((String) body.get("bio"));
        updateRequest.setAvatarUrl((String) body.get("avatarUrl"));
        if (body.get("status") != null && currentUser.getRole() == Role.ADMIN) {
            updateRequest.setStatus(UserStatus.valueOf(((String) body.get("status")).toUpperCase()));
        }

        User updated = userService.updateUser(id, updateRequest);
        JsonUtils.sendSuccess(resp, "User updated successfully", updated);
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        SecurityUtils.requireRole(req, Role.ADMIN);
        Long id = parseIdFromPath(req);
        if (id == null) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing user ID");
            return;
        }

        boolean deleted = userService.deleteUser(id);
        JsonUtils.sendSuccess(resp, "User deleted successfully", deleted);
    }
}
