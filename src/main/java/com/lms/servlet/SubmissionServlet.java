package com.lms.servlet;

import com.lms.config.AppContext;
import com.lms.model.Role;
import com.lms.model.Submission;
import com.lms.model.User;
import com.lms.service.SubmissionService;
import com.lms.util.JsonUtils;
import com.lms.util.SecurityUtils;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@WebServlet(name = "SubmissionServlet", urlPatterns = "/api/submissions/*")
public class SubmissionServlet extends BaseServlet {

    private final SubmissionService submissionService = AppContext.getSubmissionService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User currentUser = SecurityUtils.requireUser(req);
        Long id = parseIdFromPath(req);

        if (id != null) {
            boolean isStaff = currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.INSTRUCTOR;
            Submission submission = submissionService.getSubmissionById(id, currentUser.getId(), isStaff, currentUser.getRole() == Role.ADMIN);
            JsonUtils.sendSuccess(resp, submission);
            return;
        }

        String assignmentIdStr = req.getParameter("assignmentId");
        if (assignmentIdStr != null && !assignmentIdStr.isBlank()) {
            Long assignmentId = Long.parseLong(assignmentIdStr);
            if (currentUser.getRole() == Role.STUDENT) {
                // Students can only query their own submission
                Submission sub = submissionService.getStudentSubmission(assignmentId, currentUser.getId());
                JsonUtils.sendSuccess(resp, sub);
            } else {
                // Instructors and Admins view all submissions for the assignment
                List<Submission> list = submissionService.getSubmissionsForAssignment(assignmentId, currentUser.getId(), currentUser.getRole() == Role.ADMIN);
                JsonUtils.sendSuccess(resp, list);
            }
        } else {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Parameter 'assignmentId' or path ID is required.");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User currentUser = SecurityUtils.requireUser(req);
        String path = req.getPathInfo();

        if (path != null && path.contains("/grade")) {
            SecurityUtils.requireRole(req, Role.INSTRUCTOR, Role.ADMIN);
            Long submissionId = Long.parseLong(path.substring(1).replace("/grade", ""));

            @SuppressWarnings("unchecked")
            Map<String, Object> body = JsonUtils.readBody(req, Map.class);
            double grade = Double.parseDouble(body.get("grade").toString());
            String feedback = (String) body.get("feedback");

            Submission graded = submissionService.gradeSubmission(
                    submissionId, grade, feedback, currentUser.getId(), currentUser.getRole() == Role.ADMIN
            );
            JsonUtils.sendSuccess(resp, "Submission graded successfully", graded);
            return;
        }

        // Student submits assignment
        @SuppressWarnings("unchecked")
        Map<String, Object> body = JsonUtils.readBody(req, Map.class);
        Long assignmentId = Long.parseLong(body.get("assignmentId").toString());
        String text = (String) body.get("submissionText");
        String fileUrl = (String) body.get("fileUrl");

        Submission created = submissionService.submitAssignment(assignmentId, currentUser.getId(), text, fileUrl);
        JsonUtils.sendSuccess(resp, HttpServletResponse.SC_CREATED, "Assignment submitted successfully", created);
    }
}
