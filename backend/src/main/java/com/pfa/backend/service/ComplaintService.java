package com.pfa.backend.service;

import com.pfa.backend.dto.*;
import com.pfa.backend.entity.*;
import com.pfa.backend.enums.ComplaintStatus;
import com.pfa.backend.enums.Priority;
import com.pfa.backend.exception.*;
import com.pfa.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository    complaintRepository;
    private final CategoryRepository     categoryRepository;
    private final CitizenRepository      citizenRepository;
    private final MunicipalAgentRepository agentRepository;
    private final AttachmentRepository   attachmentRepository;
    private final FileStorageService     fileStorageService;

    // -------------------------------------------------------
    // 1.1 + 1.2 + 1.3 — Create complaint
    // -------------------------------------------------------
    @Transactional
    public ComplaintResponse createComplaint(ComplaintCreateRequest request, String citizenEmail) {

        // Resolve citizen from authenticated email
        Citizen citizen = citizenRepository.findByEmail(citizenEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Citizen not found"));

        // Resolve category
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        // Compute SLA target date
        LocalDate targetDate = LocalDate.now().plusDays(category.getSlaDays());

        Complaint complaint = Complaint.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(ComplaintStatus.PENDING)
                .priority(request.getPriority() != null ? request.getPriority() : Priority.Medium)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .category(category)
                .citizen(citizen)
                .targetDate(targetDate)
                .build();

        complaintRepository.save(complaint);
        return toResponse(complaint);
    }

    // -------------------------------------------------------
    // 2.1 — Attach image to existing complaint
    // -------------------------------------------------------
    @Transactional
    public void attachFile(UUID complaintId, MultipartFile file, String uploaderEmail) {
        Complaint complaint = findComplaintById(complaintId);
        String url = fileStorageService.store(file);

        Attachment attachment = Attachment.builder()
                .complaint(complaint)
                .fileUrl(url)
                .mimeType(file.getContentType())
                .fileSizeBytes(file.getSize())
                .build();

        attachmentRepository.save(attachment);
    }

    // -------------------------------------------------------
    // 3.1 — Admin assigns complaint to agent
    // -------------------------------------------------------
    @Transactional
    public ComplaintResponse assignComplaint(UUID complaintId,
                                             AssignComplaintRequest request,
                                             String adminEmail) {
        Complaint complaint = findComplaintById(complaintId);

        if (complaint.getStatus() != ComplaintStatus.PENDING &&
            complaint.getStatus() != ComplaintStatus.VALIDATED) {
            throw new InvalidTransitionException(
                    complaint.getStatus().name(), ComplaintStatus.ASSIGNED.name());
        }

        MunicipalAgent agent = agentRepository.findById(request.getAgentId())
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found"));

        complaint.setAssignedAgent(agent);
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        complaint.setUpdatedAt(OffsetDateTime.now());

        return toResponse(complaintRepository.save(complaint));
    }

    // -------------------------------------------------------
    // 3.2 — Agent updates complaint status
    // -------------------------------------------------------
    @Transactional
    public ComplaintResponse updateStatus(UUID complaintId,
                                          UpdateStatusRequest request,
                                          String agentEmail) {
        Complaint complaint = findComplaintById(complaintId);
        ComplaintStatus current = complaint.getStatus();
        ComplaintStatus next    = request.getNewStatus();

        // Validate allowed transitions
        boolean validTransition =
                (current == ComplaintStatus.ASSIGNED    && next == ComplaintStatus.IN_PROGRESS) ||
                (current == ComplaintStatus.IN_PROGRESS && next == ComplaintStatus.RESOLVED);

        if (!validTransition) {
            throw new InvalidTransitionException(current.name(), next.name());
        }

        complaint.setStatus(next);
        complaint.setUpdatedAt(OffsetDateTime.now());

        if (next == ComplaintStatus.RESOLVED) {
            complaint.setResolvedAt(OffsetDateTime.now());
        }

        return toResponse(complaintRepository.save(complaint));
    }

    // -------------------------------------------------------
    // Helpers
    // -------------------------------------------------------
    private Complaint findComplaintById(UUID id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found: " + id));
    }

    private ComplaintResponse toResponse(Complaint c) {
        return ComplaintResponse.builder()
                .complaintId(c.getComplaintId())
                .title(c.getTitle())
                .description(c.getDescription())
                .status(c.getStatus())
                .priority(c.getPriority())
                .latitude(c.getLatitude())
                .longitude(c.getLongitude())
                .categoryLabel(c.getCategory().getLabel())
                .slaDays(c.getCategory().getSlaDays())
                .targetDate(c.getTargetDate())
                .citizenEmail(c.getCitizen().getEmail())
                .assignedAgentEmail(c.getAssignedAgent() != null
                        ? c.getAssignedAgent().getEmail() : null)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    public List<ComplaintResponse> getAllComplaints() {
    return complaintRepository.findAll().stream().map(this::toResponse).toList();
}

public List<ComplaintResponse> getComplaintsForCitizen(String email) {
    Citizen citizen = citizenRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Citizen not found"));
    return complaintRepository.findByCitizenId(citizen.getId())
            .stream().map(this::toResponse).toList();
}

public List<ComplaintResponse> getComplaintsForAgent(String email) {
    return complaintRepository.findAll().stream()
            .filter(c -> c.getAssignedAgent() != null &&
                         c.getAssignedAgent().getEmail().equals(email))
            .map(this::toResponse).toList();
}
}