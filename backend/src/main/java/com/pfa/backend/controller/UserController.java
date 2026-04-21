package com.pfa.backend.controller;

import com.pfa.backend.entity.MunicipalAgent;
import com.pfa.backend.entity.User;
import com.pfa.backend.repository.MunicipalAgentRepository;
import com.pfa.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final MunicipalAgentRepository agentRepository;
    private final UserRepository userRepository;

    @GetMapping("/agents")
    public List<MunicipalAgent> getAgents() {
        return agentRepository.findAll();
    }

    /**
     * GDPR / Privacy Compliance — Right to Erasure.
     * Anonymizes the authenticated user's personal data in-place so that
     * complaint records (audit trail) are preserved for referential integrity.
     */
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMyAccount(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String anonymousId = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        user.setFirstName("Deleted");
        user.setLastName("User");
        user.setEmail("deleted-" + anonymousId + "@anon.local");
        user.setPhoneNumber(null);
        user.setPassword("[DELETED]");

        userRepository.save(user);
        return ResponseEntity.noContent().build();
    }
}