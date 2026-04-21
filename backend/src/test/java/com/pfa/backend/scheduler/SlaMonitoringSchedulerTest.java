package com.pfa.backend.scheduler;

import com.pfa.backend.entity.Administrator;
import com.pfa.backend.entity.Category;
import com.pfa.backend.entity.Complaint;
import com.pfa.backend.entity.ComplaintStatusHistory;
import com.pfa.backend.entity.Notification;
import com.pfa.backend.entity.User;
import com.pfa.backend.enums.ComplaintStatus;
import com.pfa.backend.repository.ComplaintRepository;
import com.pfa.backend.repository.ComplaintStatusHistoryRepository;
import com.pfa.backend.repository.NotificationRepository;
import com.pfa.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SlaMonitoringSchedulerTest {

    @Mock
    private ComplaintRepository complaintRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ComplaintStatusHistoryRepository statusHistoryRepository;

    @InjectMocks
    private SlaMonitoringScheduler scheduler;

    @Test
    void checkOverdueComplaintsMarksComplaintAsOverdueAndNotifiesAdmins() {
        Complaint complaint = Complaint.builder()
                .complaintId(UUID.randomUUID())
                .title("Streetlight outage")
                .status(ComplaintStatus.ASSIGNED)
                .targetDate(LocalDate.now().minusDays(1))
                .build();
        complaint.setCategory(Category.builder().id(1).label("Eclairage public").slaDays(2).build());

        Administrator admin = new Administrator();
        admin.setId(1L);
        admin.setEmail("admin.demo@municipalite.tn");

        when(complaintRepository.findOverdueComplaints(any(LocalDate.class))).thenReturn(List.of(complaint));
        when(userRepository.findAllAdmins()).thenReturn(List.of((User) admin));

        scheduler.checkOverdueComplaints();

        assertEquals(ComplaintStatus.ARCHIVED, complaint.getStatus());
        verify(complaintRepository, times(1)).save(complaint);
        verify(statusHistoryRepository, times(1)).save(any(ComplaintStatusHistory.class));

        ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(1)).save(notificationCaptor.capture());
        Notification savedNotification = notificationCaptor.getValue();

        assertEquals("SLA_OVERDUE", savedNotification.getEventType());
        assertTrue(savedNotification.getMessage().contains("exceeded its SLA"));
        assertEquals(admin.getEmail(), savedNotification.getUser().getEmail());
    }
}
