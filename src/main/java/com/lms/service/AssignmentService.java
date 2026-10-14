package com.lms.service;

import com.lms.model.Assignment;

import java.util.List;

public interface AssignmentService {

    List<Assignment> getAssignmentsForCourse(Long courseId, Long currentUserId);

    Assignment getAssignmentById(Long id);

    Assignment createAssignment(Assignment assignment, Long currentUserId, boolean isAdmin);

    Assignment updateAssignment(Assignment assignment, Long currentUserId, boolean isAdmin);

    boolean deleteAssignment(Long id, Long currentUserId, boolean isAdmin);
}
