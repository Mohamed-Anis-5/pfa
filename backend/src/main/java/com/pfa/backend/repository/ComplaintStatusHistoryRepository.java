package com.pfa.backend.repository;

import com.pfa.backend.entity.ComplaintStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ComplaintStatusHistoryRepository extends JpaRepository<ComplaintStatusHistory, Long> {
    List<ComplaintStatusHistory> findByComplaintComplaintIdOrderByChangedAtDesc(UUID complaintId);
}
