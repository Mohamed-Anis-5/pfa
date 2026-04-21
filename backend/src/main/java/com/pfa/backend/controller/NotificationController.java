package com.pfa.backend.controller;

import com.pfa.backend.dto.NotificationDto;
import com.pfa.backend.entity.Notification;
import com.pfa.backend.entity.User;
import com.pfa.backend.repository.NotificationRepository;
import com.pfa.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @GetMapping("/my")
    public ResponseEntity<List<NotificationDto>> getMyNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<NotificationDto> dtos = notificationRepository
                .findByUserIdAndIsReadFalse(user.getId())
                .stream()
                .map(n -> NotificationDto.builder()
                        .id(n.getId())
                        .eventType(n.getEventType())
                        .message(n.getMessage())
                        .isRead(n.getIsRead())
                        .createdAt(n.getCreatedAt())
                        .complaintId(n.getComplaint() != null ? n.getComplaint().getComplaintId() : null)
                        .build())
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setIsRead(true);
            n.setReadAt(OffsetDateTime.now());
            notificationRepository.save(n);
        });
        return ResponseEntity.ok().build();
    }
}
