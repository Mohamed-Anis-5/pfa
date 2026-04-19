package com.pfa.backend.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data @Builder
public class DashboardStats {
    private List<Map<String, Object>> countByStatus;
    private List<Map<String, Object>> countByCategory;
    private Double averageResolutionTimeHours;
}