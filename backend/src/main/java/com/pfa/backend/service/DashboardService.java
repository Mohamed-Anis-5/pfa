package com.pfa.backend.service;

import com.pfa.backend.dto.DashboardStats;
import com.pfa.backend.entity.Complaint;
import com.pfa.backend.repository.ComplaintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ComplaintRepository complaintRepository;

    public DashboardStats getStats() {
        return DashboardStats.builder()
                .countByStatus(complaintRepository.countByStatus())
                .countByCategory(complaintRepository.countByCategory())
                .averageResolutionTimeHours(complaintRepository.averageResolutionTimeHours())
                .build();
    }

    public List<Complaint> getComplaintsWithinRadius(double lat, double lng, double radiusKm) {
        return complaintRepository.findWithinRadius(lat, lng, radiusKm * 1000);
    }
}