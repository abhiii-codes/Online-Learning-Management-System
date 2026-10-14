package com.lms.servlet;

import com.lms.config.AppContext;
import com.lms.model.Course;
import com.lms.model.CourseStatus;
import com.lms.model.Role;
import com.lms.model.User;
import com.lms.service.CourseService;
import com.lms.util.JsonUtils;
import com.lms.util.SecurityUtils;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@WebServlet(name = "CourseServlet", urlPatterns = "/api/courses/*")
public class CourseServlet extends BaseServlet {

    private final CourseService courseService = AppContext.getCourseService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();
        Optional<User> currentUser = SecurityUtils.getCurrentUser(req);

        if ("/instructor".equals(path)) {
            User user = SecurityUtils.requireRole(req, Role.INSTRUCTOR, Role.ADMIN);
            List<Course> courses = courseService.getInstructorCourses(user.getId());
            JsonUtils.sendSuccess(resp, courses);
            return;
        }

        Long id = parseIdFromPath(req);
        if (id != null) {
            Long userId = currentUser.map(User::getId).orElse(null);
            Course course = courseService.getCourseDetails(id, userId);
            JsonUtils.sendSuccess(resp, course);
            return;
        }

        // List courses
        int page = getIntParam(req, "page", 1);
        int size = getIntParam(req, "size", 12);
        String category = req.getParameter("category");
        String search = req.getParameter("search");
        String status = req.getParameter("status");

        // Non-admin/non-instructor users see only PUBLISHED courses by default
        if (status == null || status.isBlank()) {
            boolean isStaff = currentUser.isPresent() &&
                    (currentUser.get().getRole() == Role.ADMIN || currentUser.get().getRole() == Role.INSTRUCTOR);
            if (!isStaff) {
                status = "PUBLISHED";
            }
        }

        List<Course> courses = courseService.listCourses(category, status, search, page, size);
        int total = courseService.countCourses(category, status, search);

        Map<String, Object> result = new HashMap<>();
        result.put("courses", courses);
        result.put("total", total);
        result.put("page", page);
        result.put("size", size);

        JsonUtils.sendSuccess(resp, result);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User user = SecurityUtils.requireRole(req, Role.INSTRUCTOR, Role.ADMIN);
        String path = req.getPathInfo();

        if (path != null && path.contains("/publish")) {
            Long courseId = extractIdFromSubpath(path, "/publish");
            boolean updated = courseService.updateCourseStatus(courseId, CourseStatus.PUBLISHED, user.getId(), user.getRole() == Role.ADMIN);
            JsonUtils.sendSuccess(resp, "Course published successfully", updated);
            return;
        }

        if (path != null && path.contains("/archive")) {
            Long courseId = extractIdFromSubpath(path, "/archive");
            boolean updated = courseService.updateCourseStatus(courseId, CourseStatus.ARCHIVED, user.getId(), user.getRole() == Role.ADMIN);
            JsonUtils.sendSuccess(resp, "Course archived successfully", updated);
            return;
        }

        Course course = JsonUtils.readBody(req, Course.class);
        Course created = courseService.createCourse(course, user.getId());
        JsonUtils.sendSuccess(resp, HttpServletResponse.SC_CREATED, "Course created successfully", created);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User user = SecurityUtils.requireRole(req, Role.INSTRUCTOR, Role.ADMIN);
        Long id = parseIdFromPath(req);
        if (id == null) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing course ID");
            return;
        }

        Course course = JsonUtils.readBody(req, Course.class);
        course.setId(id);
        Course updated = courseService.updateCourse(course, user.getId(), user.getRole() == Role.ADMIN);
        JsonUtils.sendSuccess(resp, "Course updated successfully", updated);
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User user = SecurityUtils.requireRole(req, Role.INSTRUCTOR, Role.ADMIN);
        Long id = parseIdFromPath(req);
        if (id == null) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing course ID");
            return;
        }

        boolean deleted = courseService.deleteCourse(id, user.getId(), user.getRole() == Role.ADMIN);
        JsonUtils.sendSuccess(resp, "Course deleted successfully", deleted);
    }

    private Long extractIdFromSubpath(String path, String actionSuffix) {
        String trimmed = path.substring(1).replace(actionSuffix, "");
        try {
            return Long.parseLong(trimmed);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
