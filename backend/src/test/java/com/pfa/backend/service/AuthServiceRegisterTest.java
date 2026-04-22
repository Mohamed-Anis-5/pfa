package com.pfa.backend.service;

import com.pfa.backend.dto.AuthResponse;
import com.pfa.backend.dto.RegisterRequest;
import com.pfa.backend.entity.Administrator;
import com.pfa.backend.entity.Citizen;
import com.pfa.backend.entity.MunicipalAgent;
import com.pfa.backend.entity.User;
import com.pfa.backend.enums.Governorate;
import com.pfa.backend.enums.Grade;
import com.pfa.backend.enums.ServiceType;
import com.pfa.backend.enums.UserRole;
import com.pfa.backend.repository.AdministratorRepository;
import com.pfa.backend.repository.CitizenRepository;
import com.pfa.backend.repository.MunicipalAgentRepository;
import com.pfa.backend.repository.UserRepository;
import com.pfa.backend.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.BAD_REQUEST;

@ExtendWith(MockitoExtension.class)
class AuthServiceRegisterTest {

    @Mock
    private AdministratorRepository administratorRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CitizenRepository citizenRepository;

    @Mock
    private MunicipalAgentRepository municipalAgentRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    @Test
    void registerCitizenPersistsCitizenFieldsUsingCanonicalRoleAndGovernorateValues() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Jane");
        request.setLastName("Doe");
        request.setEmail("jane@example.com");
        request.setPassword("password123");
        request.setPhoneNumber("12345678");
        request.setRole("ROLE_CITIZEN");
        request.setNumCin("12345678");
        request.setIdentifiantUnique("12345678901");
        request.setAddress("Main street");
        request.setGovernorate("BEN_AROUS");
        request.setDateOfBirth(LocalDate.of(1995, 6, 15));

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(citizenRepository.existsByNumCin(request.getNumCin())).thenReturn(false);
        when(citizenRepository.existsByIdentifiantUnique(request.getIdentifiantUnique())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded-password");
        when(jwtUtil.generateToken(request.getEmail())).thenReturn("jwt-token");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = authService.register(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        Citizen savedCitizen = assertInstanceOf(Citizen.class, userCaptor.getValue());

        assertEquals("jwt-token", response.getToken());
        assertEquals(request.getEmail(), response.getEmail());
        assertEquals(UserRole.ROLE_CITIZEN.name(), response.getRole());
        assertEquals("encoded-password", savedCitizen.getPassword());
        assertEquals(request.getNumCin(), savedCitizen.getNumCin());
        assertEquals(request.getIdentifiantUnique(), savedCitizen.getIdentifiantUnique());
        assertEquals(request.getAddress(), savedCitizen.getAddress());
        assertEquals(Governorate.BEN_AROUS, savedCitizen.getGovernorate());
        assertEquals(request.getDateOfBirth(), savedCitizen.getDateOfBirth());
        assertEquals(UserRole.ROLE_CITIZEN, savedCitizen.getRole());
    }

    @Test
    void registerCitizenAllowsMissingUniqueIdentifier() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Nour");
        request.setLastName("Citizen");
        request.setEmail("citizen-no-id@example.com");
        request.setPassword("password123");
        request.setPhoneNumber("22334455");
        request.setRole("ROLE_CITIZEN");
        request.setNumCin("87654321");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(citizenRepository.existsByNumCin(request.getNumCin())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded-password");
        when(jwtUtil.generateToken(request.getEmail())).thenReturn("jwt-token");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.register(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        Citizen savedCitizen = assertInstanceOf(Citizen.class, userCaptor.getValue());

        assertEquals(null, savedCitizen.getIdentifiantUnique());
    }

    @Test
    void registerAgentPersistsAgentEnumFieldsUsingCanonicalRoleValues() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Ali");
        request.setLastName("Agent");
        request.setEmail("agent@example.com");
        request.setPassword("password123");
        request.setPhoneNumber("87654321");
        request.setRole("ROLE_AGENT");
        request.setMatricule("AG-001");
        request.setServiceType("Espaces_Verts");
        request.setGrade("Cat_B");
        request.setArrondissement("Centre Ville");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded-password");
        when(jwtUtil.generateToken(request.getEmail())).thenReturn("jwt-token");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = authService.register(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        MunicipalAgent savedAgent = assertInstanceOf(MunicipalAgent.class, userCaptor.getValue());

        assertEquals(UserRole.ROLE_AGENT.name(), response.getRole());
        assertEquals("AG-001", savedAgent.getMatricule());
        assertEquals(ServiceType.Espaces_Verts, savedAgent.getServiceType());
        assertEquals(Grade.Cat_B, savedAgent.getGrade());
        assertEquals("Centre Ville", savedAgent.getArrondissement());
        assertEquals(UserRole.ROLE_AGENT, savedAgent.getRole());
    }

    @Test
    void registerAdminRequiresAndPersistsUniqueIdentifier() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Admin");
        request.setLastName("Manager");
        request.setEmail("admin@example.com");
        request.setPassword("password123");
        request.setPhoneNumber("11223344");
        request.setRole("ROLE_ADMIN");
        request.setIdentifiantUnique("ADM-REG-001");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded-password");
        when(jwtUtil.generateToken(request.getEmail())).thenReturn("jwt-token");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = authService.register(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        Administrator savedAdmin = assertInstanceOf(Administrator.class, userCaptor.getValue());

        assertEquals(UserRole.ROLE_ADMIN.name(), response.getRole());
        assertEquals("ADM-REG-001", savedAdmin.getIdentifiantUnique());
        assertEquals(UserRole.ROLE_ADMIN, savedAdmin.getRole());
    }

    @Test
    void registerRejectsUnknownRole() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("unknown@example.com");
        request.setPassword("password123");
        request.setRole("MANAGER");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> authService.register(request));

        assertEquals(BAD_REQUEST, exception.getStatusCode());
        assertEquals("Invalid role: MANAGER", exception.getReason());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerRejectsInvalidGovernorate() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Jane");
        request.setLastName("Doe");
        request.setEmail("citizen@example.com");
        request.setPassword("password123");
        request.setPhoneNumber("12345678");
        request.setRole("ROLE_CITIZEN");
        request.setNumCin("12345678");
        request.setGovernorate("MARSA");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(citizenRepository.existsByNumCin(request.getNumCin())).thenReturn(false);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> authService.register(request));

        assertEquals(BAD_REQUEST, exception.getStatusCode());
        assertEquals("Invalid governorate: MARSA", exception.getReason());
    }

    @Test
    void registerRejectsAgentWithoutUniqueIdentifier() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Ali");
        request.setLastName("Agent");
        request.setEmail("agent-missing-id@example.com");
        request.setPassword("password123");
        request.setPhoneNumber("87654321");
        request.setRole("ROLE_AGENT");
        request.setServiceType("Voirie");
        request.setGrade("Cat_A");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> authService.register(request));

        assertEquals(BAD_REQUEST, exception.getStatusCode());
        assertEquals("Unique identifier is required for agent registration", exception.getReason());
    }

    @Test
    void registerRejectsAdminWithoutUniqueIdentifier() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("admin-no-id@example.com");
        request.setPassword("password123");
        request.setRole("ROLE_ADMIN");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> authService.register(request));

        assertEquals(BAD_REQUEST, exception.getStatusCode());
        assertEquals("Unique identifier is required for admin registration", exception.getReason());
    }

    @Test
    void registerRejectsInvalidServiceType() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Ali");
        request.setLastName("Agent");
        request.setEmail("agent-service@example.com");
        request.setPassword("password123");
        request.setPhoneNumber("87654321");
        request.setRole("ROLE_AGENT");
        request.setMatricule("AG-002");
        request.setServiceType("Roads");
        request.setGrade("Cat_A");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded-password");

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> authService.register(request));

        assertEquals(BAD_REQUEST, exception.getStatusCode());
        assertEquals("Invalid service type: Roads", exception.getReason());
    }

    @Test
    void registerRejectsInvalidGrade() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Ali");
        request.setLastName("Agent");
        request.setEmail("agent-grade@example.com");
        request.setPassword("password123");
        request.setPhoneNumber("87654321");
        request.setRole("ROLE_AGENT");
        request.setMatricule("AG-003");
        request.setServiceType("Voirie");
        request.setGrade("Senior");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded-password");

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> authService.register(request));

        assertEquals(BAD_REQUEST, exception.getStatusCode());
        assertEquals("Invalid grade: Senior", exception.getReason());
    }
}