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

            // Mark as ARCHIVED when SLA is exceeded
            complaint.setStatus(ComplaintStatus.ARCHIVED);
            complaint.setUpdatedAt(OffsetDateTime.now());
            complaintRepository.save(complaint);

            log.warn("[SLA Monitor] Complaint {} is overdue. Category: {}, Target: {}",
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
                                "Complaint '%s' (ID: %s) has exceeded its SLA deadline of %s.",
                                complaint.getTitle(),
                                complaint.getComplaintId(),
                                complaint.getTargetDate()))
                        .isRead(false)
                        .build();

                notificationRepository.save(notification);
            }
        }

        log.info("[SLA Monitor] Flagged {} complaints as ARCHIVED.", overdueComplaints.size());
    }
}