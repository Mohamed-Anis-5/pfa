package com.pfa.backend.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder
public class NotificationDto {
    private Long id;
    private String eventType;
    private String message;
    private Boolean isRead;
    private OffsetDateTime createdAt;
    private UUID complaintId;
}
