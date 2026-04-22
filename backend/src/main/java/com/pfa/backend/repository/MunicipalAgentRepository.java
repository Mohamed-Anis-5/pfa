package com.pfa.backend.repository;

import com.pfa.backend.entity.MunicipalAgent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MunicipalAgentRepository extends JpaRepository<MunicipalAgent, Long> {
	boolean existsByMatricule(String matricule);
}