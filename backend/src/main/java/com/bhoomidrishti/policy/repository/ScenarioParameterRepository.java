package com.bhoomidrishti.policy.repository;

import com.bhoomidrishti.policy.entity.ScenarioParameter;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScenarioParameterRepository extends JpaRepository<ScenarioParameter, UUID> {

    Optional<ScenarioParameter> findByScenarioId(UUID scenarioId);

    void deleteByScenarioId(UUID scenarioId);
}
