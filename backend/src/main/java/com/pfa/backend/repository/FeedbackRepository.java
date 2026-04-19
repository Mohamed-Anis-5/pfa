package com.pfa.backend.repository;

import com.pfa.backend.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    Optional<Feedback> findByComplaintComplaintId(UUID complaintId);
    boolean existsByComplaintComplaintId(UUID complaintId);
}