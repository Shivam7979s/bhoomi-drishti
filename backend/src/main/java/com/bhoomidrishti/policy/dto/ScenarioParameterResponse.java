package com.bhoomidrishti.policy.dto;

import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.landrecord.entity.OwnershipType;
import com.bhoomidrishti.policy.entity.ScenarioParameter;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ScenarioParameterResponse(
        UUID id,
        UUID scenarioId,
        String targetState,
        String targetDistrict,
        String targetTehsil,
        String targetVillage,
        String interventionGeometryWkt,
        LandUseType sourceLandUse,
        LandUseType targetLandUse,
        BigDecimal conversionPercentage,
        BigDecimal maxOwnershipArea,
        OwnershipType targetOwnershipType,
        BigDecimal bufferDistanceMeters,
        String customParametersJson,
        Instant createdAt,
        Instant updatedAt
) {
    public static ScenarioParameterResponse from(ScenarioParameter p) {
        if (p == null) return null;
        String wkt = p.getInterventionGeometry() != null ? p.getInterventionGeometry().toText() : null;
        return new ScenarioParameterResponse(
                p.getId(),
                p.getScenario() != null ? p.getScenario().getId() : null,
                p.getTargetState(),
                p.getTargetDistrict(),
                p.getTargetTehsil(),
                p.getTargetVillage(),
                wkt,
                p.getSourceLandUse(),
                p.getTargetLandUse(),
                p.getConversionPercentage(),
                p.getMaxOwnershipArea(),
                p.getTargetOwnershipType(),
                p.getBufferDistanceMeters(),
                p.getCustomParameters(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
