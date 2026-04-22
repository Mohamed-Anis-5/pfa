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
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
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
    private final NotificationRepository notificationRepository;
    private final ComplaintStatusHistoryRepository statusHistoryRepository;
    private final UserRepository         userRepository;

    // -------------------------------------------------------
    // 1.1 + 1.2 + 1.3 — Create complaint
    // -------------------------------------------------------
    @Transactional
    public ComplaintResponse createComplaint(ComplaintCreateRequest request, String citizenEmail) {
                String normalizedTitle = normalizeText(request.getTitle());
                String normalizedDescription = normalizeText(request.getDescription());
                String normalizedStreetName = normalizeText(request.getStreetName());
                boolean hasLatitude = request.getLatitude() != null;
                boolean hasLongitude = request.getLongitude() != null;
                boolean hasCoordinates = hasLatitude && hasLongitude;
                boolean hasStreetName = normalizedStreetName != null;

                if (normalizedTitle == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required.");
                }

                if (normalizedDescription == null || normalizedDescription.length() < 10) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Description must contain at least 10 characters.");
                }

                if (request.getCategoryId() == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Complaint category is required.");
                }

                if (hasLatitude != hasLongitude) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Both latitude and longitude are required when using GPS coordinates.");
                }

                if (!hasCoordinates && !hasStreetName) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Location is required. Capture GPS coordinates or provide a street name.");
                }

        // Resolve citizen from authenticated email
        Citizen citizen = citizenRepository.findByEmail(citizenEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Citizen not found"));

        // Resolve category
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        // Compute SLA target date
        LocalDate targetDate = LocalDate.now().plusDays(category.getSlaDays());

        Complaint complaint = Complaint.builder()
                .title(normalizedTitle)
                .description(normalizedDescription)
                .status(ComplaintStatus.PENDING)
                .priority(request.getPriority() != null ? request.getPriority() : Priority.Medium)
                .latitude(hasCoordinates ? request.getLatitude() : null)
                .longitude(hasCoordinates ? request.getLongitude() : null)
                .streetName(hasStreetName ? normalizedStreetName : null)
                .category(category)
                .citizen(citizen)
                .targetDate(targetDate)
                .build();

        complaintRepository.save(complaint);

        // Record initial status history
        statusHistoryRepository.save(ComplaintStatusHistory.builder()
                .complaint(complaint)
                .fromStatus(null)
                .toStatus(ComplaintStatus.PENDING)
                .changedBy(citizen)
                .note("Complaint submitted")
                .build());

        return toResponse(complaint);
    }

        private String normalizeText(String value) {
                if (value == null) {
                        return null;
                }

                String trimmedValue = value.trim();
                return trimmedValue.isEmpty() ? null : trimmedValue;
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

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        ComplaintStatus previousStatus = complaint.getStatus();
        complaint.setAssignedAgent(agent);
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        complaint.setUpdatedAt(OffsetDateTime.now());

        complaintRepository.save(complaint);

        // Record history
        statusHistoryRepository.save(ComplaintStatusHistory.builder()
                .complaint(complaint)
                .fromStatus(previousStatus)
                .toStatus(ComplaintStatus.ASSIGNED)
                .changedBy(admin)
                .note("Assigned to agent: " + agent.getEmail())
                .build());

        // Notify the assigned agent
        Notification agentNotification = Notification.builder()
                .user(agent)
                .complaint(complaint)
                .eventType("COMPLAINT_ASSIGNED")
                .message(String.format("You have been assigned complaint '%s' (ID: %s). Please review and begin processing.",
                        complaint.getTitle(), complaint.getComplaintId()))
                .isRead(false)
                .build();
        notificationRepository.save(agentNotification);

        return toResponse(complaint);
    }

    // -------------------------------------------------------
    // 3.2 — Agent updates complaint status
    // -------------------------------------------------------
    @Transactional
    public ComplaintResponse updateStatus(UUID complaintId,
                                          UpdateStatusRequest request,
                                          String agentEmail) {
        Complaint complaint = findComplaintById(complaintId);
        User agentUser = userRepository.findByEmail(agentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found"));

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
            if (request.getNote() != null && !request.getNote().isBlank()) {
                complaint.setResolutionComment(request.getNote());
            }
            // Notify the citizen
            Notification citizenNotification = Notification.builder()
                    .user(complaint.getCitizen())
                    .complaint(complaint)
                    .eventType("COMPLAINT_RESOLVED")
                    .message(String.format("Your complaint '%s' has been resolved. You can now rate the service.",
                            complaint.getTitle()))
                    .isRead(false)
                    .build();
            notificationRepository.save(citizenNotification);
        }

        complaintRepository.save(complaint);

        // Record history
        statusHistoryRepository.save(ComplaintStatusHistory.builder()
                .complaint(complaint)
                .fromStatus(current)
                .toStatus(next)
                .changedBy(agentUser)
                .note(request.getNote())
                .build());

        return toResponse(complaint);
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
                .streetName(c.getStreetName())
                .categoryLabel(c.getCategory().getLabel())
                .slaDays(c.getCategory().getSlaDays())
                .targetDate(c.getTargetDate())
                .citizenEmail(c.getCitizen().getEmail())
                .assignedAgentEmail(c.getAssignedAgent() != null
                        ? c.getAssignedAgent().getEmail() : null)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .resolvedAt(c.getResolvedAt())
                .resolutionComment(c.getResolutionComment())
                .build();
    }

        private PublicComplaintSummary toPublicSummary(Complaint complaint) {
                return PublicComplaintSummary.builder()
                                .complaintId(complaint.getComplaintId())
                                .title(complaint.getTitle())
                                .streetName(complaint.getStreetName())
                                .categoryLabel(complaint.getCategory().getLabel())
                                .status(complaint.getStatus())
                                .priority(complaint.getPriority())
                                .createdAt(complaint.getCreatedAt())
                                .targetDate(complaint.getTargetDate())
                                .build();
        }

        public PublicHomeSummaryResponse getPublicHomeSummary() {
                ZoneId zoneId = ZoneId.systemDefault();
                OffsetDateTime startOfToday = LocalDate.now(zoneId).atStartOfDay(zoneId).toOffsetDateTime();
                OffsetDateTime startOfTomorrow = LocalDate.now(zoneId).plusDays(1).atStartOfDay(zoneId).toOffsetDateTime();

                return PublicHomeSummaryResponse.builder()
                                .complaintsToday(complaintRepository.countByCreatedAtBetween(startOfToday, startOfTomorrow))
                                .totalComplaints(complaintRepository.count())
                                .recentComplaints(complaintRepository.findTop5ByOrderByCreatedAtDesc()
                                                .stream()
                                                .map(this::toPublicSummary)
                                                .toList())
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