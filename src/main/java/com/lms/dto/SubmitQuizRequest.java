package com.lms.dto;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

public class SubmitQuizRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    private Map<Long, String> answers = new HashMap<>();

    public SubmitQuizRequest() {}

    public Map<Long, String> getAnswers() { return answers; }
    public void setAnswers(Map<Long, String> answers) { this.answers = answers; }
}
