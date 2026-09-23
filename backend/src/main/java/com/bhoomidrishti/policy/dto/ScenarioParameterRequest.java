package com.bhoomidrishti.policy.dto;

import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.landrecord.entity.OwnershipType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ScenarioParameterRequest(
        @Size(max = 100, message = "Target state cannot exceed 100 characters")
        String targetState,

        @Size(max = 100, message = "Target district cannot exceed 100 characters")
        String targetDistrict,

        @Size(max = 100, message = "Target tehsil cannot exceed 100 characters")
        String targetTehsil,

        @Size(max = 100, message = "Target village cannot exceed 100 characters")
        String targetVillage,

        String interventionGeometryWkt,

        LandUseType sourceLandUse,

        LandUseType targetLandUse,

        @DecimalMin(value = "0.00", message = "Conversion percentage cannot be negative")
        @DecimalMax(value = "100.00", message = "Conversion percentage cannot exceed 100")
        BigDecimal conversionPercentage,

        @DecimalMin(value = "0.00", message = "Max ownership area cannot be negative")
        BigDecimal maxOwnershipArea,

        OwnershipType targetOwnershipType,

        @DecimalMin(value = "0.00", message = "Buffer distance cannot be negative")
        BigDecimal bufferDistanceMeters,

        String customParametersJson
) {
}
