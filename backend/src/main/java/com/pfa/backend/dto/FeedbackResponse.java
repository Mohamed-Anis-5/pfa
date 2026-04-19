package com.pfa.backend.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder
public class FeedbackResponse {
    private Long id;
    private UUID complaintId;
    private String citizenEmail;
    private Integer rating;
    private String comment;
    private OffsetDateTime submittedAt;
}