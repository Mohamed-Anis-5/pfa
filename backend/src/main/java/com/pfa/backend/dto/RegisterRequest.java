package com.pfa.backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class RegisterRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phoneNumber;
    private String identifiantUnique;
    private String role; // "CITIZEN", "AGENT", "ADMIN"
    
    // Citizen-specific fields
    private String numCin;
    private String address;
    private String governorate;
    private LocalDate dateOfBirth;
    
    // Agent-specific fields
    private String matricule;
    private String serviceType;
    private String arrondissement;
    private String grade;
}