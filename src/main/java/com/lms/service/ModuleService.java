package com.lms.service;

import com.lms.model.Module;

import java.util.List;

public interface ModuleService {

    List<Module> getModulesForCourse(Long courseId);

    Module createModule(Module module, Long currentUserId, boolean isAdmin);

    Module updateModule(Module module, Long currentUserId, boolean isAdmin);

    boolean deleteModule(Long moduleId, Long currentUserId, boolean isAdmin);
}
