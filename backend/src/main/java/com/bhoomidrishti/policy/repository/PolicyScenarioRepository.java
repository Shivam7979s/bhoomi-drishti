package com.bhoomidrishti.policy.repository;

import com.bhoomidrishti.policy.entity.PolicyScenario;
import com.bhoomidrishti.policy.entity.ScenarioStatus;
import com.bhoomidrishti.policy.entity.ScenarioType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PolicyScenarioRepository extends JpaRepository<PolicyScenario, UUID> {

    Page<PolicyScenario> findByProjectIdOrderByCreatedAtDesc(UUID projectId, Pageable pageable);

    Page<PolicyScenario> findByProjectIdAndStatusOrderByCreatedAtDesc(
            UUID projectId, ScenarioStatus status, Pageable pageable);

    Page<PolicyScenario> findByProjectIdAndScenarioTypeOrderByCreatedAtDesc(
            UUID projectId, ScenarioType scenarioType, Pageable pageable);

    Optional<PolicyScenario> findByIdAndProjectId(UUID id, UUID projectId);

    Optional<PolicyScenario> findByProjectIdAndSlug(UUID projectId, String slug);

    boolean existsByProjectIdAndSlug(UUID projectId, String slug);

    boolean existsByProjectIdAndName(UUID projectId, String name);

    long countByProjectId(UUID projectId);
}
