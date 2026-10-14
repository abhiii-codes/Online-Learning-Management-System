package com.lms.exception;

/**
 * Thrown when a request conflicts with the current state of the resource (e.g. attempt limit exceeded).
 * Maps to HTTP 409 Conflict (RFC 7231 / RFC 9110).
 */
public class ConflictException extends LmsException {

    public ConflictException(String message) {
        super(message, 409);
    }

    public ConflictException(String message, Throwable cause) {
        super(message, 409, cause);
    }
}
