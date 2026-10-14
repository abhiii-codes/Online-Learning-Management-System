package com.lms.dao;

import com.lms.model.User;

import java.sql.Connection;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object contract for User persistence operations.
 * Demonstrates:
 * 1. Interfaces as architectural contracts.
 * 2. Separation of concerns (Zero SQL in Servlets or Services).
 * 3. Connection-overloaded methods for transaction boundaries.
 */
public interface UserDao {

    Optional<User> findById(Long id);

    Optional<User> findById(Connection conn, Long id);

    Optional<User> findByEmail(String email);

    Optional<User> findByEmail(Connection conn, String email);

    List<User> findAll(int offset, int limit, String roleFilter);

    User create(User user);

    User create(Connection conn, User user);

    boolean update(User user);

    boolean update(Connection conn, User user);

    boolean delete(Long id);

    int countAll(String roleFilter);
}
