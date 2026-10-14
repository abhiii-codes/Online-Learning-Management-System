package com.lms.model;

/**
 * Specialized domain model for Course Instructors.
 * Demonstrates inheritance and runtime polymorphism.
 */
public class InstructorUser extends User {

    private int authoredCourseCount;
    private int pendingGradesCount;
    private String department;

    public InstructorUser() {
        setRole(Role.INSTRUCTOR);
    }

    public InstructorUser(Long id, String name, String email, String passwordHash, String bio, UserStatus status) {
        super(id, name, email, passwordHash, Role.INSTRUCTOR, bio, status);
    }

    @Override
    public String getRoleDashboardUrl() {
        return "/instructor";
    }

    @Override
    public boolean hasAdministrativePrivileges() {
        return false;
    }

    @Override
    public String getRoleDescription() {
        return "Course Instructor: Can create courses, publish content, create assignments, evaluate student submissions, and author quizzes.";
    }

    public int getAuthoredCourseCount() {
        return authoredCourseCount;
    }

    public void setAuthoredCourseCount(int authoredCourseCount) {
        this.authoredCourseCount = authoredCourseCount;
    }

    public int getPendingGradesCount() {
        return pendingGradesCount;
    }

    public void setPendingGradesCount(int pendingGradesCount) {
        this.pendingGradesCount = pendingGradesCount;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }
}
