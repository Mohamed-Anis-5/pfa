package com.pfa.backend.controller;

import com.pfa.backend.entity.MunicipalAgent;
import com.pfa.backend.repository.MunicipalAgentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final MunicipalAgentRepository agentRepository;

    @GetMapping("/agents")
    public List<MunicipalAgent> getAgents() {
        return agentRepository.findAll();
    }
}