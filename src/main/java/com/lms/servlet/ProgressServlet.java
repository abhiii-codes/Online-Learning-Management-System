package com.lms.servlet;

import com.lms.config.AppContext;
import com.lms.model.User;
import com.lms.service.ProgressService;
import com.lms.service.impl.StandardGradingStrategy;
import com.lms.service.impl.WeightedGradingStrategy;
import com.lms.util.JsonUtils;
import com.lms.util.SecurityUtils;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@WebServlet(name = "ProgressServlet", urlPatterns = "/api/progress/*")
public class ProgressServlet extends BaseServlet {

    private final ProgressService progressService = AppContext.getProgressService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User student = SecurityUtils.requireUser(req);
        String courseIdStr = req.getParameter("courseId");

        if (courseIdStr != null && !courseIdStr.isBlank()) {
            Long courseId = Long.parseLong(courseIdStr);

            int progressPercent = progressService.calculateCourseProgress(student.getId(), courseId);
            double standardGrade = progressService.calculateStudentCourseGrade(student.getId(), courseId, new StandardGradingStrategy());
            double weightedGrade = progressService.calculateStudentCourseGrade(student.getId(), courseId, new WeightedGradingStrategy());

            Map<String, Object> map = new HashMap<>();
            map.put("courseId", courseId);
            map.put("studentId", student.getId());
            map.put("progressPercent", progressPercent);
            map.put("standardGrade", standardGrade);
            map.put("weightedGrade", weightedGrade);

            JsonUtils.sendSuccess(resp, map);
        } else {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Parameter 'courseId' is required.");
        }
    }
}
