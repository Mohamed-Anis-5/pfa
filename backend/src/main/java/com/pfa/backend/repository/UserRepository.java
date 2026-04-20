package com.pfa.backend.repository;

import com.pfa.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.role = com.pfa.backend.enums.UserRole.ROLE_ADMIN")
    List<User> findAllAdmins();
}