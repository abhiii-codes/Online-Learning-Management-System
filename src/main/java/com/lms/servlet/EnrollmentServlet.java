package com.lms.servlet;

import com.lms.config.AppContext;
import com.lms.exception.ResourceNotFoundException;
import com.lms.exception.ValidationException;
import com.lms.model.Enrollment;
import com.lms.model.Role;
import com.lms.model.User;
import com.lms.service.EnrollmentService;
import com.lms.service.UserService;
import com.lms.util.JsonUtils;
import com.lms.util.SecurityUtils;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@WebServlet(name = "EnrollmentServlet", urlPatterns = "/api/enrollments/*")
public class EnrollmentServlet extends BaseServlet {

    private final EnrollmentService enrollmentService = AppContext.getEnrollmentService();
    private final UserService userService = AppContext.getUserService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();
        User currentUser = SecurityUtils.requireUser(req);

        if ("/my".equals(path)) {
            Long targetStudentId = currentUser.getId();
            String requestedStudentId = req.getParameter("studentId");
            if (currentUser.getRole() == Role.ADMIN && requestedStudentId != null && !requestedStudentId.isBlank()) {
                targetStudentId = Long.parseLong(requestedStudentId);
            }
            List<Enrollment> list = enrollmentService.getStudentEnrollments(targetStudentId);
            JsonUtils.sendSuccess(resp, list);
            return;
        }

        if (path == null || path.isEmpty() || "/".equals(path)) {
            String courseIdStr = req.getParameter("courseId");
            if (courseIdStr != null && !courseIdStr.isBlank()) {
                Long courseId = Long.parseLong(courseIdStr);
                List<Enrollment> roster = enrollmentService.getCourseEnrollments(courseId, currentUser.getId(), currentUser.getRole() == Role.ADMIN);
                JsonUtils.sendSuccess(resp, roster);
                return;
            }
            throw new ValidationException("Query parameter 'courseId' is required.");
        }

        throw new ResourceNotFoundException("Endpoint", path);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User currentUser = SecurityUtils.requireRole(req, Role.STUDENT, Role.ADMIN);
        String path = req.getPathInfo();

        // Strict path validation: only permit root ("" / "/" / null) for enroll, or "/drop" for unenroll
        if (path != null && !path.isEmpty() && !"/".equals(path) && !"/drop".equals(path)) {
            throw new ResourceNotFoundException("Endpoint", path);
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> body = JsonUtils.readBody(req, Map.class);
        if (body == null || body.get("courseId") == null) {
            throw new ValidationException("Field 'courseId' is required.");
        }

        Long courseId = Long.parseLong(body.get("courseId").toString());

        // Student Ownership & Admin Delegation Enforcement:
        // Regular students are strictly constrained to their own session user ID.
        // Administrators may optionally provide an explicit 'studentId' parameter to manage enrollments for others.
        Long targetStudentId = currentUser.getId();
        if (currentUser.getRole() == Role.ADMIN && body.get("studentId") != null) {
            targetStudentId = Long.parseLong(body.get("studentId").toString());
            User targetUser = userService.getUserById(targetStudentId);
            if (targetUser.getRole() != Role.STUDENT) {
                throw new ValidationException("Target user " + targetStudentId + " has role " + targetUser.getRole() + ", but only STUDENTS can be enrolled.");
            }
        }

        String clientIp = req.getRemoteAddr();

        if ("/drop".equals(path)) {
            boolean dropped = enrollmentService.dropCourse(targetStudentId, courseId, clientIp);
            JsonUtils.sendSuccess(resp, "Course dropped successfully", dropped);
            return;
        }

        Enrollment enrollment = enrollmentService.enrollStudent(targetStudentId, courseId, clientIp);
        JsonUtils.sendSuccess(resp, HttpServletResponse.SC_CREATED, "Enrolled successfully", enrollment);
    }
}
