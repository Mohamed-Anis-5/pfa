package com.pfa.backend.scheduler;

import com.pfa.backend.entity.*;
import com.pfa.backend.enums.ComplaintStatus;
import com.pfa.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SlaMonitoringScheduler {

    private final ComplaintRepository    complaintRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository         userRepository;
    private final ComplaintStatusHistoryRepository statusHistoryRepository;

    // Runs every day at 02:00 AM
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void checkOverdueComplaints() {
        log.info("[SLA Monitor] Running overdue check at {}", OffsetDateTime.now());

        List<Complaint> overdueComplaints =
                complaintRepository.findOverdueComplaints(LocalDate.now());

        if (overdueComplaints.isEmpty()) {
            log.info("[SLA Monitor] No overdue complaints found.");
            return;
        }

        // Fetch all admins to notify
        List<User> admins = userRepository.findAllAdmins();

        for (Complaint complaint : overdueComplaints) {

            ComplaintStatus previousStatus = complaint.getStatus();

            // Archive complaint when SLA deadline is exceeded
            complaint.setStatus(ComplaintStatus.ARCHIVED);
            complaint.setArchivedAt(OffsetDateTime.now());
            complaint.setUpdatedAt(OffsetDateTime.now());
            complaintRepository.save(complaint);

            // Record history
            statusHistoryRepository.save(ComplaintStatusHistory.builder()
                    .complaint(complaint)
                    .fromStatus(previousStatus)
                    .toStatus(ComplaintStatus.ARCHIVED)
                    .note("SLA deadline exceeded: " + complaint.getTargetDate())
                    .build());

            log.warn("[SLA Monitor] Complaint {} exceeded SLA deadline and was archived. Category: {}, Target: {}",
                    complaint.getComplaintId(),
                    complaint.getCategory().getLabel(),
                    complaint.getTargetDate());

            // Notify each admin
            for (User admin : admins) {
                Notification notification = Notification.builder()
                        .user(admin)
                        .complaint(complaint)
                        .eventType("SLA_OVERDUE")
                        .message(String.format(
                                "Complaint '%s' (ID: %s) exceeded its SLA deadline of %s and has been archived.",
                                complaint.getTitle(),
                                complaint.getComplaintId(),
                                complaint.getTargetDate()))
                        .isRead(false)
                        .build();

                notificationRepository.save(notification);
            }
        }

        log.info("[SLA Monitor] Archived {} complaints that exceeded their SLA deadline.", overdueComplaints.size());
    }
}