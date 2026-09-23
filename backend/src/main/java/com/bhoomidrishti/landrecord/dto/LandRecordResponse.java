package com.bhoomidrishti.landrecord.dto;

import com.bhoomidrishti.landrecord.entity.LandRecord;
import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.landrecord.entity.OwnershipType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.locationtech.jts.geom.Geometry;

/**
 * Read-only representation of a {@link LandRecord} sent to the client.
 *
 * <p>Does <em>not</em> expose the JPA entity directly. The {@code boundary} is serialised
 * as GeoJSON (handled by {@code GeoJsonGeometryConverter}).
 */
public record LandRecordResponse(
        UUID id,
        String parcelNumber,
        String surveyNumber,
        String state,
        String district,
        String tehsil,
        String village,
        BigDecimal landAreaSqMeters,
        LandUseType landUseType,
        OwnershipType ownershipType,
        String ownerName,
        String ownerIdentifier,
        LandRecordStatus status,
        Geometry boundary,
        Instant createdAt,
        Instant updatedAt) {

    public static LandRecordResponse from(LandRecord record) {
        return new LandRecordResponse(
                record.getId(),
                record.getParcelNumber(),
                record.getSurveyNumber(),
                record.getState(),
                record.getDistrict(),
                record.getTehsil(),
                record.getVillage(),
                record.getLandAreaSqMeters(),
                record.getLandUseType(),
                record.getOwnershipType(),
                record.getOwnerName(),
                record.getOwnerIdentifier(),
                record.getStatus(),
                record.getBoundary(),
                record.getCreatedAt(),
                record.getUpdatedAt());
    }
}