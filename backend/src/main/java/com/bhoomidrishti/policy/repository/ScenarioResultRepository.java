package com.bhoomidrishti.policy.repository;

import com.bhoomidrishti.policy.entity.ScenarioResult;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScenarioResultRepository extends JpaRepository<ScenarioResult, UUID> {

    Optional<ScenarioResult> findFirstByScenarioIdOrderByExecutedAtDesc(UUID scenarioId);

    List<ScenarioResult> findByScenarioIdOrderByExecutedAtDesc(UUID scenarioId);

    Page<ScenarioResult> findByScenarioIdOrderByExecutedAtDesc(UUID scenarioId, Pageable pageable);

    long countByScenarioId(UUID scenarioId);
}
