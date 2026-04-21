package com.pfa.backend.service;

import com.pfa.backend.dto.*;
import com.pfa.backend.entity.*;
import com.pfa.backend.enums.UserRole;
import com.pfa.backend.enums.Governorate;
import com.pfa.backend.enums.ServiceType;
import com.pfa.backend.enums.Grade;
import com.pfa.backend.repository.CitizenRepository;
import com.pfa.backend.repository.UserRepository;
import com.pfa.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CitizenRepository citizenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(CONFLICT, "Email already in use");
        }

        String roleUpper = request.getRole() != null ? request.getRole().toUpperCase() : "";
        if (roleUpper.equals("CITIZEN")) {
            // CIN is required for citizens
            if (request.getNumCin() == null || request.getNumCin().isBlank()) {
                throw new ResponseStatusException(BAD_REQUEST, "CIN number is required for citizen registration");
            }
            if (citizenRepository.existsByNumCin(request.getNumCin())) {
                throw new ResponseStatusException(CONFLICT, "CIN number already registered");
            }
            // identifiantUnique is optional for citizens — only validate uniqueness if provided
            if (request.getIdentifiantUnique() != null && !request.getIdentifiantUnique().isBlank()
                    && citizenRepository.existsByIdentifiantUnique(request.getIdentifiantUnique())) {
                throw new ResponseStatusException(CONFLICT, "Identifiant unique already registered");
            }
        }

        UserRole role = switch (roleUpper) {
            case "CITIZEN" -> UserRole.ROLE_CITIZEN;
            case "AGENT"   -> UserRole.ROLE_AGENT;
            case "ADMIN"   -> UserRole.ROLE_ADMIN;
            default        -> throw new ResponseStatusException(BAD_REQUEST, "Unknown role: " + request.getRole());
        };

        User user = switch (roleUpper) {
            case "CITIZEN" -> new Citizen();
            case "AGENT"   -> new MunicipalAgent();
            case "ADMIN"   -> new Administrator();
            default        -> throw new ResponseStatusException(BAD_REQUEST, "Unknown role: " + request.getRole());
        };

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(role);

        if (user instanceof Citizen citizen) {
            citizen.setIdentifiantUnique(request.getIdentifiantUnique());
            citizen.setNumCin(request.getNumCin());
            citizen.setAddress(request.getAddress());
            citizen.setGovernorate(request.getGovernorate() != null ? 
                Governorate.valueOf(request.getGovernorate().toUpperCase()) : null);
            citizen.setDateOfBirth(request.getDateOfBirth());
        } else if (user instanceof MunicipalAgent agent) {
            if (request.getMatricule() != null && !request.getMatricule().isBlank()) {
                agent.setMatricule(request.getMatricule());
            }
            agent.setServiceType(request.getServiceType() != null ? ServiceType.valueOf(request.getServiceType()) : null);
            agent.setArrondissement(request.getArrondissement());
            agent.setGrade(request.getGrade() != null ? Grade.valueOf(request.getGrade()) : null);
        }

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), role.name());
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (AuthenticationException ex) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid email or password"));

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getRole().name());
    }
}