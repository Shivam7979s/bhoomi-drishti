package com.bhoomidrishti.governance.dto;

import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import com.bhoomidrishti.governance.entity.SnapshotVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record CreateGovernanceSnapshotRequest(
        @NotBlank(message = "Indicator code is required")
        String indicatorCode,

        UUID projectId,

        @NotNull(message = "Scope type is required")
        GovernanceScopeType scopeType,

        String state,
        String district,
        String tehsil,
        String village,

        SnapshotVisibility visibility,

        Instant asOf,
        Instant periodStart,
        Instant periodEnd,
        String sourceDataVersion) {}
