package com.bhoomidrishti.governance.dto;

import java.util.List;

/**
 * Factual provenance change summary of statutory and administrative evidence
 * between two governance audit snapshots.
 */
public record GovernanceEvidenceDeltaDTO(
        int commonEvidenceCount,
        int addedEvidenceCount,
        int removedEvidenceCount,
        List<GovernanceIndicatorEvidenceResponse> commonEvidence,
        List<GovernanceIndicatorEvidenceResponse> addedEvidence,
        List<GovernanceIndicatorEvidenceResponse> removedEvidence
) {}
