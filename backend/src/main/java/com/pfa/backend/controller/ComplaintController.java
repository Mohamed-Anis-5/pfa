package com.pfa.backend.controller;

import com.pfa.backend.dto.*;
import com.pfa.backend.service.ComplaintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    // Citizen creates a complaint
    @PostMapping
    public ResponseEntity<ComplaintResponse> create(
            @RequestBody ComplaintCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        ComplaintResponse response = complaintService
                .createComplaint(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Citizen attaches an image to a complaint
    @PostMapping("/{id}/attachments")
    public ResponseEntity<Void> uploadAttachment(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {

        complaintService.attachFile(id, file, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // Admin assigns complaint to an agent  →  PENDING → ASSIGNED
    @PutMapping("/{id}/assign")
    public ResponseEntity<ComplaintResponse> assign(
            @PathVariable UUID id,
            @RequestBody AssignComplaintRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                complaintService.assignComplaint(id, request, userDetails.getUsername()));
    }

    // Agent updates status  →  ASSIGNED → IN_PROGRESS → RESOLVED
    @PutMapping("/{id}/status")
    public ResponseEntity<ComplaintResponse> updateStatus(
            @PathVariable UUID id,
            @RequestBody UpdateStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                complaintService.updateStatus(id, request, userDetails.getUsername()));
    }
}