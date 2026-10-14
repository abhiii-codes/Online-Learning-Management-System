package com.lms.service.impl;

import com.lms.dao.UserDao;
import com.lms.exception.ResourceNotFoundException;
import com.lms.exception.UnauthorizedException;
import com.lms.exception.ValidationException;
import com.lms.model.StudentUser;
import com.lms.model.User;
import com.lms.model.UserStatus;
import com.lms.service.AuthService;
import com.lms.util.PasswordUtils;

import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public class AuthServiceImpl implements AuthService {

    private final UserDao userDao;

    // Workload-equalizing dummy hash (cost 10) evaluated when email is absent to equalize CPU workload and mitigate timing side-channel attacks
    private static final String WORKLOAD_EQUALIZING_DUMMY_BCRYPT_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

    // Rate limiting: Maximum 5 consecutive failed attempts before a 15-minute lockout window
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCKOUT_DURATION_MS = 15 * 60 * 1000L; // 15 minutes

    private static class FailedLoginRecord {
        final int failureCount;
        final long lockoutUntil;

        FailedLoginRecord(int failureCount, long lockoutUntil) {
            this.failureCount = failureCount;
            this.lockoutUntil = lockoutUntil;
        }
    }

    private static final ConcurrentHashMap<String, FailedLoginRecord> FAILED_LOGIN_ATTEMPTS = new ConcurrentHashMap<>();

    public AuthServiceImpl(UserDao userDao) {
        this.userDao = userDao;
    }

    @Override
    public User authenticate(String email, String plainPassword) {
        if (email == null || email.isBlank() || plainPassword == null || plainPassword.isBlank()) {
            throw new ValidationException("Email and password are required.");
        }

        // Case-insensitive normalization across all database engines (MySQL & H2)
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);

        // Check login throttling lockout
        long now = System.currentTimeMillis();
        FailedLoginRecord record = FAILED_LOGIN_ATTEMPTS.get(normalizedEmail);
        if (record != null && record.lockoutUntil > now) {
            long remainingSeconds = (record.lockoutUntil - now) / 1000L;
            throw new UnauthorizedException("Account login temporarily locked due to consecutive failed attempts. Try again in " + remainingSeconds + " seconds.");
        }

        Optional<User> userOpt = userDao.findByEmail(normalizedEmail);

        // Workload equalization: execute BCrypt cost-10 calculation whether user exists or not
        String hashToCheck = userOpt.map(User::getPasswordHash).orElse(WORKLOAD_EQUALIZING_DUMMY_BCRYPT_HASH);
        boolean passwordValid = PasswordUtils.verifyPassword(plainPassword, hashToCheck);

        if (userOpt.isEmpty() || !passwordValid) {
            // Record failed attempt atomically via ConcurrentHashMap
            FAILED_LOGIN_ATTEMPTS.compute(normalizedEmail, (k, existing) -> {
                boolean lockoutExpired = (existing != null && existing.lockoutUntil > 0L && existing.lockoutUntil <= now);
                int count = (existing == null || lockoutExpired) ? 1 : existing.failureCount + 1;
                long lockUntil = (count >= MAX_FAILED_ATTEMPTS) ? now + LOCKOUT_DURATION_MS : 0L;
                return new FailedLoginRecord(count, lockUntil);
            });
            throw new UnauthorizedException("Invalid email or password.");
        }

        // Successful authentication: clear failure history for this account
        FAILED_LOGIN_ATTEMPTS.remove(normalizedEmail);

        User user = userOpt.get();
        // Check account status strictly AFTER verifying password to prevent user state enumeration
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException("Account is currently " + user.getStatus().name() + ". Contact administrator.");
        }

        return user;
    }

    @Override
    public User registerStudent(String name, String email, String plainPassword) {
        if (name == null || name.isBlank()) {
            throw new ValidationException("Name is required.");
        }
        if (email == null || !email.contains("@")) {
            throw new ValidationException("A valid email address is required.");
        }
        if (plainPassword == null || plainPassword.length() < 6) {
            throw new ValidationException("Password must be at least 6 characters long.");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (userDao.findByEmail(normalizedEmail).isPresent()) {
            throw new ValidationException("An account with this email already exists.");
        }

        StudentUser student = new StudentUser();
        student.setName(name.trim());
        student.setEmail(normalizedEmail);
        student.setPasswordHash(PasswordUtils.hashPassword(plainPassword));
        student.setBio("Enrolled Student");
        student.setStatus(UserStatus.ACTIVE);

        return userDao.create(student);
    }

    @Override
    public User getCurrentUser(Long userId) {
        return userDao.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    }
}
