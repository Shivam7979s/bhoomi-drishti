package com.bhoomidrishti.landrecord.dto;

import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.landrecord.entity.OwnershipType;
import com.bhoomidrishti.landrecord.validation.OwnerNameRequired;
import com.bhoomidrishti.landrecord.validation.ValidBoundary;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import org.locationtech.jts.geom.Geometry;

/**
 * Payload for {@code PUT /api/land-records/{id}} - a full replacement of the mutable fields.
 * See {@link CreateLandRecordRequest} for the privacy note on {@code ownerIdentifier}.
 */
@OwnerNameRequired
public record UpdateLandRecordRequest(
        @NotBlank(message = "parcelNumber is required") String parcelNumber,
        String surveyNumber,
        @NotBlank(message = "state is required") String state,
        @NotBlank(message = "district is required") String district,
        @NotBlank(message = "tehsil is required") String tehsil,
        @NotBlank(message = "village is required") String village,
        @NotNull(message = "landAreaSqMeters is required") @Positive(message = "landAreaSqMeters must be positive") BigDecimal landAreaSqMeters,
        @NotNull(message = "landUseType is required") LandUseType landUseType,
        @NotNull(message = "ownershipType is required") OwnershipType ownershipType,
        @NotBlank(message = "ownerName is required") String ownerName,
        String ownerIdentifier,
        @NotNull(message = "status is required") LandRecordStatus status,
        @NotNull(message = "boundary is required") @ValidBoundary Geometry boundary) {}
