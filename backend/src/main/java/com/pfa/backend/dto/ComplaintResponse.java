package com.pfa.backend.dto;

import com.pfa.backend.enums.ComplaintStatus;
import com.pfa.backend.enums.Priority;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder
public class ComplaintResponse {
    private UUID complaintId;
    private String title;
    private String description;
    private ComplaintStatus status;
    private Priority priority;
    private Double latitude;
    private Double longitude;
    private String categoryLabel;
    private Integer slaDays;
    private LocalDate targetDate;
    private String citizenEmail;
    private String assignedAgentEmail;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private OffsetDateTime resolvedAt;
    private String resolutionComment;
}