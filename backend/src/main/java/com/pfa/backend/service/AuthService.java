package com.pfa.backend.service;

import com.pfa.backend.dto.*;
import com.pfa.backend.entity.*;
import com.pfa.backend.enums.UserRole;
import com.pfa.backend.repository.UserRepository;
import com.pfa.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        UserRole role = switch (request.getRole().toUpperCase()) {
            case "CITIZEN" -> UserRole.ROLE_CITIZEN;
            case "AGENT"   -> UserRole.ROLE_AGENT;
            case "ADMIN"   -> UserRole.ROLE_ADMIN;
            default        -> throw new RuntimeException("Unknown role: " + request.getRole());
        };

        User user = switch (request.getRole().toUpperCase()) {
            case "CITIZEN" -> new Citizen();
            case "AGENT"   -> new MunicipalAgent();
            case "ADMIN"   -> new Administrator();
            default        -> throw new RuntimeException("Unknown role: " + request.getRole());
        };

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhoneNumber(request.getPhoneNumber());
        user.setIdentifiantUnique(request.getIdentifiantUnique());
        user.setRole(role);

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), role.name());
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getRole().name());
    }
}