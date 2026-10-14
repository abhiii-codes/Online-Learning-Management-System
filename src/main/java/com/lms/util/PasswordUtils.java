package com.lms.util;

import org.mindrot.jbcrypt.BCrypt;

/**
 * Utility for secure password hashing and verification using BCrypt.
 * Satisfies security guidelines: never store plain-text passwords.
 */
public final class PasswordUtils {

    private PasswordUtils() {
        // Private constructor for utility class
    }

    /**
     * Hashes a plaintext password using BCrypt with salt rounds = 10.
     *
     * @param plainPassword plaintext string
     * @return 60-character BCrypt hash string
     */
    public static String hashPassword(String plainPassword) {
        if (plainPassword == null || plainPassword.isBlank()) {
            throw new IllegalArgumentException("Password cannot be null or empty.");
        }
        return BCrypt.hashpw(plainPassword, BCrypt.gensalt(10));
    }

    /**
     * Verifies a plaintext candidate password against a BCrypt hash.
     *
     * @param plainPassword plaintext candidate
     * @param hashedPassword existing BCrypt hash
     * @return true if matches, false otherwise
     */
    public static boolean verifyPassword(String plainPassword, String hashedPassword) {
        if (plainPassword == null || hashedPassword == null) {
            return false;
        }
        try {
            return BCrypt.checkpw(plainPassword, hashedPassword);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
