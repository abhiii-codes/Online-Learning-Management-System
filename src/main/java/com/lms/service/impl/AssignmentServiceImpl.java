package com.lms.service.impl;

import com.lms.dao.AssignmentDao;
import com.lms.dao.CourseDao;
import com.lms.exception.ForbiddenException;
import com.lms.exception.ResourceNotFoundException;
import com.lms.exception.ValidationException;
import com.lms.model.Assignment;
import com.lms.model.Course;
import com.lms.service.AssignmentService;

import java.util.List;

public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentDao assignmentDao;
    private final CourseDao courseDao;

    public AssignmentServiceImpl(AssignmentDao assignmentDao, CourseDao courseDao) {
        this.assignmentDao = assignmentDao;
        this.courseDao = courseDao;
    }

    @Override
    public List<Assignment> getAssignmentsForCourse(Long courseId, Long currentUserId) {
        if (currentUserId != null) {
            return assignmentDao.findByCourseIdForStudent(courseId, currentUserId);
        }
        return assignmentDao.findByCourseId(courseId);
    }

    @Override
    public Assignment getAssignmentById(Long id) {
        return assignmentDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", id));
    }

    @Override
    public Assignment createAssignment(Assignment assignment, Long currentUserId, boolean isAdmin) {
        if (assignment.getTitle() == null || assignment.getTitle().isBlank()) {
            throw new ValidationException("Assignment title is required.");
        }
        if (assignment.getInstructions() == null || assignment.getInstructions().isBlank()) {
            throw new ValidationException("Assignment instructions are required.");
        }
        if (assignment.getDueDate() == null) {
            throw new ValidationException("Due date is required.");
        }

        Course course = courseDao.findById(assignment.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", assignment.getCourseId()));
        if (!isAdmin && !course.getInstructorId().equals(currentUserId)) {
            throw new ForbiddenException("You do not have permission to create assignments for this course.");
        }

        return assignmentDao.create(assignment);
    }

    @Override
    public Assignment updateAssignment(Assignment assignment, Long currentUserId, boolean isAdmin) {
        Assignment existing = getAssignmentById(assignment.getId());
        Course course = courseDao.findById(existing.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", existing.getCourseId()));
        if (!isAdmin && !course.getInstructorId().equals(currentUserId)) {
            throw new ForbiddenException("You do not have permission to modify this assignment.");
        }

        existing.setTitle(assignment.getTitle());
        existing.setInstructions(assignment.getInstructions());
        existing.setMaxPoints(assignment.getMaxPoints());
        existing.setDueDate(assignment.getDueDate());

        assignmentDao.update(existing);
        return existing;
    }

    @Override
    public boolean deleteAssignment(Long id, Long currentUserId, boolean isAdmin) {
        Assignment existing = getAssignmentById(id);
        Course course = courseDao.findById(existing.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", existing.getCourseId()));
        if (!isAdmin && !course.getInstructorId().equals(currentUserId)) {
            throw new ForbiddenException("You do not have permission to delete this assignment.");
        }
        return assignmentDao.delete(id);
    }
}
