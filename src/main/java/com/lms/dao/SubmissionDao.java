package com.lms.dao;

import com.lms.model.Submission;

import java.sql.Connection;
import java.util.List;
import java.util.Optional;

public interface SubmissionDao {

    Optional<Submission> findById(Long id);

    Optional<Submission> findByAssignmentAndStudent(Long assignmentId, Long studentId);

    Optional<Submission> findByAssignmentAndStudent(Connection conn, Long assignmentId, Long studentId);

    List<Submission> findByAssignmentId(Long assignmentId);

    List<Submission> findByStudentId(Long studentId);

    Submission create(Submission submission);

    Submission create(Connection conn, Submission submission);

    boolean gradeSubmission(Long submissionId, double grade, String feedback, Long gradedBy);

    boolean gradeSubmission(Connection conn, Long submissionId, double grade, String feedback, Long gradedBy);

    List<Double> findGradesByStudentAndCourse(Long studentId, Long courseId);
}
