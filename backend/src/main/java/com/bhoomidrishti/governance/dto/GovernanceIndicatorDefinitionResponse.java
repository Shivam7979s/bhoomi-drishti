package com.bhoomidrishti.governance.dto;

import com.bhoomidrishti.governance.entity.AggregationMethod;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorDefinition;
import com.bhoomidrishti.governance.entity.IndicatorCategory;
import com.bhoomidrishti.governance.entity.IndicatorUnit;
import java.time.Instant;
import java.util.UUID;

public record GovernanceIndicatorDefinitionResponse(
        UUID id,
        String code,
        String name,
        String description,
        IndicatorCategory category,
        IndicatorUnit unit,
        AggregationMethod aggregationMethod,
        String sourceDomain,
        String calculationVersion,
        boolean active,
        Instant createdAt,
        Instant updatedAt) {

    public static GovernanceIndicatorDefinitionResponse fromEntity(GovernanceIndicatorDefinition entity) {
        return new GovernanceIndicatorDefinitionResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getDescription(),
                entity.getCategory(),
                entity.getUnit(),
                entity.getAggregationMethod(),
                entity.getSourceDomain(),
                entity.getCalculationVersion(),
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }
}
