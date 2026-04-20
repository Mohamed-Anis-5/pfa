package com.pfa.backend.config;

import com.pfa.backend.entity.Administrator;
import com.pfa.backend.entity.Category;
import com.pfa.backend.entity.Citizen;
import com.pfa.backend.entity.Complaint;
import com.pfa.backend.entity.MunicipalAgent;
import com.pfa.backend.enums.ComplaintStatus;
import com.pfa.backend.enums.Governorate;
import com.pfa.backend.enums.Grade;
import com.pfa.backend.enums.Priority;
import com.pfa.backend.enums.ServiceType;
import com.pfa.backend.enums.UserRole;
import com.pfa.backend.repository.CategoryRepository;
import com.pfa.backend.repository.ComplaintRepository;
import com.pfa.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = false)
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ComplaintRepository complaintRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedCategories();

        Administrator admin = ensureAdmin();
        MunicipalAgent agent = ensureAgent();
        Citizen citizen = ensureCitizen();

        if (complaintRepository.count() == 0) {
            Category defaultCategory = categoryRepository.findAll().stream().findFirst().orElseThrow();

            Complaint complaint = Complaint.builder()
                    .title("Poubelle non ramassee")
                    .description("La poubelle de quartier n'a pas ete ramassee depuis 3 jours")
                    .status(ComplaintStatus.PENDING)
                    .priority(Priority.Medium)
                    .latitude(36.8065)
                    .longitude(10.1815)
                    .category(defaultCategory)
                    .citizen(citizen)
                    .targetDate(LocalDate.now().plusDays(defaultCategory.getSlaDays()))
                    .build();

            complaintRepository.save(complaint);
            log.info("Seeded demo complaint for citizen {}", citizen.getEmail());
        }

        log.info("Demo seed data ready. Admin={}, Agent={}, Citizen={}",
                admin.getEmail(), agent.getEmail(), citizen.getEmail());
    }

    private void seedCategories() {
        if (categoryRepository.count() > 0) {
            return;
        }

        List<Category> categories = List.of(
                Category.builder().label("Voirie").slaDays(3).build(),
                Category.builder().label("Eclairage public").slaDays(2).build(),
                Category.builder().label("Assainissement").slaDays(4).build(),
                Category.builder().label("Espaces verts").slaDays(5).build()
        );

        categoryRepository.saveAll(categories);
        log.info("Seeded {} complaint categories", categories.size());
    }

    private Administrator ensureAdmin() {
        return (Administrator) userRepository.findByEmail("admin.demo@municipalite.tn")
                .orElseGet(() -> {
                    Administrator admin = new Administrator();
                    admin.setFirstName("Admin");
                    admin.setLastName("Demo");
                    admin.setEmail("admin.demo@municipalite.tn");
                    admin.setPassword(passwordEncoder.encode("Admin@123"));
                    admin.setPhoneNumber("20000001");
                    admin.setRole(UserRole.ROLE_ADMIN);
                    admin.setRoleLevel("SUPER");
                    admin.setCanValidateBudget(true);
                    return (Administrator) userRepository.save(admin);
                });
    }

    private MunicipalAgent ensureAgent() {
        return (MunicipalAgent) userRepository.findByEmail("agent.demo@municipalite.tn")
                .orElseGet(() -> {
                    MunicipalAgent agent = new MunicipalAgent();
                    agent.setFirstName("Agent");
                    agent.setLastName("Demo");
                    agent.setEmail("agent.demo@municipalite.tn");
                    agent.setPassword(passwordEncoder.encode("Agent@123"));
                    agent.setPhoneNumber("20000002");
                    agent.setRole(UserRole.ROLE_AGENT);
                    agent.setMatricule("AG-DEMO-001");
                    agent.setGrade(Grade.Cat_A);
                    agent.setServiceType(ServiceType.Voirie);
                    agent.setArrondissement("Centre Ville");
                    return (MunicipalAgent) userRepository.save(agent);
                });
    }

    private Citizen ensureCitizen() {
        return (Citizen) userRepository.findByEmail("citizen.demo@municipalite.tn")
                .orElseGet(() -> {
                    Citizen citizen = new Citizen();
                    citizen.setFirstName("Citizen");
                    citizen.setLastName("Demo");
                    citizen.setEmail("citizen.demo@municipalite.tn");
                    citizen.setPassword(passwordEncoder.encode("Citizen@123"));
                    citizen.setPhoneNumber("20000003");
                    citizen.setRole(UserRole.ROLE_CITIZEN);
                    citizen.setIdentifiantUnique("12345678901");
                    citizen.setNumCin("12345678");
                    citizen.setAddress("Tunis Centre");
                    citizen.setGovernorate(Governorate.TUNIS);
                    citizen.setDateOfBirth(LocalDate.of(1995, 1, 1));
                    return (Citizen) userRepository.save(citizen);
                });
    }
}