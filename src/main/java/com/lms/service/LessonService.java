package com.lms.service;

import com.lms.model.Lesson;

import java.util.List;

public interface LessonService {

    List<Lesson> getLessonsForModule(Long moduleId);

    Lesson getLessonById(Long id);

    Lesson createLesson(Lesson lesson, Long currentUserId, boolean isAdmin);

    Lesson updateLesson(Lesson lesson, Long currentUserId, boolean isAdmin);

    boolean deleteLesson(Long lessonId, Long currentUserId, boolean isAdmin);

    boolean markLessonComplete(Long userId, Long lessonId);
}
