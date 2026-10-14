package com.lms.service;

import com.lms.model.Submission;

import java.util.List;

public interface SubmissionService {

    Submission submitAssignment(Long assignmentId, Long studentId, String text, String fileUrl);

    Submission gradeSubmission(Long submissionId, double grade, String feedback, Long instructorId, boolean isAdmin);

    List<Submission> getSubmissionsForAssignment(Long assignmentId, Long currentUserId, boolean isAdmin);

    Submission getStudentSubmission(Long assignmentId, Long studentId);

    Submission getSubmissionById(Long id, Long currentUserId, boolean isInstructor, boolean isAdmin);
}
