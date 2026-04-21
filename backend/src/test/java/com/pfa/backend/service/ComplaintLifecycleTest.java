package com.pfa.backend.service;

import com.pfa.backend.dto.AssignComplaintRequest;
import com.pfa.backend.dto.ComplaintCreateRequest;
import com.pfa.backend.dto.ComplaintResponse;
import com.pfa.backend.dto.UpdateStatusRequest;
import com.pfa.backend.entity.*;
import com.pfa.backend.enums.ComplaintStatus;
import com.pfa.backend.enums.Priority;
import com.pfa.backend.exception.InvalidTransitionException;
import com.pfa.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests covering the full complaint lifecycle:
 *
 *   PENDING (citizen submits)
 *     → ASSIGNED (admin assigns to agent)
 *     → IN_PROGRESS (agent starts work)
 *     → RESOLVED (agent resolves with comment)
 *
 * Also verifies status history recording, notifications,
 * and rejection of invalid status transitions.
 */
@ExtendWith(MockitoExtension.class)
class ComplaintLifecycleTest {

    @Mock private ComplaintRepository complaintRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private CitizenRepository citizenRepository;
    @Mock private MunicipalAgentRepository agentRepository;
    @Mock private AttachmentRepository attachmentRepository;
    @Mock private FileStorageService fileStorageService;
    @Mock private NotificationRepository notificationRepository;
    @Mock private ComplaintStatusHistoryRepository statusHistoryRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private ComplaintService complaintService;

    private Citizen citizen;
    private MunicipalAgent agent;
    private Administrator admin;
    private Category category;
    private Complaint complaint;
    private UUID complaintId;

    @BeforeEach
    void setUp() {
        citizen = new Citizen();
        citizen.setId(1L);
        citizen.setEmail("citizen@muni.tn");

        agent = new MunicipalAgent();
        agent.setId(2L);
        agent.setEmail("agent@muni.tn");

        admin = new Administrator();
        admin.setId(3L);
        admin.setEmail("admin@muni.tn");

        category = Category.builder()
                .id(1)
                .label("Voirie")
                .slaDays(7)
                .build();

        complaintId = UUID.randomUUID();

        complaint = Complaint.builder()
                .complaintId(complaintId)
                .title("Broken streetlight")
                .description("Main street light out")
                .status(ComplaintStatus.PENDING)
                .priority(Priority.Medium)
                .category(category)
                .citizen(citizen)
                .targetDate(LocalDate.now().plusDays(7))
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. CREATE — citizen submits a complaint
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    void createComplaint_initialStatusIsPending() {
        ComplaintCreateRequest req = buildCreateRequest();

        when(citizenRepository.findByEmail("citizen@muni.tn")).thenReturn(Optional.of(citizen));
        when(categoryRepository.findById(1)).thenReturn(Optional.of(category));
        when(complaintRepository.save(any())).thenAnswer(inv -> {
            Complaint c = inv.getArgument(0);
            c.setComplaintId(UUID.randomUUID());
            return c;
        });

        ComplaintResponse resp = complaintService.createComplaint(req, "citizen@muni.tn");

        assertThat(resp.getStatus()).isEqualTo(ComplaintStatus.PENDING);
        assertThat(resp.getTargetDate()).isEqualTo(LocalDate.now().plusDays(7));
        assertThat(resp.getCategoryLabel()).isEqualTo("Voirie");
    }

    @Test
    void createComplaint_recordsInitialHistoryEntryFromNullToPending() {
        ComplaintCreateRequest req = buildCreateRequest();

        when(citizenRepository.findByEmail("citizen@muni.tn")).thenReturn(Optional.of(citizen));
        when(categoryRepository.findById(1)).thenReturn(Optional.of(category));
        when(complaintRepository.save(any())).thenAnswer(inv -> {
            Complaint c = inv.getArgument(0);
            c.setComplaintId(UUID.randomUUID());
            return c;
        });

        complaintService.createComplaint(req, "citizen@muni.tn");

        ArgumentCaptor<ComplaintStatusHistory> captor = ArgumentCaptor.forClass(ComplaintStatusHistory.class);
        verify(statusHistoryRepository).save(captor.capture());
        ComplaintStatusHistory history = captor.getValue();
        assertThat(history.getFromStatus()).isNull();
        assertThat(history.getToStatus()).isEqualTo(ComplaintStatus.PENDING);
        assertThat(history.getChangedBy().getEmail()).isEqualTo("citizen@muni.tn");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ASSIGN — admin assigns to agent
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    void assignComplaint_fromPending_setsStatusToAssigned() {
        complaint.setStatus(ComplaintStatus.PENDING);
        stubAssign();

        ComplaintResponse resp = complaintService.assignComplaint(complaintId, assignReq(), "admin@muni.tn");

        assertThat(resp.getStatus()).isEqualTo(ComplaintStatus.ASSIGNED);
        assertThat(resp.getAssignedAgentEmail()).isEqualTo("agent@muni.tn");
    }

    @Test
    void assignComplaint_fromValidated_setsStatusToAssigned() {
        complaint.setStatus(ComplaintStatus.VALIDATED);
        stubAssign();

        ComplaintResponse resp = complaintService.assignComplaint(complaintId, assignReq(), "admin@muni.tn");

        assertThat(resp.getStatus()).isEqualTo(ComplaintStatus.ASSIGNED);
    }

    @Test
    void assignComplaint_fromInProgress_throwsInvalidTransition() {
        complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        when(complaintRepository.findById(complaintId)).thenReturn(Optional.of(complaint));

        assertThatThrownBy(() ->
                complaintService.assignComplaint(complaintId, assignReq(), "admin@muni.tn"))
                .isInstanceOf(InvalidTransitionException.class)
                .hasMessageContaining("IN_PROGRESS");
    }

    @Test
    void assignComplaint_fromResolved_throwsInvalidTransition() {
        complaint.setStatus(ComplaintStatus.RESOLVED);
        when(complaintRepository.findById(complaintId)).thenReturn(Optional.of(complaint));

        assertThatThrownBy(() ->
                complaintService.assignComplaint(complaintId, assignReq(), "admin@muni.tn"))
                .isInstanceOf(InvalidTransitionException.class)
                .hasMessageContaining("RESOLVED");
    }

    @Test
    void assignComplaint_sendsNotificationToAgent() {
        complaint.setStatus(ComplaintStatus.PENDING);
        stubAssign();

        complaintService.assignComplaint(complaintId, assignReq(), "admin@muni.tn");

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification notif = captor.getValue();
        assertThat(notif.getEventType()).isEqualTo("COMPLAINT_ASSIGNED");
        assertThat(notif.getUser().getEmail()).isEqualTo("agent@muni.tn");
        assertThat(notif.getIsRead()).isFalse();
    }

    @Test
    void assignComplaint_recordsHistoryPendingToAssigned() {
        complaint.setStatus(ComplaintStatus.PENDING);
        stubAssign();

        complaintService.assignComplaint(complaintId, assignReq(), "admin@muni.tn");

        ArgumentCaptor<ComplaintStatusHistory> captor = ArgumentCaptor.forClass(ComplaintStatusHistory.class);
        verify(statusHistoryRepository).save(captor.capture());
        ComplaintStatusHistory history = captor.getValue();
        assertThat(history.getFromStatus()).isEqualTo(ComplaintStatus.PENDING);
        assertThat(history.getToStatus()).isEqualTo(ComplaintStatus.ASSIGNED);
        assertThat(history.getChangedBy().getEmail()).isEqualTo("admin@muni.tn");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. IN_PROGRESS — agent starts working
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    void updateStatus_assignedToInProgress_setsStatus() {
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        stubUpdateStatus();

        UpdateStatusRequest req = updateStatusReq(ComplaintStatus.IN_PROGRESS, "Started work");
        ComplaintResponse resp = complaintService.updateStatus(complaintId, req, "agent@muni.tn");

        assertThat(resp.getStatus()).isEqualTo(ComplaintStatus.IN_PROGRESS);
    }

    @Test
    void updateStatus_pendingToInProgress_throwsInvalidTransition() {
        complaint.setStatus(ComplaintStatus.PENDING);
        when(complaintRepository.findById(complaintId)).thenReturn(Optional.of(complaint));
        when(userRepository.findByEmail("agent@muni.tn")).thenReturn(Optional.of(agent));

        assertThatThrownBy(() ->
                complaintService.updateStatus(complaintId,
                        updateStatusReq(ComplaintStatus.IN_PROGRESS, null), "agent@muni.tn"))
                .isInstanceOf(InvalidTransitionException.class)
                .hasMessageContaining("PENDING");
    }

    @Test
    void updateStatus_assignedToInProgress_recordsHistory() {
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        stubUpdateStatus();

        complaintService.updateStatus(complaintId,
                updateStatusReq(ComplaintStatus.IN_PROGRESS, "Starting"), "agent@muni.tn");

        ArgumentCaptor<ComplaintStatusHistory> captor = ArgumentCaptor.forClass(ComplaintStatusHistory.class);
        verify(statusHistoryRepository).save(captor.capture());
        ComplaintStatusHistory history = captor.getValue();
        assertThat(history.getFromStatus()).isEqualTo(ComplaintStatus.ASSIGNED);
        assertThat(history.getToStatus()).isEqualTo(ComplaintStatus.IN_PROGRESS);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. RESOLVE — agent resolves the complaint
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    void updateStatus_inProgressToResolved_setsResolvedAtAndComment() {
        complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        stubUpdateStatus();

        UpdateStatusRequest req = updateStatusReq(ComplaintStatus.RESOLVED, "Streetlight replaced");
        ComplaintResponse resp = complaintService.updateStatus(complaintId, req, "agent@muni.tn");

        assertThat(resp.getStatus()).isEqualTo(ComplaintStatus.RESOLVED);
        assertThat(resp.getResolvedAt()).isNotNull();
        assertThat(resp.getResolutionComment()).isEqualTo("Streetlight replaced");
    }

    @Test
    void updateStatus_resolved_notifiesCitizen() {
        complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        stubUpdateStatus();

        complaintService.updateStatus(complaintId,
                updateStatusReq(ComplaintStatus.RESOLVED, "Done"), "agent@muni.tn");

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification notif = captor.getValue();
        assertThat(notif.getEventType()).isEqualTo("COMPLAINT_RESOLVED");
        assertThat(notif.getUser().getEmail()).isEqualTo("citizen@muni.tn");
        assertThat(notif.getIsRead()).isFalse();
    }

    @Test
    void updateStatus_assignedToResolved_throwsInvalidTransition() {
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        when(complaintRepository.findById(complaintId)).thenReturn(Optional.of(complaint));
        when(userRepository.findByEmail("agent@muni.tn")).thenReturn(Optional.of(agent));

        assertThatThrownBy(() ->
                complaintService.updateStatus(complaintId,
                        updateStatusReq(ComplaintStatus.RESOLVED, null), "agent@muni.tn"))
                .isInstanceOf(InvalidTransitionException.class)
                .hasMessageContaining("ASSIGNED");
    }

    @Test
    void updateStatus_inProgressToResolved_recordsHistory() {
        complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        stubUpdateStatus();

        complaintService.updateStatus(complaintId,
                updateStatusReq(ComplaintStatus.RESOLVED, "Fixed"), "agent@muni.tn");

        ArgumentCaptor<ComplaintStatusHistory> captor = ArgumentCaptor.forClass(ComplaintStatusHistory.class);
        verify(statusHistoryRepository).save(captor.capture());
        ComplaintStatusHistory history = captor.getValue();
        assertThat(history.getFromStatus()).isEqualTo(ComplaintStatus.IN_PROGRESS);
        assertThat(history.getToStatus()).isEqualTo(ComplaintStatus.RESOLVED);
        assertThat(history.getNote()).isEqualTo("Fixed");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. FULL HAPPY PATH — end-to-end lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    void fullLifecycle_pendingAssignedInProgressResolved() {
        // ── Step 1: citizen submits ──────────────────────────────────────────
        when(citizenRepository.findByEmail("citizen@muni.tn")).thenReturn(Optional.of(citizen));
        when(categoryRepository.findById(1)).thenReturn(Optional.of(category));
        when(complaintRepository.save(any())).thenAnswer(inv -> {
            Complaint c = inv.getArgument(0);
            if (c.getComplaintId() == null) c.setComplaintId(complaintId);
            return c;
        });

        ComplaintResponse created = complaintService.createComplaint(buildCreateRequest(), "citizen@muni.tn");
        assertThat(created.getStatus()).isEqualTo(ComplaintStatus.PENDING);

        // ── Step 2: admin assigns ────────────────────────────────────────────
        complaint.setStatus(ComplaintStatus.PENDING);
        when(complaintRepository.findById(complaintId)).thenReturn(Optional.of(complaint));
        when(agentRepository.findById(2L)).thenReturn(Optional.of(agent));
        when(userRepository.findByEmail("admin@muni.tn")).thenReturn(Optional.of(admin));

        ComplaintResponse assigned = complaintService.assignComplaint(complaintId, assignReq(), "admin@muni.tn");
        assertThat(assigned.getStatus()).isEqualTo(ComplaintStatus.ASSIGNED);
        assertThat(assigned.getAssignedAgentEmail()).isEqualTo("agent@muni.tn");

        // ── Step 3: agent starts work ────────────────────────────────────────
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        when(userRepository.findByEmail("agent@muni.tn")).thenReturn(Optional.of(agent));

        ComplaintResponse inProgress = complaintService.updateStatus(complaintId,
                updateStatusReq(ComplaintStatus.IN_PROGRESS, "Started"), "agent@muni.tn");
        assertThat(inProgress.getStatus()).isEqualTo(ComplaintStatus.IN_PROGRESS);

        // ── Step 4: agent resolves ───────────────────────────────────────────
        complaint.setStatus(ComplaintStatus.IN_PROGRESS);

        ComplaintResponse resolved = complaintService.updateStatus(complaintId,
                updateStatusReq(ComplaintStatus.RESOLVED, "Streetlight replaced"), "agent@muni.tn");
        assertThat(resolved.getStatus()).isEqualTo(ComplaintStatus.RESOLVED);
        assertThat(resolved.getResolutionComment()).isEqualTo("Streetlight replaced");
        assertThat(resolved.getResolvedAt()).isNotNull();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private ComplaintCreateRequest buildCreateRequest() {
        ComplaintCreateRequest req = new ComplaintCreateRequest();
        req.setTitle("Broken streetlight");
        req.setDescription("Main street light out");
        req.setPriority(Priority.High);
        req.setCategoryId(1);
        req.setLatitude(36.80);
        req.setLongitude(10.18);
        return req;
    }

    private AssignComplaintRequest assignReq() {
        AssignComplaintRequest req = new AssignComplaintRequest();
        req.setAgentId(2L);
        return req;
    }

    private UpdateStatusRequest updateStatusReq(ComplaintStatus status, String note) {
        UpdateStatusRequest req = new UpdateStatusRequest();
        req.setNewStatus(status);
        req.setNote(note);
        return req;
    }

    /** Stubs needed for assignComplaint happy path. */
    private void stubAssign() {
        when(complaintRepository.findById(complaintId)).thenReturn(Optional.of(complaint));
        when(agentRepository.findById(2L)).thenReturn(Optional.of(agent));
        when(userRepository.findByEmail("admin@muni.tn")).thenReturn(Optional.of(admin));
        when(complaintRepository.save(any())).thenReturn(complaint);
    }

    /** Stubs needed for updateStatus happy path. */
    private void stubUpdateStatus() {
        when(complaintRepository.findById(complaintId)).thenReturn(Optional.of(complaint));
        when(userRepository.findByEmail("agent@muni.tn")).thenReturn(Optional.of(agent));
        when(complaintRepository.save(any())).thenReturn(complaint);
    }
}
