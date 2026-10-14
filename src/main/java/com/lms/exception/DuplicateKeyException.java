package com.lms.exception;

/**
 * Thrown when a unique key constraint violation occurs in the database (e.g. MySQL 1062, SQLState 23505).
 * Maps to HTTP 409 Conflict.
 */
public class DuplicateKeyException extends LmsException {

    public DuplicateKeyException(String message) {
        super(message, 409);
    }

    public DuplicateKeyException(String message, Throwable cause) {
        super(message, 409, cause);
    }
}
