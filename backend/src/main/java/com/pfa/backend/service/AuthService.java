package com.pfa.backend.service;

import com.pfa.backend.dto.*;
import com.pfa.backend.entity.*;
import com.pfa.backend.enums.UserRole;
import com.pfa.backend.enums.Governorate;
import com.pfa.backend.enums.ServiceType;
import com.pfa.backend.enums.Grade;
import com.pfa.backend.repository.AdministratorRepository;
import com.pfa.backend.repository.CitizenRepository;
import com.pfa.backend.repository.MunicipalAgentRepository;
import com.pfa.backend.repository.UserRepository;
import com.pfa.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AdministratorRepository administratorRepository;
    private final UserRepository userRepository;
    private final CitizenRepository citizenRepository;
    private final MunicipalAgentRepository municipalAgentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(CONFLICT, "Email already in use");
        }

        UserRole role = parseRole(request.getRole());
        String normalizedCitizenOrAdminIdentifier = normalizeIdentifier(request.getIdentifiantUnique());
        String normalizedAgentIdentifier = normalizeIdentifier(request.getMatricule());

        if (role == UserRole.ROLE_CITIZEN) {
            if (request.getNumCin() == null || request.getNumCin().isBlank()) {
                throw new ResponseStatusException(BAD_REQUEST, "CIN number is required for citizen registration");
            }
            if (citizenRepository.existsByNumCin(request.getNumCin())) {
                throw new ResponseStatusException(CONFLICT, "CIN number already registered");
            }
            if (normalizedCitizenOrAdminIdentifier != null && uniqueIdentifierExists(normalizedCitizenOrAdminIdentifier)) {
                throw new ResponseStatusException(CONFLICT, "Identifiant unique already registered");
            }
        } else if (role == UserRole.ROLE_AGENT) {
            if (normalizedAgentIdentifier == null) {
                throw new ResponseStatusException(BAD_REQUEST, "Unique identifier is required for agent registration");
            }
            if (uniqueIdentifierExists(normalizedAgentIdentifier)) {
                throw new ResponseStatusException(CONFLICT, "Identifiant unique already registered");
            }
        } else if (role == UserRole.ROLE_ADMIN) {
            if (normalizedCitizenOrAdminIdentifier == null) {
                throw new ResponseStatusException(BAD_REQUEST, "Unique identifier is required for admin registration");
            }
            if (uniqueIdentifierExists(normalizedCitizenOrAdminIdentifier)) {
                throw new ResponseStatusException(CONFLICT, "Identifiant unique already registered");
            }
        }

        User user = switch (role) {
            case ROLE_CITIZEN -> new Citizen();
            case ROLE_AGENT -> new MunicipalAgent();
            case ROLE_ADMIN -> new Administrator();
        };

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(role);

        if (user instanceof Citizen citizen) {
            citizen.setIdentifiantUnique(normalizedCitizenOrAdminIdentifier);
            citizen.setNumCin(request.getNumCin());
            citizen.setAddress(request.getAddress());
            citizen.setGovernorate(parseEnumValue(request.getGovernorate(), Governorate.class, "governorate"));
            citizen.setDateOfBirth(request.getDateOfBirth());
        } else if (user instanceof MunicipalAgent agent) {
            agent.setMatricule(normalizedAgentIdentifier);
            agent.setServiceType(parseEnumValue(request.getServiceType(), ServiceType.class, "service type"));
            agent.setArrondissement(request.getArrondissement());
            agent.setGrade(parseEnumValue(request.getGrade(), Grade.class, "grade"));
        } else if (user instanceof Administrator administrator) {
            administrator.setIdentifiantUnique(normalizedCitizenOrAdminIdentifier);
        }

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), role.name());
    }

    private UserRole parseRole(String rawRole) {
        String normalizedRole = normalizeEnumToken(rawRole);
        if (normalizedRole == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Role is required");
        }

        return switch (normalizedRole.toUpperCase(Locale.ROOT)) {
            case "CITIZEN", "ROLE_CITIZEN" -> UserRole.ROLE_CITIZEN;
            case "AGENT", "ROLE_AGENT" -> UserRole.ROLE_AGENT;
            case "ADMIN", "ROLE_ADMIN" -> UserRole.ROLE_ADMIN;
            default -> throw new ResponseStatusException(BAD_REQUEST, "Invalid role: " + rawRole);
        };
    }

    private <E extends Enum<E>> E parseEnumValue(String rawValue, Class<E> enumType, String fieldName) {
        String normalizedValue = normalizeEnumToken(rawValue);
        if (normalizedValue == null) {
            return null;
        }

        for (E enumConstant : enumType.getEnumConstants()) {
            if (normalizeEnumToken(enumConstant.name()).equalsIgnoreCase(normalizedValue)) {
                return enumConstant;
            }
        }

        throw new ResponseStatusException(BAD_REQUEST, "Invalid " + fieldName + ": " + rawValue);
    }

    private String normalizeEnumToken(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim().replace(' ', '_').replace('-', '_');
    }

    private String normalizeIdentifier(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private boolean uniqueIdentifierExists(String identifier) {
        return citizenRepository.existsByIdentifiantUnique(identifier)
                || administratorRepository.existsByIdentifiantUnique(identifier)
                || municipalAgentRepository.existsByMatricule(identifier);
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