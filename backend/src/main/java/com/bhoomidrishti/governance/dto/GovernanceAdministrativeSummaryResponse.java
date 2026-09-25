package com.bhoomidrishti.governance.dto;

import java.time.Instant;
import java.util.List;

/**
 * Deterministic administrative summary aggregating multiple governance
 * indicators for a specific scope.
 *
 * <p>
 * Represents CURRENT/LIVE database calculations. Does NOT persist the result.
 */
public record GovernanceAdministrativeSummaryResponse(
                GovernanceScopeSummaryResponse scope,
                String summaryMode,
                Instant generatedAt,
                Instant sourceDataTimestamp,
                String calculationVersion,
                int totalIndicatorsEvaluated,
                List<GovernanceSummaryIndicatorItemResponse> indicators) {
}
