package com.pfa.backend.repository;

import com.pfa.backend.entity.Complaint;
import com.pfa.backend.enums.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {

    List<Complaint> findByCitizenId(Long citizenId);
    List<Complaint> findByAssignedAgentId(Long agentId);
    List<Complaint> findByStatus(ComplaintStatus status);

    // SLA: complaints that are active and overdue
    @Query("""
        SELECT c FROM Complaint c
        WHERE c.status IN ('ASSIGNED', 'IN_PROGRESS')
        AND c.targetDate < :today
        """)
    List<Complaint> findOverdueComplaints(@Param("today") LocalDate today);

    // Dashboard: count by status
    @Query("SELECT c.status AS status, COUNT(c) AS total FROM Complaint c GROUP BY c.status")
    List<Map<String, Object>> countByStatus();

    // Dashboard: count by category
    @Query("SELECT c.category.label AS category, COUNT(c) AS total FROM Complaint c GROUP BY c.category.label")
    List<Map<String, Object>> countByCategory();

    // Dashboard: average resolution time in hours
    @Query(value = """
        SELECT AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 3600.0)
        FROM complaints c
        WHERE c.resolved_at IS NOT NULL
        """, nativeQuery = true)
    Double averageResolutionTimeHours();

    // Geospatial: complaints within radiusMeters of a given point
    @Query(value = """
        SELECT * FROM complaints c
        WHERE c.location IS NOT NULL
        AND ST_DWithin(
            c.location::geography,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :radiusMeters
        )
        """, nativeQuery = true)
    List<Complaint> findWithinRadius(
            @Param("lat") double latitude,
            @Param("lng") double longitude,
            @Param("radiusMeters") double radiusMeters);
}