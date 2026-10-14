package com.lms.servlet;

import com.lms.config.AppContext;
import com.lms.model.Assignment;
import com.lms.model.Role;
import com.lms.model.User;
import com.lms.service.AssignmentService;
import com.lms.util.JsonUtils;
import com.lms.util.SecurityUtils;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@WebServlet(name = "AssignmentServlet", urlPatterns = "/api/assignments/*")
public class AssignmentServlet extends BaseServlet {

    private final AssignmentService assignmentService = AppContext.getAssignmentService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Long id = parseIdFromPath(req);
        if (id != null) {
            Assignment assignment = assignmentService.getAssignmentById(id);
            JsonUtils.sendSuccess(resp, assignment);
            return;
        }

        String courseIdStr = req.getParameter("courseId");
        if (courseIdStr != null && !courseIdStr.isBlank()) {
            Long courseId = Long.parseLong(courseIdStr);
            Optional<User> currentUser = SecurityUtils.getCurrentUser(req);
            Long userId = currentUser.map(User::getId).orElse(null);
            List<Assignment> list = assignmentService.getAssignmentsForCourse(courseId, userId);
            JsonUtils.sendSuccess(resp, list);
        } else {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Parameter 'courseId' is required.");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User user = SecurityUtils.requireRole(req, Role.INSTRUCTOR, Role.ADMIN);
        Assignment assignment = JsonUtils.readBody(req, Assignment.class);
        Assignment created = assignmentService.createAssignment(assignment, user.getId(), user.getRole() == Role.ADMIN);
        JsonUtils.sendSuccess(resp, HttpServletResponse.SC_CREATED, "Assignment created successfully", created);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User user = SecurityUtils.requireRole(req, Role.INSTRUCTOR, Role.ADMIN);
        Long id = parseIdFromPath(req);
        if (id == null) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing assignment ID");
            return;
        }

        Assignment assignment = JsonUtils.readBody(req, Assignment.class);
        assignment.setId(id);
        Assignment updated = assignmentService.updateAssignment(assignment, user.getId(), user.getRole() == Role.ADMIN);
        JsonUtils.sendSuccess(resp, "Assignment updated successfully", updated);
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User user = SecurityUtils.requireRole(req, Role.INSTRUCTOR, Role.ADMIN);
        Long id = parseIdFromPath(req);
        if (id == null) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing assignment ID");
            return;
        }

        boolean deleted = assignmentService.deleteAssignment(id, user.getId(), user.getRole() == Role.ADMIN);
        JsonUtils.sendSuccess(resp, "Assignment deleted successfully", deleted);
    }
}
