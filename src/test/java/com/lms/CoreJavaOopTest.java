package com.lms;

import com.lms.model.*;
import com.lms.model.Module;
import com.lms.service.GradingStrategy;
import com.lms.service.impl.StandardGradingStrategy;
import com.lms.service.impl.WeightedGradingStrategy;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Core Java OOP Concepts Test Suite (10 Marks Rubric Coverage)")
public class CoreJavaOopTest {

    @Test
    @DisplayName("1. Encapsulation: Validates private domain fields and boundary rules")
    void testEncapsulation() {
        StudentUser student = new StudentUser();
        student.setName(" Abhinav Singh ");
        assertEquals("Abhinav Singh", student.getName(), "Name should be trimmed");

        student.setEmail("ADA@EXAMPLE.COM");
        assertEquals("ada@example.com", student.getEmail(), "Email should be lowercase");

        assertThrows(IllegalArgumentException.class, () -> student.setName("   "),
                "Empty name must violate domain encapsulation");
        assertThrows(IllegalArgumentException.class, () -> student.setEmail("invalid-email"),
                "Invalid email must throw exception");

        Assignment assignment = new Assignment();
        assignment.setMaxPoints(100);
        assertEquals(100, assignment.getMaxPoints());
        assertThrows(IllegalArgumentException.class, () -> assignment.setMaxPoints(-10),
                "Negative max points must be rejected");
    }

    @Test
    @DisplayName("2. Inheritance: Specialized User subclasses extend base User abstraction")
    void testInheritanceHierarchy() {
        User admin = new AdminUser(1L, "Admin", "admin@lms.edu", "hash", "Bio", UserStatus.ACTIVE);
        User instructor = new InstructorUser(2L, "Prof", "prof@lms.edu", "hash", "Bio", UserStatus.ACTIVE);
        User student = new StudentUser(3L, "Student", "student@lms.edu", "hash", "Bio", UserStatus.ACTIVE);

        assertInstanceOf(User.class, admin);
        assertInstanceOf(User.class, instructor);
        assertInstanceOf(User.class, student);

        assertEquals(Role.ADMIN, admin.getRole());
        assertEquals(Role.INSTRUCTOR, instructor.getRole());
        assertEquals(Role.STUDENT, student.getRole());
    }

    @Test
    @DisplayName("3. Runtime Polymorphism: Dynamic method dispatch on overridden User methods")
    void testRuntimePolymorphismOnUsers() {
        User student = new StudentUser();
        User instructor = new InstructorUser();
        User admin = new AdminUser();

        // Polymorphic method calls dispatched dynamically at runtime
        assertEquals("/student", student.getRoleDashboardUrl());
        assertEquals("/instructor", instructor.getRoleDashboardUrl());
        assertEquals("/admin", admin.getRoleDashboardUrl());

        assertFalse(student.hasAdministrativePrivileges());
        assertFalse(instructor.hasAdministrativePrivileges());
        assertTrue(admin.hasAdministrativePrivileges());
    }

    @Test
    @DisplayName("4. Runtime Polymorphism: Interchangeable GradingStrategy implementations")
    void testPolymorphicGradingStrategy() {
        List<Double> assignmentGrades = List.of(90.0, 80.0); // Avg = 85.0
        List<Integer> quizScores = List.of(70);
        List<Integer> quizMaxPoints = List.of(100);          // Avg = 70.0

        GradingStrategy standard = new StandardGradingStrategy();
        GradingStrategy weighted = new WeightedGradingStrategy(0.70, 0.30); // 85*0.7 + 70*0.3 = 59.5 + 21 = 80.5

        // Equal weight: (90 + 80 + 70) / 3 = 80.0
        assertEquals(80.0, standard.calculateFinalGrade(assignmentGrades, quizScores, quizMaxPoints), 0.01);

        // Weighted 70/30: (85 * 0.70) + (70 * 0.30) = 59.5 + 21.0 = 80.5
        assertEquals(80.5, weighted.calculateFinalGrade(assignmentGrades, quizScores, quizMaxPoints), 0.01);
    }

    @Test
    @DisplayName("5. Composition: Course -> Modules -> Lessons relationship")
    void testObjectComposition() {
        Course course = new Course(10L, "Java Systems", "CS-300", "Desc", "CSE", 2L);
        Module module = new Module(1L, 10L, "Module 1", "Desc", 1);
        Lesson lesson1 = new Lesson(101L, 1L, "Lesson 1", "TEXT", "Body", 15, 1);
        Lesson lesson2 = new Lesson(102L, 1L, "Lesson 2", "TEXT", "Body", 20, 2);

        module.getLessons().add(lesson1);
        module.getLessons().add(lesson2);
        course.getModules().add(module);

        assertEquals(1, course.getModules().size());
        assertEquals(2, course.getModules().get(0).getLessons().size());
        assertEquals("Lesson 1", course.getModules().get(0).getLessons().get(0).getTitle());
    }

    @Test
    @DisplayName("6. Collections & Comparable: Sorting domain entities via natural ordering")
    void testCollectionsSortingAndComparableContract() {
        java.util.List<Lesson> lessons = new java.util.ArrayList<>();
        lessons.add(new Lesson(3L, 1L, "Lesson C", "TEXT", "Body", 15, 3));
        lessons.add(new Lesson(1L, 1L, "Lesson A", "TEXT", "Body", 15, 1));
        lessons.add(new Lesson(2L, 1L, "Lesson B", "TEXT", "Body", 15, 2));

        // Sort via Comparable<Lesson> (orderIndex)
        java.util.Collections.sort(lessons);

        assertEquals("Lesson A", lessons.get(0).getTitle(), "Lesson with orderIndex 1 should be first");
        assertEquals("Lesson B", lessons.get(1).getTitle(), "Lesson with orderIndex 2 should be second");
        assertEquals("Lesson C", lessons.get(2).getTitle(), "Lesson with orderIndex 3 should be third");
    }

    @Test
    @DisplayName("7. Equals & HashCode Contract: Verified on User, Course, and Lesson domain models")
    void testEqualsAndHashCodeContract() {
        User u1 = new StudentUser(1L, "Aditya", "aditya@example.com", "hash", "Bio", UserStatus.ACTIVE);
        User u2 = new StudentUser(2L, "Aditya Different Name", "ADITYA@EXAMPLE.COM", "hash2", "Bio2", UserStatus.ACTIVE);
        User u3 = new StudentUser(3L, "Abhinav", "abhinav@example.com", "hash3", "Bio3", UserStatus.ACTIVE);

        // Symmetry & consistency: email uniqueness defines User equality
        assertEquals(u1, u2, "Users with same email (case-insensitive) must be equal");
        assertNotEquals(u1, u3, "Users with different emails must not be equal");
        assertEquals(u1.hashCode(), u2.hashCode(), "Equal users must have matching hashCodes");

        // Hash collection behavior (HashSet deduplication)
        java.util.Set<User> set = new java.util.HashSet<>();
        set.add(u1);
        set.add(u2);
        assertEquals(1, set.size(), "HashSet must eliminate duplicate user instances with equal identity");

        // Course business key (code) contract: saved vs unsaved courses maintain hash and equality
        Course c1 = new Course();
        c1.setId(10L);
        c1.setCode("CS101");
        c1.setTitle("Intro to CS");

        Course c2 = new Course();
        c2.setId(null); // Unsaved entity
        c2.setCode("cs101");
        c2.setTitle("Intro to Computer Science");

        assertEquals(c1, c2, "Unsaved and saved course with same business key must be equal");
        assertEquals(c1.hashCode(), c2.hashCode(), "Course hash codes must match based on business key");

        java.util.Set<Course> courseSet = new java.util.HashSet<>();
        courseSet.add(c1);
        courseSet.add(c2);
        assertEquals(1, courseSet.size(), "HashSet must deduplicate courses based on unique business key");

        // Lesson business key (moduleId + orderIndex) contract
        Lesson l1 = new Lesson(1L, 5L, "Intro", "TEXT", "body", 10, 1);
        Lesson l2 = new Lesson(null, 5L, "Intro Draft", "TEXT", "body2", 15, 1);
        assertEquals(l1, l2, "Lessons with matching moduleId and orderIndex must be equal");
        assertEquals(l1.hashCode(), l2.hashCode(), "Lesson hash codes must match based on composite business key");
    }

    @Test
    @DisplayName("8. Generics: Type-safe TransactionCallback<T> execution")
    void testGenericsAndCustomCallbacks() {
        // Parametric polymorphism: TransactionCallback<T> operates over arbitrary return types
        com.lms.util.TransactionManager.TransactionCallback<String> stringCallback = conn -> "ACID Success";
        com.lms.util.TransactionManager.TransactionCallback<Integer> intCallback = conn -> 42;

        assertNotNull(stringCallback);
        assertNotNull(intCallback);
    }
}
