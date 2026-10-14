package com.lms.dao;

import com.lms.model.Enrollment;

import java.sql.Connection;
import java.util.List;
import java.util.Optional;

public interface EnrollmentDao {

    Optional<Enrollment> findByUserAndCourse(Long userId, Long courseId);

    Optional<Enrollment> findByUserAndCourse(Connection conn, Long userId, Long courseId);

    List<Enrollment> findByUserId(Long userId);

    List<Enrollment> findByCourseId(Long courseId);

    Enrollment create(Enrollment enrollment);

    Enrollment create(Connection conn, Enrollment enrollment);

    boolean updateProgress(Long userId, Long courseId, int progressPercent);

    boolean updateProgress(Connection conn, Long userId, Long courseId, int progressPercent);

    boolean updateStatus(Long userId, Long courseId, String status);

    boolean updateStatus(Connection conn, Long userId, Long courseId, String status);

    boolean updateStatusIfActive(Connection conn, Long userId, Long courseId, String newStatus);

    boolean updateStatusIfDropped(Connection conn, Long userId, Long courseId, String newStatus);

    boolean exists(Long userId, Long courseId);

    boolean exists(Connection conn, Long userId, Long courseId);

    int countEnrolledStudents(Long courseId);

    int countUserEnrollments(Long userId);
}
