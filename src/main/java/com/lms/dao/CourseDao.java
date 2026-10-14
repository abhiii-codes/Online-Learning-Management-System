package com.lms.dao;

import com.lms.model.Course;
import com.lms.model.CourseStatus;

import java.sql.Connection;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object contract for Course persistence operations.
 */
public interface CourseDao {

    Optional<Course> findById(Long id);

    Optional<Course> findById(Connection conn, Long id);

    Optional<Course> findByCode(String code);

    List<Course> findAll(String category, String status, String search, int offset, int limit);

    List<Course> findByInstructorId(Long instructorId);

    Course create(Course course);

    Course create(Connection conn, Course course);

    boolean update(Course course);

    boolean updateStatus(Long courseId, CourseStatus status);

    boolean delete(Long id);

    boolean incrementEnrolledCount(Connection conn, Long courseId);

    boolean decrementEnrolledCount(Connection conn, Long courseId);

    int countAll(String category, String status, String search);
}
