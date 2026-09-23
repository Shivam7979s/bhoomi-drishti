package com.bhoomidrishti.gis.dto;

import java.util.List;
import java.util.Map;

/**
 * Standard RFC 7946 GeoJSON FeatureCollection with explicit truncation and pagination metadata.
 */
public record GeoJsonFeatureCollection(
        String type,
        List<GeoJsonFeature> features,
        long totalCount,
        int returnedCount,
        boolean truncated,
        boolean zoomThresholdMet,
        Map<String, Object> metadata
) {
    public static GeoJsonFeatureCollection of(
            List<GeoJsonFeature> features,
            long totalCount,
            boolean zoomThresholdMet,
            Map<String, Object> metadata) {
        int returned = features != null ? features.size() : 0;
        boolean isTruncated = totalCount > returned;
        return new GeoJsonFeatureCollection(
                "FeatureCollection",
                features != null ? features : List.of(),
                totalCount,
                returned,
                isTruncated,
                zoomThresholdMet,
                metadata != null ? metadata : Map.of()
        );
    }
}
