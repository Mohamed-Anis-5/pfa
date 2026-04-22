package com.pfa.backend.service;

import com.pfa.backend.dto.ComplaintCreateRequest;
import com.pfa.backend.dto.ComplaintResponse;
import com.pfa.backend.entity.Category;
import com.pfa.backend.entity.Citizen;
import com.pfa.backend.entity.Complaint;
import com.pfa.backend.enums.ComplaintStatus;
import com.pfa.backend.enums.Priority;
import com.pfa.backend.repository.AttachmentRepository;
import com.pfa.backend.repository.CategoryRepository;
import com.pfa.backend.repository.CitizenRepository;
import com.pfa.backend.repository.ComplaintRepository;
import com.pfa.backend.repository.ComplaintStatusHistoryRepository;
import com.pfa.backend.repository.MunicipalAgentRepository;
import com.pfa.backend.repository.NotificationRepository;
import com.pfa.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ComplaintServiceSlaTest {

    @Mock
    private ComplaintRepository complaintRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private CitizenRepository citizenRepository;

    @Mock
    private MunicipalAgentRepository agentRepository;

    @Mock
    private AttachmentRepository attachmentRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private ComplaintStatusHistoryRepository statusHistoryRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ComplaintService complaintService;

    @Test
    void createComplaintCalculatesSlaDeadlineUsingCategorySlaDays() {
        ComplaintCreateRequest request = new ComplaintCreateRequest();
        request.setTitle("Pothole near school");
        request.setDescription("Deep pothole causing traffic risk");
        request.setPriority(Priority.High);
        request.setCategoryId(1);
        request.setLatitude(36.80);
        request.setLongitude(10.18);

        Citizen citizen = new Citizen();
        citizen.setId(11L);
        citizen.setEmail("citizen.demo@municipalite.tn");

        Category category = Category.builder()
                .id(1)
                .label("Voirie")
                .slaDays(3)
                .build();

        when(citizenRepository.findByEmail("citizen.demo@municipalite.tn"))
                .thenReturn(Optional.of(citizen));
        when(categoryRepository.findById(1)).thenReturn(Optional.of(category));

        ArgumentCaptor<Complaint> complaintCaptor = ArgumentCaptor.forClass(Complaint.class);
        when(complaintRepository.save(complaintCaptor.capture())).thenAnswer(invocation -> {
            Complaint complaint = invocation.getArgument(0);
            complaint.setComplaintId(UUID.randomUUID());
            return complaint;
        });

        ComplaintResponse response = complaintService.createComplaint(request, "citizen.demo@municipalite.tn");

        Complaint savedComplaint = complaintCaptor.getValue();
        assertEquals(ComplaintStatus.PENDING, savedComplaint.getStatus());
        assertEquals(LocalDate.now().plusDays(3), savedComplaint.getTargetDate());
        assertEquals(LocalDate.now().plusDays(3), response.getTargetDate());
        assertEquals("Voirie", response.getCategoryLabel());
    }

    @Test
    void createComplaintAcceptsStreetNameWhenCoordinatesAreUnavailable() {
        ComplaintCreateRequest request = new ComplaintCreateRequest();
        request.setTitle("Blocked access");
        request.setDescription("Debris blocking the entrance to the street");
        request.setPriority(Priority.Medium);
        request.setCategoryId(1);
        request.setStreetName("Habib Bourguiba Avenue");

        Citizen citizen = new Citizen();
        citizen.setId(11L);
        citizen.setEmail("citizen.demo@municipalite.tn");

        Category category = Category.builder()
                .id(1)
                .label("Voirie")
                .slaDays(3)
                .build();

        when(citizenRepository.findByEmail("citizen.demo@municipalite.tn"))
                .thenReturn(Optional.of(citizen));
        when(categoryRepository.findById(1)).thenReturn(Optional.of(category));

        ArgumentCaptor<Complaint> complaintCaptor = ArgumentCaptor.forClass(Complaint.class);
        when(complaintRepository.save(complaintCaptor.capture())).thenAnswer(invocation -> {
            Complaint complaint = invocation.getArgument(0);
            complaint.setComplaintId(UUID.randomUUID());
            return complaint;
        });

        ComplaintResponse response = complaintService.createComplaint(request, "citizen.demo@municipalite.tn");

        Complaint savedComplaint = complaintCaptor.getValue();
        assertEquals("Habib Bourguiba Avenue", savedComplaint.getStreetName());
        assertNull(savedComplaint.getLatitude());
        assertNull(savedComplaint.getLongitude());
        assertEquals("Habib Bourguiba Avenue", response.getStreetName());
    }

    @Test
    void createComplaintRejectsMissingCoordinatesAndStreetName() {
        ComplaintCreateRequest request = new ComplaintCreateRequest();
        request.setTitle("Blocked access");
        request.setDescription("Debris blocking the entrance to the street");
        request.setPriority(Priority.Medium);
        request.setCategoryId(1);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> complaintService.createComplaint(request, "citizen.demo@municipalite.tn"));

        assertEquals("400 BAD_REQUEST \"Location is required. Capture GPS coordinates or provide a street name.\"",
                exception.getMessage());
    }

    @Test
    void createComplaintRejectsMissingCategory() {
        ComplaintCreateRequest request = new ComplaintCreateRequest();
        request.setTitle("Blocked access");
        request.setDescription("Debris blocking the entrance to the street");
        request.setPriority(Priority.Medium);
        request.setStreetName("Habib Bourguiba Avenue");

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> complaintService.createComplaint(request, "citizen.demo@municipalite.tn"));

        assertEquals("400 BAD_REQUEST \"Complaint category is required.\"", exception.getMessage());
    }
}
