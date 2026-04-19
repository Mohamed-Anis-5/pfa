package com.pfa.backend.repository;

import com.pfa.backend.entity.Complaint;
import com.pfa.backend.enums.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {
    List<Complaint> findByCitizenId(Long citizenId);
    List<Complaint> findByAssignedAgentId(Long agentId);
    List<Complaint> findByStatus(ComplaintStatus status);
}