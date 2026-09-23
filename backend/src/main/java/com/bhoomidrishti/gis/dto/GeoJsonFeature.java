package com.bhoomidrishti.gis.dto;

import java.util.Map;
import java.util.UUID;
import org.locationtech.jts.geom.Geometry;

/**
 * Standard RFC 7946 GeoJSON Feature representation.
 */
public record GeoJsonFeature(
        String type,
        UUID id,
        Geometry geometry,
        Map<String, Object> properties
) {
    public static GeoJsonFeature of(UUID id, Geometry geometry, Map<String, Object> properties) {
        return new GeoJsonFeature("Feature", id, geometry, properties);
    }
}
