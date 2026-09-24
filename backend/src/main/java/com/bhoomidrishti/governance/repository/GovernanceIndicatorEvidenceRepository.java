package com.bhoomidrishti.governance.repository;

import com.bhoomidrishti.governance.entity.GovernanceEvidenceType;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorEvidence;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GovernanceIndicatorEvidenceRepository extends JpaRepository<GovernanceIndicatorEvidence, UUID> {

    List<GovernanceIndicatorEvidence> findBySnapshotIdOrderByLinkedAtDesc(UUID snapshotId);

    boolean existsBySnapshotIdAndResearchDocumentIdAndDocumentChunkIdAndEvidenceType(
            UUID snapshotId, UUID researchDocumentId, UUID documentChunkId, GovernanceEvidenceType evidenceType);

    Optional<GovernanceIndicatorEvidence> findByIdAndSnapshotId(UUID id, UUID snapshotId);
}
