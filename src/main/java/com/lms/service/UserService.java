package com.lms.service;

import com.lms.model.User;

import java.util.List;

public interface UserService {

    List<User> listUsers(int page, int size, String roleFilter);

    User getUserById(Long id);

    User createUser(User user, String rawPassword);

    User updateUser(Long id, User updateRequest);

    boolean deleteUser(Long id);

    int countUsers(String roleFilter);
}
