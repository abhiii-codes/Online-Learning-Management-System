package com.lms.service;

import com.lms.model.User;

public interface AuthService {

    User authenticate(String email, String plainPassword);

    User registerStudent(String name, String email, String plainPassword);

    User getCurrentUser(Long userId);
}
