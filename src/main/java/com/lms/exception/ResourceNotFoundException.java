package com.lms.exception;

public class ResourceNotFoundException extends LmsException {
    public ResourceNotFoundException(String message) {
        super(message, 404);
    }

    public ResourceNotFoundException(String resourceName, Object identifier) {
        super(resourceName + " not found with id / key: " + identifier, 404);
    }
}
