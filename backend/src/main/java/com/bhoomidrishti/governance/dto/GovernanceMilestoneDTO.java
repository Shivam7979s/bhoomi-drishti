package com.bhoomidrishti.governance.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Encapsulates the quantitative, temporal, and provenance metadata of an individual
 * measurement milestone (either an immutable snapshot or a real-time live calculation).
 *
 * <p>Adheres strictly to minimum-necessary-data principles: exposes only measurement
 * metrics, timestamps, and statutory evidence counts, omitting internal user IDs or PII.
 */
public record GovernanceMilestoneDTO(
        UUID snapshotId,
        Instant asOf,
        BigDecimal numericValue,
        BigDecimal denominator,
        String calculationVersion,
        boolean isLive,
        int evidenceCount
) {}
