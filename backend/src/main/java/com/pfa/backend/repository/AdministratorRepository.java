package com.pfa.backend.repository;

import com.pfa.backend.entity.Administrator;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdministratorRepository extends JpaRepository<Administrator, Long> {
    boolean existsByIdentifiantUnique(String identifiantUnique);
}