package com.lms.exception;

/**
 * Thrown when a student attempts to enroll in a course they are already actively enrolled in.
 * Maps to HTTP 409 Conflict.
 */
public class AlreadyEnrolledException extends DuplicateEnrollmentException {

    public AlreadyEnrolledException(String message) {
        super(message);
    }

    public AlreadyEnrolledException(Long userId, Long courseId) {
        super(userId, courseId);
    }
}
