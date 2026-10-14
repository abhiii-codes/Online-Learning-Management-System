package com.lms.service.impl;

import com.lms.dao.*;
import com.lms.exception.ForbiddenException;
import com.lms.exception.ResourceNotFoundException;
import com.lms.exception.ValidationException;
import com.lms.model.*;
import com.lms.model.Module;
import com.lms.service.CourseService;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class CourseServiceImpl implements CourseService {

    private final CourseDao courseDao;
    private final ModuleDao moduleDao;
    private final LessonDao lessonDao;
    private final AssignmentDao assignmentDao;
    private final QuizDao quizDao;
    private final AuditLogDao auditLogDao;
    private final UserDao userDao;

    public CourseServiceImpl(CourseDao courseDao, ModuleDao moduleDao, LessonDao lessonDao,
                             AssignmentDao assignmentDao, QuizDao quizDao, AuditLogDao auditLogDao,
                             UserDao userDao) {
        this.courseDao = courseDao;
        this.moduleDao = moduleDao;
        this.lessonDao = lessonDao;
        this.assignmentDao = assignmentDao;
        this.quizDao = quizDao;
        this.auditLogDao = auditLogDao;
        this.userDao = userDao;
    }

    public CourseServiceImpl(CourseDao courseDao, ModuleDao moduleDao, LessonDao lessonDao,
                             AssignmentDao assignmentDao, QuizDao quizDao, AuditLogDao auditLogDao) {
        this(courseDao, moduleDao, lessonDao, assignmentDao, quizDao, auditLogDao, null);
    }

    @Override
    public List<Course> listCourses(String category, String status, String search, int page, int size) {
        int offset = Math.max(0, (page - 1) * size);
        return courseDao.findAll(category, status, search, offset, size);
    }

    @Override
    public Course getCourseById(Long id) {
        return courseDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", id));
    }

    @Override
    public Course getCourseDetails(Long id, Long currentUserId) {
        Course course = getCourseById(id);

        // Fetch hierarchical modules and lessons
        List<Module> modules = moduleDao.findByCourseId(id);
        List<Long> completedLessonIds = currentUserId != null
                ? lessonDao.findCompletedLessonIds(currentUserId, id)
                : List.of();
        Set<Long> completedSet = Set.copyOf(completedLessonIds);

        for (Module m : modules) {
            List<Lesson> lessons = lessonDao.findByModuleId(m.getId());
            for (Lesson l : lessons) {
                if (completedSet.contains(l.getId())) {
                    l.setCompleted(true);
                }
            }
            m.setLessons(lessons);
        }
        course.setModules(modules);

        // Fetch assignments with student submission status if logged in
        if (currentUserId != null) {
            course.setAssignments(assignmentDao.findByCourseIdForStudent(id, currentUserId));
            course.setQuizzes(quizDao.findByCourseIdForStudent(id, currentUserId));
        } else {
            course.setAssignments(assignmentDao.findByCourseId(id));
            course.setQuizzes(quizDao.findByCourseId(id));
        }

        return course;
    }

    @Override
    public Course createCourse(Course course, Long instructorId) {
        if (course.getTitle() == null || course.getTitle().isBlank()) {
            throw new ValidationException("Course title is required.");
        }
        if (course.getCode() == null || course.getCode().isBlank()) {
            throw new ValidationException("Course code is required.");
        }
        if (courseDao.findByCode(course.getCode()).isPresent()) {
            throw new ValidationException("A course with code " + course.getCode() + " already exists.");
        }

        // Enforce application-level foreign-key constraint: instructor_id must belong to an INSTRUCTOR/ADMIN
        if (userDao != null) {
            User instructor = userDao.findById(instructorId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", instructorId));
            if (instructor.getRole() != Role.INSTRUCTOR && instructor.getRole() != Role.ADMIN) {
                throw new ValidationException("Course instructor must hold an INSTRUCTOR or ADMIN role (User "
                        + instructorId + " has role " + instructor.getRole() + ").");
            }
        }

        course.setInstructorId(instructorId);
        if (course.getStatus() == null) {
            course.setStatus(CourseStatus.DRAFT);
        }

        Course created = courseDao.create(course);
        auditLogDao.create(new AuditLog(instructorId, "COURSE_CREATED", "COURSE", created.getId(),
                "Course created: " + created.getTitle(), "127.0.0.1"));
        return created;
    }

    @Override
    public Course updateCourse(Course course, Long currentUserId, boolean isAdmin) {
        Course existing = getCourseById(course.getId());
        validateOwnership(existing, currentUserId, isAdmin);

        existing.setTitle(course.getTitle());
        existing.setDescription(course.getDescription());
        existing.setCategory(course.getCategory());
        existing.setLevel(course.getLevel());
        existing.setThumbnailUrl(course.getThumbnailUrl());
        existing.setCapacity(course.getCapacity());

        courseDao.update(existing);
        auditLogDao.create(new AuditLog(currentUserId, "COURSE_UPDATED", "COURSE", existing.getId(),
                "Course updated: " + existing.getTitle(), "127.0.0.1"));
        return existing;
    }

    @Override
    public boolean updateCourseStatus(Long courseId, CourseStatus status, Long currentUserId, boolean isAdmin) {
        Course existing = getCourseById(courseId);
        validateOwnership(existing, currentUserId, isAdmin);

        boolean updated = courseDao.updateStatus(courseId, status);
        if (updated) {
            auditLogDao.create(new AuditLog(currentUserId, "COURSE_STATUS_CHANGED", "COURSE", courseId,
                    "Course status transitioned to " + status.name(), "127.0.0.1"));
        }
        return updated;
    }

    @Override
    public boolean deleteCourse(Long courseId, Long currentUserId, boolean isAdmin) {
        Course existing = getCourseById(courseId);
        validateOwnership(existing, currentUserId, isAdmin);

        boolean deleted = courseDao.delete(courseId);
        if (deleted) {
            auditLogDao.create(new AuditLog(currentUserId, "COURSE_DELETED", "COURSE", courseId,
                    "Course deleted: " + existing.getTitle(), "127.0.0.1"));
        }
        return deleted;
    }

    @Override
    public List<Course> getInstructorCourses(Long instructorId) {
        return courseDao.findByInstructorId(instructorId);
    }

    @Override
    public int countCourses(String category, String status, String search) {
        return courseDao.countAll(category, status, search);
    }

    private void validateOwnership(Course course, Long currentUserId, boolean isAdmin) {
        if (!isAdmin && !course.getInstructorId().equals(currentUserId)) {
            throw new ForbiddenException("Access denied: You do not have permission to manage this course.");
        }
    }
}
