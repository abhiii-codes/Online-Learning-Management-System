package com.lms.service.impl;

import com.lms.dao.CourseDao;
import com.lms.dao.ModuleDao;
import com.lms.exception.ForbiddenException;
import com.lms.exception.ResourceNotFoundException;
import com.lms.exception.ValidationException;
import com.lms.model.Course;
import com.lms.model.Module;
import com.lms.service.ModuleService;

import java.util.List;

public class ModuleServiceImpl implements ModuleService {

    private final ModuleDao moduleDao;
    private final CourseDao courseDao;

    public ModuleServiceImpl(ModuleDao moduleDao, CourseDao courseDao) {
        this.moduleDao = moduleDao;
        this.courseDao = courseDao;
    }

    @Override
    public List<Module> getModulesForCourse(Long courseId) {
        return moduleDao.findByCourseId(courseId);
    }

    @Override
    public Module createModule(Module module, Long currentUserId, boolean isAdmin) {
        if (module.getTitle() == null || module.getTitle().isBlank()) {
            throw new ValidationException("Module title is required.");
        }
        Course course = courseDao.findById(module.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", module.getCourseId()));
        if (!isAdmin && !course.getInstructorId().equals(currentUserId)) {
            throw new ForbiddenException("You do not have permission to add modules to this course.");
        }
        return moduleDao.create(module);
    }

    @Override
    public Module updateModule(Module module, Long currentUserId, boolean isAdmin) {
        Module existing = moduleDao.findById(module.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Module", module.getId()));
        Course course = courseDao.findById(existing.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", existing.getCourseId()));
        if (!isAdmin && !course.getInstructorId().equals(currentUserId)) {
            throw new ForbiddenException("You do not have permission to modify this module.");
        }

        existing.setTitle(module.getTitle());
        existing.setDescription(module.getDescription());
        existing.setOrderIndex(module.getOrderIndex());
        moduleDao.update(existing);
        return existing;
    }

    @Override
    public boolean deleteModule(Long moduleId, Long currentUserId, boolean isAdmin) {
        Module existing = moduleDao.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module", moduleId));
        Course course = courseDao.findById(existing.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", existing.getCourseId()));
        if (!isAdmin && !course.getInstructorId().equals(currentUserId)) {
            throw new ForbiddenException("You do not have permission to delete this module.");
        }
        return moduleDao.delete(moduleId);
    }
}
