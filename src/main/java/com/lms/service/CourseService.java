package com.lms.service;

import com.lms.model.Course;
import com.lms.model.CourseStatus;

import java.util.List;

public interface CourseService {

    List<Course> listCourses(String category, String status, String search, int page, int size);

    Course getCourseById(Long id);

    Course getCourseDetails(Long id, Long currentUserId);

    Course createCourse(Course course, Long instructorId);

    Course updateCourse(Course course, Long currentUserId, boolean isAdmin);

    boolean updateCourseStatus(Long courseId, CourseStatus status, Long currentUserId, boolean isAdmin);

    boolean deleteCourse(Long courseId, Long currentUserId, boolean isAdmin);

    List<Course> getInstructorCourses(Long instructorId);

    int countCourses(String category, String status, String search);
}
