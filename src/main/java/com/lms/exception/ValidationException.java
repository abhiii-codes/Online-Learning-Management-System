package com.lms.exception;

public class ValidationException extends LmsException {
    public ValidationException(String message) {
        super(message, 400);
    }
}
