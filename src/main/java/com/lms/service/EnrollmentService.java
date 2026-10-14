package com.lms.service;

import com.lms.model.Enrollment;

import java.util.List;

public interface EnrollmentService {

    Enrollment enrollStudent(Long userId, Long courseId);

    Enrollment enrollStudent(Long userId, Long courseId, String clientIp);

    List<Enrollment> getStudentEnrollments(Long userId);

    List<Enrollment> getCourseEnrollments(Long courseId, Long currentUserId, boolean isAdmin);

    boolean dropCourse(Long userId, Long courseId);

    boolean dropCourse(Long userId, Long courseId, String clientIp);
}
