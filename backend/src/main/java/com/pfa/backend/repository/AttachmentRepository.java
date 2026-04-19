package com.pfa.backend.repository;

import com.pfa.backend.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    List<Attachment> findByComplaintComplaintId(UUID complaintId);
}