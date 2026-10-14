package com.lms.service.impl;

import com.lms.dao.CourseDao;
import com.lms.dao.EnrollmentDao;
import com.lms.dao.LessonDao;
import com.lms.dao.ModuleDao;
import com.lms.exception.ForbiddenException;
import com.lms.exception.ResourceNotFoundException;
import com.lms.exception.ValidationException;
import com.lms.model.Course;
import com.lms.model.Lesson;
import com.lms.model.Module;
import com.lms.service.LessonService;

import java.util.List;

public class LessonServiceImpl implements LessonService {

    private final LessonDao lessonDao;
    private final ModuleDao moduleDao;
    private final CourseDao courseDao;
    private final EnrollmentDao enrollmentDao;

    public LessonServiceImpl(LessonDao lessonDao, ModuleDao moduleDao, CourseDao courseDao, EnrollmentDao enrollmentDao) {
        this.lessonDao = lessonDao;
        this.moduleDao = moduleDao;
        this.courseDao = courseDao;
        this.enrollmentDao = enrollmentDao;
    }

    @Override
    public List<Lesson> getLessonsForModule(Long moduleId) {
        return lessonDao.findByModuleId(moduleId);
    }

    @Override
    public Lesson getLessonById(Long id) {
        return lessonDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", id));
    }

    @Override
    public Lesson createLesson(Lesson lesson, Long currentUserId, boolean isAdmin) {
        if (lesson.getTitle() == null || lesson.getTitle().isBlank()) {
            throw new ValidationException("Lesson title is required.");
        }
        if (lesson.getContentBody() == null || lesson.getContentBody().isBlank()) {
            throw new ValidationException("Lesson content body is required.");
        }

        Module module = moduleDao.findById(lesson.getModuleId())
                .orElseThrow(() -> new ResourceNotFoundException("Module", lesson.getModuleId()));
        Course course = courseDao.findById(module.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", module.getCourseId()));

        if (!isAdmin && !course.getInstructorId().equals(currentUserId)) {
            throw new ForbiddenException("You do not have permission to add lessons to this course.");
        }

        return lessonDao.create(lesson);
    }

    @Override
    public Lesson updateLesson(Lesson lesson, Long currentUserId, boolean isAdmin) {
        Lesson existing = getLessonById(lesson.getId());
        Module module = moduleDao.findById(existing.getModuleId())
                .orElseThrow(() -> new ResourceNotFoundException("Module", existing.getModuleId()));
        Course course = courseDao.findById(module.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", module.getCourseId()));

        if (!isAdmin && !course.getInstructorId().equals(currentUserId)) {
            throw new ForbiddenException("You do not have permission to modify this lesson.");
        }

        existing.setTitle(lesson.getTitle());
        existing.setContentType(lesson.getContentType());
        existing.setContentBody(lesson.getContentBody());
        existing.setDurationMinutes(lesson.getDurationMinutes());
        existing.setOrderIndex(lesson.getOrderIndex());

        lessonDao.update(existing);
        return existing;
    }

    @Override
    public boolean deleteLesson(Long lessonId, Long currentUserId, boolean isAdmin) {
        Lesson existing = getLessonById(lessonId);
        Module module = moduleDao.findById(existing.getModuleId())
                .orElseThrow(() -> new ResourceNotFoundException("Module", existing.getModuleId()));
        Course course = courseDao.findById(module.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", module.getCourseId()));

        if (!isAdmin && !course.getInstructorId().equals(currentUserId)) {
            throw new ForbiddenException("You do not have permission to delete this lesson.");
        }

        return lessonDao.delete(lessonId);
    }

    @Override
    public boolean markLessonComplete(Long userId, Long lessonId) {
        Lesson lesson = getLessonById(lessonId);
        Module module = moduleDao.findById(lesson.getModuleId())
                .orElseThrow(() -> new ResourceNotFoundException("Module", lesson.getModuleId()));
        Long courseId = module.getCourseId();

        boolean marked = lessonDao.markCompleted(userId, lessonId);
        if (marked) {
            // Recalculate course progress
            int total = lessonDao.countTotalLessons(courseId);
            int completed = lessonDao.countCompletedLessons(userId, courseId);
            int percent = total > 0 ? (int) Math.round(((double) completed / total) * 100.0) : 100;
            enrollmentDao.updateProgress(userId, courseId, percent);
        }
        return marked;
    }
}
