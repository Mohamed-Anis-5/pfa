package com.pfa.backend.dto;

import lombok.Data;

@Data
public class FeedbackRequest {
    private Integer rating;   // 1–5
    private String comment;   // optional
}