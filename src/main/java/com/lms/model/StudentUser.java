package com.lms.model;

/**
 * Specialized domain model for Students.
 * Demonstrates inheritance and runtime polymorphism.
 */
public class StudentUser extends User {

    private int enrolledCourseCount;
    private int completedCourseCount;
    private double averageGrade;

    public StudentUser() {
        setRole(Role.STUDENT);
    }

    public StudentUser(Long id, String name, String email, String passwordHash, String bio, UserStatus status) {
        super(id, name, email, passwordHash, Role.STUDENT, bio, status);
    }

    @Override
    public String getRoleDashboardUrl() {
        return "/student";
    }

    @Override
    public boolean hasAdministrativePrivileges() {
        return false;
    }

    @Override
    public String getRoleDescription() {
        return "Student Learner: Can browse courses, submit assignments, take quizzes, and track completion progress.";
    }

    public int getEnrolledCourseCount() {
        return enrolledCourseCount;
    }

    public void setEnrolledCourseCount(int enrolledCourseCount) {
        this.enrolledCourseCount = enrolledCourseCount;
    }

    public int getCompletedCourseCount() {
        return completedCourseCount;
    }

    public void setCompletedCourseCount(int completedCourseCount) {
        this.completedCourseCount = completedCourseCount;
    }

    public double getAverageGrade() {
        return averageGrade;
    }

    public void setAverageGrade(double averageGrade) {
        this.averageGrade = averageGrade;
    }
}
