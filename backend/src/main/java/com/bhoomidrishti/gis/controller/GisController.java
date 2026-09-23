package com.bhoomidrishti.gis.controller;

import com.bhoomidrishti.gis.dto.GeoJsonFeatureCollection;
import com.bhoomidrishti.gis.dto.GisFilterOptionsResponse;
import com.bhoomidrishti.gis.dto.ParcelSummaryResponse;
import com.bhoomidrishti.gis.service.GisService;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/gis")
@Validated
public class GisController {

    private final GisService gisService;

    public GisController(GisService gisService) {
        this.gisService = gisService;
    }

    @GetMapping("/land-records")
    public GeoJsonFeatureCollection getLandRecords(
            @RequestParam(required = false) String bbox,
            @RequestParam(required = false) Double minLon,
            @RequestParam(required = false) Double minLat,
            @RequestParam(required = false) Double maxLon,
            @RequestParam(required = false) Double maxLat,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String tehsil,
            @RequestParam(required = false) String village,
            @RequestParam(required = false) String landUseType,
            @RequestParam(required = false) String ownershipType,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "100") Integer limit,
            Authentication auth) {

        Double effectiveMinLon = minLon;
        Double effectiveMinLat = minLat;
        Double effectiveMaxLon = maxLon;
        Double effectiveMaxLat = maxLat;

        if (bbox != null && !bbox.isBlank()) {
            String[] parts = bbox.split(",");
            if (parts.length != 4) {
                throw new IllegalArgumentException(
                        "bbox parameter must be 4 comma-separated values: minLon,minLat,maxLon,maxLat");
            }
            try {
                effectiveMinLon = Double.parseDouble(parts[0].trim());
                effectiveMinLat = Double.parseDouble(parts[1].trim());
                effectiveMaxLon = Double.parseDouble(parts[2].trim());
                effectiveMaxLat = Double.parseDouble(parts[3].trim());
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException(
                        "bbox coordinates must be valid floating point numbers: " + bbox);
            }
        }

        return gisService.getLandRecordsGeoJson(
                effectiveMinLon, effectiveMinLat, effectiveMaxLon, effectiveMaxLat,
                state, district, tehsil, village,
                landUseType, ownershipType, status,
                limit, auth);
    }

    @GetMapping("/land-records/{id}/summary")
    public ParcelSummaryResponse getParcelSummary(
            @PathVariable UUID id,
            Authentication auth) {
        return gisService.getParcelSummary(id, auth);
    }

    @GetMapping("/filters")
    public GisFilterOptionsResponse getFilters() {
        return gisService.getFilterOptions();
    }
}
