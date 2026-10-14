package com.lms.dto;

import java.io.Serializable;

/**
 * Student-facing Quiz Question DTO.
 * Architectural Security Guarantee:
 * Does NOT contain the 'correctOption' field anywhere in its class definition.
 * It is physically impossible for Jackson serialization to leak answer keys to students.
 */
public class QuizQuestionStudentDto implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long quizId;
    private String questionText;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private int points;
    private int orderIndex;

    public QuizQuestionStudentDto() {}

    public QuizQuestionStudentDto(Long id, Long quizId, String questionText,
                                 String optionA, String optionB, String optionC, String optionD,
                                 int points, int orderIndex) {
        this.id = id;
        this.quizId = quizId;
        this.questionText = questionText;
        this.optionA = optionA;
        this.optionB = optionB;
        this.optionC = optionC;
        this.optionD = optionD;
        this.points = points;
        this.orderIndex = orderIndex;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getQuizId() { return quizId; }
    public void setQuizId(Long quizId) { this.quizId = quizId; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public String getOptionA() { return optionA; }
    public void setOptionA(String optionA) { this.optionA = optionA; }

    public String getOptionB() { return optionB; }
    public void setOptionB(String optionB) { this.optionB = optionB; }

    public String getOptionC() { return optionC; }
    public void setOptionC(String optionC) { this.optionC = optionC; }

    public String getOptionD() { return optionD; }
    public void setOptionD(String optionD) { this.optionD = optionD; }

    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }

    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
}
