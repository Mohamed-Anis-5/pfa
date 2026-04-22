package com.pfa.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PublicHomeSummaryResponse {
    private long complaintsToday;
    private long totalComplaints;
    private List<PublicComplaintSummary> recentComplaints;
}