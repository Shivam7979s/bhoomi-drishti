package com.bhoomidrishti.gis.dto;

import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.landrecord.entity.OwnershipType;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Lightweight summary of a land parcel with geometry bounding box and linked research count.
 */
public record ParcelSummaryResponse(
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
        LandRecordStatus status,
        String ownerName,
        String ownerIdentifier,
        double[] bbox, // [minLon, minLat, maxLon, maxLat]
        long linkedResearchDocumentsCount
) {
}
