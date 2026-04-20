package com.pfa.backend.entity;

import com.pfa.backend.enums.Grade;
import com.pfa.backend.enums.ServiceType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "municipal_agents")
@DiscriminatorValue("AGENT")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class MunicipalAgent extends User {

    @Column(nullable = false, unique = true, length = 50)
    private String matricule = "UNSET-" + java.util.UUID.randomUUID().toString().substring(0, 8);

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Grade grade = Grade.Cat_A;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false)
    private ServiceType serviceType = ServiceType.Voirie;

    @Column(name = "arrondissement", length = 120)
    private String arrondissement;
}