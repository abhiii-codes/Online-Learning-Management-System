package com.lms.servlet;

import com.lms.config.AppContext;
import com.lms.model.Lesson;
import com.lms.model.Role;
import com.lms.model.User;
import com.lms.service.LessonService;
import com.lms.util.JsonUtils;
import com.lms.util.SecurityUtils;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebServlet(name = "LessonServlet", urlPatterns = "/api/lessons/*")
public class LessonServlet extends BaseServlet {

    private final LessonService lessonService = AppContext.getLessonService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Long id = parseIdFromPath(req);
        if (id != null) {
            Lesson lesson = lessonService.getLessonById(id);
            JsonUtils.sendSuccess(resp, lesson);
        } else {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing lesson ID");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();
        if (path != null && path.contains("/complete")) {
            User student = SecurityUtils.requireUser(req);
            Long lessonId = Long.parseLong(path.substring(1).replace("/complete", ""));
            boolean completed = lessonService.markLessonComplete(student.getId(), lessonId);
            JsonUtils.sendSuccess(resp, "Lesson marked as complete", completed);
            return;
        }

        User user = SecurityUtils.requireRole(req, Role.INSTRUCTOR, Role.ADMIN);
        Lesson lesson = JsonUtils.readBody(req, Lesson.class);
        Lesson created = lessonService.createLesson(lesson, user.getId(), user.getRole() == Role.ADMIN);
        JsonUtils.sendSuccess(resp, HttpServletResponse.SC_CREATED, "Lesson created successfully", created);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User user = SecurityUtils.requireRole(req, Role.INSTRUCTOR, Role.ADMIN);
        Long id = parseIdFromPath(req);
        if (id == null) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing lesson ID");
            return;
        }

        Lesson lesson = JsonUtils.readBody(req, Lesson.class);
        lesson.setId(id);
        Lesson updated = lessonService.updateLesson(lesson, user.getId(), user.getRole() == Role.ADMIN);
        JsonUtils.sendSuccess(resp, "Lesson updated successfully", updated);
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User user = SecurityUtils.requireRole(req, Role.INSTRUCTOR, Role.ADMIN);
        Long id = parseIdFromPath(req);
        if (id == null) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing lesson ID");
            return;
        }

        boolean deleted = lessonService.deleteLesson(id, user.getId(), user.getRole() == Role.ADMIN);
        JsonUtils.sendSuccess(resp, "Lesson deleted successfully", deleted);
    }
}
