package com.bhoomidrishti.policy.repository;

import com.bhoomidrishti.policy.entity.ScenarioEvidence;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScenarioEvidenceRepository extends JpaRepository<ScenarioEvidence, UUID> {

    List<ScenarioEvidence> findByScenarioIdOrderByLinkedAtDesc(UUID scenarioId);

    boolean existsByScenarioIdAndResearchDocumentId(UUID scenarioId, UUID researchDocumentId);

    boolean existsByScenarioIdAndDocumentChunkId(UUID scenarioId, UUID documentChunkId);

    long countByScenarioId(UUID scenarioId);
}
