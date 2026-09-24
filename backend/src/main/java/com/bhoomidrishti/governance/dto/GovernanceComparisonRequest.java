package com.bhoomidrishti.governance.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * Request payload for comparing two governance snapshots or comparing a snapshot against live data.
 */
public record GovernanceComparisonRequest(
        @NotNull(message = "baselineSnapshotId is required")
        UUID baselineSnapshotId,

        UUID targetSnapshotId,

        Boolean compareToLive
) {
    public boolean isCompareToLive() {
        return Boolean.TRUE.equals(compareToLive);
    }
}
