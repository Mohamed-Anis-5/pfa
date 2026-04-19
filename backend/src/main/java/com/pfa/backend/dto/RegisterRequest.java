package com.pfa.backend.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phoneNumber;
    private String identifiantUnique;
    private String role; // "CITIZEN", "AGENT", "ADMIN"
}