package com.bhoomidrishti.policy.repository;

import com.bhoomidrishti.policy.entity.EvidenceType;
import com.bhoomidrishti.policy.entity.ScenarioEvidence;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScenarioEvidenceRepository extends JpaRepository<ScenarioEvidence, UUID> {

    List<ScenarioEvidence> findByScenarioIdOrderByLinkedAtDesc(UUID scenarioId);

    boolean existsByScenarioIdAndResearchDocumentId(UUID scenarioId, UUID researchDocumentId);

    boolean existsByScenarioIdAndDocumentChunkId(UUID scenarioId, UUID documentChunkId);

    long countByScenarioId(UUID scenarioId);

    @Query("SELECT COUNT(se) > 0 FROM ScenarioEvidence se WHERE se.scenario.id = :scenarioId " +
           "AND se.researchDocument.id = :researchDocumentId " +
           "AND se.evidenceType = :evidenceType " +
           "AND ((:documentChunkId IS NULL AND se.documentChunkId IS NULL) OR (se.documentChunkId = :documentChunkId))")
    boolean existsDuplicateEvidence(
            @Param("scenarioId") UUID scenarioId,
            @Param("researchDocumentId") UUID researchDocumentId,
            @Param("documentChunkId") UUID documentChunkId,
            @Param("evidenceType") EvidenceType evidenceType);

    @Query("SELECT se FROM ScenarioEvidence se WHERE se.id = :id AND se.scenario.id = :scenarioId")
    Optional<ScenarioEvidence> findByIdAndScenarioId(
            @Param("id") UUID id,
            @Param("scenarioId") UUID scenarioId);
}
