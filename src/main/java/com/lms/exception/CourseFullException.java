package com.lms.exception;

/**
 * Thrown when a student attempts to enroll in a course whose capacity has been reached.
 * Maps to HTTP 409 Conflict (request conflicts with current state of resource).
 */
public class CourseFullException extends LmsException {

    public CourseFullException(String message) {
        super(message, 409);
    }

    public CourseFullException(Long courseId, int capacity) {
        super("Course " + courseId + " has reached maximum capacity of " + capacity + " students.", 409);
    }
}
