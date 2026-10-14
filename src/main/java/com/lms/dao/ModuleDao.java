package com.lms.dao;

import com.lms.model.Module;

import java.util.List;
import java.util.Optional;

public interface ModuleDao {

    List<Module> findByCourseId(Long courseId);

    Optional<Module> findById(Long id);

    Module create(Module module);

    boolean update(Module module);

    boolean delete(Long id);
}
