package com.lms.service;

import java.util.Map;

public interface AnalyticsService {

    Map<String, Object> getAdminDashboardStats();

    Map<String, Object> getInstructorDashboardStats(Long instructorId);

    Map<String, Object> getStudentDashboardStats(Long studentId);
}
