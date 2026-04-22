package com.pfa.backend.dto;

import com.pfa.backend.enums.ComplaintStatus;
import com.pfa.backend.enums.Priority;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class PublicComplaintSummary {
    private UUID complaintId;
    private String title;
    private String streetName;
    private String categoryLabel;
    private ComplaintStatus status;
    private Priority priority;
    private OffsetDateTime createdAt;
    private LocalDate targetDate;
}