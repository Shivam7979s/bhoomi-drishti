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
 * Payload for {@code POST /api/land-records}. {@code boundary} is a GeoJSON Polygon/MultiPolygon
 * (WGS84, SRID 4326), deserialized by the GeoJSON Jackson module.
 *
 * <p>{@code ownerIdentifier} is a non-sensitive prototype placeholder (e.g. an internal owner code) -
 * never store Aadhaar/PAN/phone numbers or any real government identifier here.
 */
@OwnerNameRequired
public record CreateLandRecordRequest(
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
