package com.pfa.backend.entity;

import com.pfa.backend.enums.Governorate;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "citizens")
@DiscriminatorValue("CITIZEN")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Citizen extends User {

    @Column(name = "num_cin", unique = true, length = 8)
    private String numCin;

    @Column(name = "identifiant_unique", unique = true, length = 11)
    private String identifiantUnique;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(name = "governorate")
    private Governorate governorate;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;
}