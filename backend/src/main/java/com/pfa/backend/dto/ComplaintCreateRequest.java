package com.pfa.backend.dto;

import com.pfa.backend.enums.Priority;
import lombok.Data;

@Data
public class ComplaintCreateRequest {
    private String title;
    private String description;
    private Priority priority;
    private Integer categoryId;
    private Double latitude;
    private Double longitude;
    private String streetName;
}