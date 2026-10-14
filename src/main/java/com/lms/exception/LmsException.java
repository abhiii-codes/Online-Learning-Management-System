package com.lms.exception;

/**
 * Base custom unchecked exception for the LMS application.
 * Demonstrates custom exception hierarchy and error handling design.
 */
public class LmsException extends RuntimeException {

    private final int statusCode;

    public LmsException(String message) {
        super(message);
        this.statusCode = 500;
    }

    public LmsException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public LmsException(String message, Throwable cause) {
        super(message, cause);
        this.statusCode = 500;
    }

    public LmsException(String message, int statusCode, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
