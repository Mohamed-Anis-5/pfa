package com.pfa.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "administrators")
@DiscriminatorValue("ADMIN")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Administrator extends User {

    @Column(name = "role_level", nullable = false, length = 50)
    private String roleLevel = "STANDARD";

    @Column(name = "can_validate_budget", nullable = false)
    private Boolean canValidateBudget = false;
}