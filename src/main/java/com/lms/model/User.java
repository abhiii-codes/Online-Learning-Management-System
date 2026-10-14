package com.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

/**
 * Base domain model for system users.
 * Deliberately demonstrates:
 * 1. Encapsulation: Private fields with validated accessor/mutator methods.
 * 2. Abstraction: Abstract base class representing shared identity and contract.
 * 3. Polymorphism: Abstract methods overridden by StudentUser, InstructorUser, and AdminUser.
 */
public abstract class User implements java.io.Serializable, Comparable<User> {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String passwordHash;

    private Role role;
    private String bio;
    private String avatarUrl;
    private UserStatus status = UserStatus.ACTIVE;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public User() {
    }

    public User(Long id, String name, String email, String passwordHash, Role role, String bio, UserStatus status) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.bio = bio;
        this.status = status != null ? status : UserStatus.ACTIVE;
    }

    /**
     * Polymorphic method: Returns the appropriate client route for this user's dashboard.
     */
    public abstract String getRoleDashboardUrl();

    /**
     * Polymorphic method: Evaluates if this user has broad administrative privileges.
     */
    public abstract boolean hasAdministrativePrivileges();

    /**
     * Polymorphic method: Returns a descriptive title of user capabilities.
     */
    public abstract String getRoleDescription();

    // Encapsulated Getters and Setters with Validation

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("User name cannot be empty.");
        }
        this.name = name.trim();
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Invalid email format.");
        }
        this.email = email.trim().toLowerCase();
    }

    @JsonIgnore
    public String getPasswordHash() {
        return passwordHash;
    }

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public int compareTo(User other) {
        if (other == null) return 1;
        if (this.name == null && other.name == null) return 0;
        if (this.name == null) return -1;
        if (other.name == null) return 1;
        int nameComp = this.name.compareToIgnoreCase(other.name);
        if (nameComp != 0) return nameComp;
        return this.email != null && other.email != null ? this.email.compareToIgnoreCase(other.email) : 0;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User other)) return false;
        return email != null && email.equalsIgnoreCase(other.email);
    }

    @Override
    public int hashCode() {
        return email != null ? email.toLowerCase(java.util.Locale.ROOT).hashCode() : 0;
    }
}
