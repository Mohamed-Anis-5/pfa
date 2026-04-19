package com.pfa.backend.service;

import com.pfa.backend.dto.*;
import com.pfa.backend.entity.*;
import com.pfa.backend.enums.ComplaintStatus;
import com.pfa.backend.exception.*;
import com.pfa.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository   feedbackRepository;
    private final ComplaintRepository  complaintRepository;
    private final CitizenRepository    citizenRepository;

    @Transactional
    public FeedbackResponse submitFeedback(UUID complaintId,
                                           FeedbackRequest request,
                                           String citizenEmail) {

        // Validate rating range
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        // Ownership check — only the citizen who filed it can rate it
        if (!complaint.getCitizen().getEmail().equals(citizenEmail)) {
            throw new SecurityException("You are not authorized to rate this complaint");
        }

        // Must be RESOLVED before feedback
        if (complaint.getStatus() != ComplaintStatus.RESOLVED) {
            throw new IllegalStateException(
                    "Feedback can only be submitted for RESOLVED complaints");
        }

        // Prevent duplicate feedback
        if (feedbackRepository.existsByComplaintComplaintId(complaintId)) {
            throw new IllegalStateException("Feedback already submitted for this complaint");
        }

        Citizen citizen = citizenRepository.findByEmail(citizenEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Citizen not found"));

        Feedback feedback = Feedback.builder()
                .complaint(complaint)
                .citizen(citizen)
                .ratedAgent(complaint.getAssignedAgent())
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        feedbackRepository.save(feedback);

        // RESOLVED → CLOSED
        complaint.setStatus(ComplaintStatus.CLOSED);
        complaint.setClosedAt(OffsetDateTime.now());
        complaint.setUpdatedAt(OffsetDateTime.now());
        complaintRepository.save(complaint);

        return FeedbackResponse.builder()
                .id(feedback.getId())
                .complaintId(complaintId)
                .citizenEmail(citizenEmail)
                .rating(feedback.getRating())
                .comment(feedback.getComment())
                .submittedAt(feedback.getSubmittedAt())
                .build();
    }
}