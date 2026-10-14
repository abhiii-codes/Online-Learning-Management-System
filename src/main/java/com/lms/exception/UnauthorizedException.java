package com.lms.exception;

public class UnauthorizedException extends LmsException {
    public UnauthorizedException(String message) {
        super(message, 401);
    }
}
