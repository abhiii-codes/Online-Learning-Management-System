package com.lms.dao;

import com.lms.model.Lesson;

import java.sql.Connection;
import java.util.List;
import java.util.Optional;

public interface LessonDao {

    List<Lesson> findByModuleId(Long moduleId);

    Optional<Lesson> findById(Long id);

    Lesson create(Lesson lesson);

    boolean update(Lesson lesson);

    boolean delete(Long id);

    boolean markCompleted(Long userId, Long lessonId);

    boolean markCompleted(Connection conn, Long userId, Long lessonId);

    List<Long> findCompletedLessonIds(Long userId, Long courseId);

    int countCompletedLessons(Connection conn, Long userId, Long courseId);

    int countCompletedLessons(Long userId, Long courseId);

    int countTotalLessons(Connection conn, Long courseId);

    int countTotalLessons(Long courseId);
}
