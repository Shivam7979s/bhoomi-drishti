package com.bhoomidrishti.governance.dto;

import com.bhoomidrishti.governance.entity.GovernanceIndicatorSnapshot;
import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import com.bhoomidrishti.governance.entity.IndicatorCategory;
import com.bhoomidrishti.governance.entity.IndicatorUnit;
import com.bhoomidrishti.governance.entity.SnapshotVisibility;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record GovernanceIndicatorSnapshotResponse(
        UUID id,
        UUID indicatorDefinitionId,
        String indicatorCode,
        String indicatorName,
        IndicatorCategory category,
        IndicatorUnit unit,
        UUID projectId,
        GovernanceScopeType scopeType,
        String state,
        String district,
        String tehsil,
        String village,
        SnapshotVisibility visibility,
        Instant asOf,
        Instant periodStart,
        Instant periodEnd,
        BigDecimal numericValue,
        BigDecimal denominator,
        String breakdownJson,
        String calculationVersion,
        Instant sourceDataTimestamp,
        String sourceDataVersion,
        UUID generatedById,
        String generatedByName,
        Instant generatedAt,
        int evidenceCount) {

    public static GovernanceIndicatorSnapshotResponse fromEntity(GovernanceIndicatorSnapshot entity) {
        return new GovernanceIndicatorSnapshotResponse(
                entity.getId(),
                entity.getIndicatorDefinition().getId(),
                entity.getIndicatorDefinition().getCode(),
                entity.getIndicatorDefinition().getName(),
                entity.getIndicatorDefinition().getCategory(),
                entity.getIndicatorDefinition().getUnit(),
                entity.getProject() != null ? entity.getProject().getId() : null,
                entity.getScopeType(),
                entity.getState(),
                entity.getDistrict(),
                entity.getTehsil(),
                entity.getVillage(),
                entity.getVisibility(),
                entity.getAsOf(),
                entity.getPeriodStart(),
                entity.getPeriodEnd(),
                entity.getNumericValue(),
                entity.getDenominator(),
                entity.getBreakdownJson(),
                entity.getCalculationVersion(),
                entity.getSourceDataTimestamp(),
                entity.getSourceDataVersion(),
                entity.getGeneratedBy().getId(),
                entity.getGeneratedBy().getName(),
                entity.getGeneratedAt(),
                entity.getEvidence() != null ? entity.getEvidence().size() : 0);
    }
}
