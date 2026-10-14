package com.lms.exception;

public class DuplicateEnrollmentException extends DuplicateKeyException {

    public DuplicateEnrollmentException(String message) {
        super(message);
    }

    public DuplicateEnrollmentException(Long userId, Long courseId) {
        super("User " + userId + " is already enrolled in course " + courseId);
    }
}
