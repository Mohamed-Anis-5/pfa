package com.pfa.backend.controller;

import com.pfa.backend.dto.*;
import com.pfa.backend.entity.Complaint;
import com.pfa.backend.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Administrative statistics and geospatial queries")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    @Operation(
        summary = "Get aggregated complaint statistics",
        description = "Returns counts by status, counts by category, and average resolution time."
    )
    public ResponseEntity<DashboardStats> getStats() {
        return ResponseEntity.ok(dashboardService.getStats());
    }

    @GetMapping("/nearby")
    @Operation(
        summary = "Find complaints within a radius",
        description = "Returns complaints within radiusKm kilometers of the given coordinates."
    )
    public ResponseEntity<List<Complaint>> getNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5.0") double radiusKm) {

        return ResponseEntity.ok(
                dashboardService.getComplaintsWithinRadius(lat, lng, radiusKm));
    }
}