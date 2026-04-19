package com.pfa.backend.controller;

import com.pfa.backend.dto.*;
import com.pfa.backend.service.FeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
@Tag(name = "Feedback", description = "Complaint feedback and closure")
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping("/{id}/feedback")
    @Operation(
        summary = "Submit feedback for a resolved complaint",
        description = "Citizen submits a rating (1–5) and optional comment. Transitions complaint RESOLVED → CLOSED."
    )
    public ResponseEntity<FeedbackResponse> submitFeedback(
            @PathVariable UUID id,
            @RequestBody FeedbackRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                feedbackService.submitFeedback(id, request, userDetails.getUsername()));
    }
}