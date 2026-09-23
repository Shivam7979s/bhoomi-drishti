package com.bhoomidrishti.landrecord.dto;

import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.validation.ValidBoundary;
import jakarta.validation.constraints.NotNull;
import org.locationtech.jts.geom.Geometry;

/**
 * Request payload for spatial queries (e.g. POST /api/land-records/spatial/intersects).
 *
 * <p>{@code geometry} must be a valid GeoJSON Polygon or MultiPolygon in SRID 4326.
 * {@code status} optionally restricts results to parcels with that status.
 */
public record SpatialQueryRequest(
        @NotNull(message = "geometry is required")
        @ValidBoundary
        Geometry geometry,
        LandRecordStatus status) {}
