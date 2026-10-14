package com.lms.exception;

public class ForbiddenException extends LmsException {
    public ForbiddenException(String message) {
        super(message, 403);
    }
}
