package com.pfa.backend.controller;

import com.pfa.backend.dto.*;
import com.pfa.backend.service.ComplaintService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
@Tag(name = "Complaints", description = "Complaint lifecycle management")
public class ComplaintController {

    private final ComplaintService complaintService;

    @Operation(summary = "Create a new complaint", description = "Available to authenticated citizens")
    @PostMapping
    public ResponseEntity<ComplaintResponse> create(
            @RequestBody ComplaintCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        ComplaintResponse response = complaintService
                .createComplaint(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Attach an image to a complaint")
    @PostMapping("/{id}/attachments")
    public ResponseEntity<Void> uploadAttachment(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {

        complaintService.attachFile(id, file, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Operation(summary = "Assign complaint to agent", description = "Admin only. Transitions PENDING → ASSIGNED")
    @PutMapping("/{id}/assign")
    public ResponseEntity<ComplaintResponse> assign(
            @PathVariable UUID id,
            @RequestBody AssignComplaintRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                complaintService.assignComplaint(id, request, userDetails.getUsername()));
    }

    @Operation(summary = "Update complaint status", description = "Agent only. ASSIGNED → IN_PROGRESS → RESOLVED")
    @PutMapping("/{id}/status")
    public ResponseEntity<ComplaintResponse> updateStatus(
            @PathVariable UUID id,
            @RequestBody UpdateStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                complaintService.updateStatus(id, request, userDetails.getUsername()));
    }

    // For citizen: get their own complaints
@GetMapping("/my")
public ResponseEntity<List<ComplaintResponse>> getMine(
        @AuthenticationPrincipal UserDetails userDetails) {
    return ResponseEntity.ok(complaintService.getComplaintsForCitizen(userDetails.getUsername()));
}

// For agent: get their assigned complaints
@GetMapping("/assigned")
public ResponseEntity<List<ComplaintResponse>> getAssigned(
        @AuthenticationPrincipal UserDetails userDetails) {
    return ResponseEntity.ok(complaintService.getComplaintsForAgent(userDetails.getUsername()));
}

// Admin: get all
@GetMapping
public ResponseEntity<List<ComplaintResponse>> getAll() {
    return ResponseEntity.ok(complaintService.getAllComplaints());
}

@GetMapping("/public/home")
public ResponseEntity<PublicHomeSummaryResponse> getPublicHomeSummary() {
    return ResponseEntity.ok(complaintService.getPublicHomeSummary());
}
}
