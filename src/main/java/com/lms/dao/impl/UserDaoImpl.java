package com.lms.dao.impl;

import com.lms.config.DatabaseConfig;
import com.lms.dao.UserDao;
import com.lms.exception.DatabaseOperationException;
import com.lms.model.*;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * JDBC Implementation of UserDao.
 * Demonstrates:
 * 1. Parameterized SQL with PreparedStatement (SQL Injection prevention).
 * 2. Polymorphic Domain Object instantiation from JDBC ResultSets.
 * 3. Modern Java try-with-resources resource management.
 * 4. Checked SQLException translation to meaningful custom unchecked exceptions.
 */
public class UserDaoImpl implements UserDao {

    private static final String SELECT_BASE =
            "SELECT id, name, email, password_hash, role, bio, avatar_url, status, created_at, updated_at FROM users ";

    @Override
    public Optional<User> findById(Long id) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return findById(conn, id);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to find user by id: " + id, e);
        }
    }

    @Override
    public Optional<User> findById(Connection conn, Long id) {
        String sql = SELECT_BASE + "WHERE id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToUser(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to query user by id: " + id, e);
        }
        return Optional.empty();
    }

    @Override
    public Optional<User> findByEmail(String email) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return findByEmail(conn, email);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to find user by email: " + email, e);
        }
    }

    @Override
    public Optional<User> findByEmail(Connection conn, String email) {
        String sql = SELECT_BASE + "WHERE LOWER(email) = LOWER(?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToUser(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to query user by email: " + email, e);
        }
        return Optional.empty();
    }

    @Override
    public List<User> findAll(int offset, int limit, String roleFilter) {
        StringBuilder sql = new StringBuilder(SELECT_BASE);
        boolean hasFilter = roleFilter != null && !roleFilter.isBlank() && !roleFilter.equalsIgnoreCase("ALL");
        if (hasFilter) {
            sql.append("WHERE role = ? ");
        }
        sql.append("ORDER BY id DESC LIMIT ? OFFSET ?");

        List<User> users = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {

            int paramIndex = 1;
            if (hasFilter) {
                stmt.setString(paramIndex++, roleFilter.toUpperCase());
            }
            stmt.setInt(paramIndex++, limit);
            stmt.setInt(paramIndex, offset);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    users.add(mapRowToUser(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch user list", e);
        }
        return users;
    }

    @Override
    public User create(User user) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return create(conn, user);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to create user: " + user.getEmail(), e);
        }
    }

    @Override
    public User create(Connection conn, User user) {
        String sql = "INSERT INTO users (name, email, password_hash, role, bio, avatar_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, user.getName());
            stmt.setString(2, user.getEmail().toLowerCase());
            stmt.setString(3, user.getPasswordHash());
            stmt.setString(4, user.getRole().name());
            stmt.setString(5, user.getBio());
            stmt.setString(6, user.getAvatarUrl());
            stmt.setString(7, user.getStatus() != null ? user.getStatus().name() : UserStatus.ACTIVE.name());

            int affected = stmt.executeUpdate();
            if (affected == 0) {
                throw new DatabaseOperationException("Creating user failed, no rows affected.");
            }

            try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    user.setId(generatedKeys.getLong(1));
                } else {
                    throw new DatabaseOperationException("Creating user failed, no ID obtained.");
                }
            }
            return user;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error creating user: " + user.getEmail(), e);
        }
    }

    @Override
    public boolean update(User user) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return update(conn, user);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to update user: " + user.getId(), e);
        }
    }

    @Override
    public boolean update(Connection conn, User user) {
        String sql = "UPDATE users SET name = ?, bio = ?, avatar_url = ?, status = ? WHERE id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, user.getName());
            stmt.setString(2, user.getBio());
            stmt.setString(3, user.getAvatarUrl());
            stmt.setString(4, user.getStatus().name());
            stmt.setLong(5, user.getId());

            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error updating user: " + user.getId(), e);
        }
    }

    @Override
    public boolean delete(Long id) {
        String sql = "DELETE FROM users WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to delete user with id: " + id, e);
        }
    }

    @Override
    public int countAll(String roleFilter) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM users ");
        boolean hasFilter = roleFilter != null && !roleFilter.isBlank() && !roleFilter.equalsIgnoreCase("ALL");
        if (hasFilter) {
            sql.append("WHERE role = ?");
        }

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            if (hasFilter) {
                stmt.setString(1, roleFilter.toUpperCase());
            }
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to count users", e);
        }
        return 0;
    }

    /**
     * Polymorphically maps a JDBC ResultSet row to the appropriate User domain subclass.
     */
    private User mapRowToUser(ResultSet rs) throws SQLException {
        Role role = Role.valueOf(rs.getString("role"));
        User user;
        switch (role) {
            case ADMIN:
                user = new AdminUser();
                break;
            case INSTRUCTOR:
                user = new InstructorUser();
                break;
            case STUDENT:
            default:
                user = new StudentUser();
                break;
        }

        user.setId(rs.getLong("id"));
        user.setName(rs.getString("name"));
        user.setEmail(rs.getString("email"));
        user.setPasswordHash(rs.getString("password_hash"));
        user.setRole(role);
        user.setBio(rs.getString("bio"));
        user.setAvatarUrl(rs.getString("avatar_url"));

        String statusStr = rs.getString("status");
        if (statusStr != null) {
            user.setStatus(UserStatus.valueOf(statusStr));
        }

        Timestamp createdTs = rs.getTimestamp("created_at");
        if (createdTs != null) {
            user.setCreatedAt(createdTs.toLocalDateTime());
        }
        Timestamp updatedTs = rs.getTimestamp("updated_at");
        if (updatedTs != null) {
            user.setUpdatedAt(updatedTs.toLocalDateTime());
        }

        return user;
    }
}
