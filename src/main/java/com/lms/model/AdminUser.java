package com.lms.model;

/**
 * Specialized domain model for System Administrators.
 * Demonstrates inheritance and runtime polymorphism.
 */
public class AdminUser extends User {

    private int managedUsersCount;
    private String systemHealthStatus = "OPTIMAL";

    public AdminUser() {
        setRole(Role.ADMIN);
    }

    public AdminUser(Long id, String name, String email, String passwordHash, String bio, UserStatus status) {
        super(id, name, email, passwordHash, Role.ADMIN, bio, status);
    }

    @Override
    public String getRoleDashboardUrl() {
        return "/admin";
    }

    @Override
    public boolean hasAdministrativePrivileges() {
        return true;
    }

    @Override
    public String getRoleDescription() {
        return "System Administrator: Total oversight of user permissions, system configuration, audit logs, and global analytics.";
    }

    public int getManagedUsersCount() {
        return managedUsersCount;
    }

    public void setManagedUsersCount(int managedUsersCount) {
        this.managedUsersCount = managedUsersCount;
    }

    public String getSystemHealthStatus() {
        return systemHealthStatus;
    }

    public void setSystemHealthStatus(String systemHealthStatus) {
        this.systemHealthStatus = systemHealthStatus;
    }
}
