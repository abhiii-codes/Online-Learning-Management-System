package com.lms.dao;

import com.lms.model.Assignment;

import java.util.List;
import java.util.Optional;

public interface AssignmentDao {

    Optional<Assignment> findById(Long id);

    List<Assignment> findByCourseId(Long courseId);

    List<Assignment> findByCourseIdForStudent(Long courseId, Long studentId);

    Assignment create(Assignment assignment);

    boolean update(Assignment assignment);

    boolean delete(Long id);
}
