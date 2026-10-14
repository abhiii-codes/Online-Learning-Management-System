package com.lms.service.impl;

import com.lms.dao.UserDao;
import com.lms.exception.ResourceNotFoundException;
import com.lms.exception.ValidationException;
import com.lms.model.User;
import com.lms.service.UserService;
import com.lms.util.PasswordUtils;

import java.util.List;

public class UserServiceImpl implements UserService {

    private final UserDao userDao;

    public UserServiceImpl(UserDao userDao) {
        this.userDao = userDao;
    }

    @Override
    public List<User> listUsers(int page, int size, String roleFilter) {
        int offset = Math.max(0, (page - 1) * size);
        return userDao.findAll(offset, size, roleFilter);
    }

    @Override
    public User getUserById(Long id) {
        return userDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    @Override
    public User createUser(User user, String rawPassword) {
        if (user.getEmail() == null || !user.getEmail().contains("@")) {
            throw new ValidationException("Valid email required.");
        }
        if (rawPassword == null || rawPassword.length() < 6) {
            throw new ValidationException("Password must be at least 6 characters.");
        }
        if (userDao.findByEmail(user.getEmail()).isPresent()) {
            throw new ValidationException("User with email " + user.getEmail() + " already exists.");
        }

        user.setPasswordHash(PasswordUtils.hashPassword(rawPassword));
        return userDao.create(user);
    }

    @Override
    public User updateUser(Long id, User updateRequest) {
        User existing = getUserById(id);
        existing.setName(updateRequest.getName());
        existing.setBio(updateRequest.getBio());
        existing.setAvatarUrl(updateRequest.getAvatarUrl());
        if (updateRequest.getStatus() != null) {
            existing.setStatus(updateRequest.getStatus());
        }
        userDao.update(existing);
        return existing;
    }

    @Override
    public boolean deleteUser(Long id) {
        getUserById(id);
        return userDao.delete(id);
    }

    @Override
    public int countUsers(String roleFilter) {
        return userDao.countAll(roleFilter);
    }
}
