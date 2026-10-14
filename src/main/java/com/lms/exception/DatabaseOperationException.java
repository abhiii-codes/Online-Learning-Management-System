package com.lms.exception;

public class DatabaseOperationException extends LmsException {
    public DatabaseOperationException(String message) {
        super(message, 500);
    }

    public DatabaseOperationException(String message, Throwable cause) {
        super(message, 500, cause);
    }
}
