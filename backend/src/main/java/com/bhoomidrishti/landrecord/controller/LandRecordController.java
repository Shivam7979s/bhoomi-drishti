package com.bhoomidrishti.landrecord.controller;

import com.bhoomidrishti.common.PageResponse;
import com.bhoomidrishti.exception.InvalidGeometryException;
import com.bhoomidrishti.landrecord.dto.CreateLandRecordRequest;
import com.bhoomidrishti.landrecord.dto.LandRecordResponse;
import com.bhoomidrishti.landrecord.dto.UpdateLandRecordRequest;
import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.service.LandRecordService;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import java.util.UUID;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKTReader;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/land-records")
@Validated
public class LandRecordController {

    private final LandRecordService service;
    private final ObjectMapper objectMapper;

    public LandRecordController(LandRecordService service, ObjectMapper objectMapper) {
        this.service = service;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public PageResponse<LandRecordResponse> list(
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String tehsil,
            @RequestParam(required = false) String village,
            @RequestParam(required = false) String parcelNumber,
            @RequestParam(required = false) String landUseType,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        return service.list(state, district, tehsil, village, parcelNumber, landUseType, status,
                page, size, auth);
    }

    @GetMapping("/{id}")
    public LandRecordResponse getById(@PathVariable UUID id, Authentication auth) {
        return service.getById(id, auth);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('GOVERNMENT_OFFICIAL','ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public LandRecordResponse create(
            @Valid @RequestBody CreateLandRecordRequest request, Authentication auth) {
        return service.create(request, auth);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('GOVERNMENT_OFFICIAL','ADMIN')")
    public LandRecordResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLandRecordRequest request,
            Authentication auth) {
        return service.update(id, request, auth);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, Authentication auth) {
        service.delete(id, auth);
    }

    @PostMapping("/spatial/intersects")
    @PreAuthorize("isAuthenticated()")
    public PageResponse<LandRecordResponse> spatialIntersectsPost(
            @Valid @RequestBody com.bhoomidrishti.landrecord.dto.SpatialQueryRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        return service.findIntersecting(request.geometry(), request.status(), page, size, auth);
    }

    @GetMapping("/spatial/intersects")
    @PreAuthorize("isAuthenticated()")
    public PageResponse<LandRecordResponse> spatialIntersects(
            @RequestParam String geometry,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        Geometry g = parseGeometry(geometry);
        LandRecordStatus s = parseStatus(status);
        return service.findIntersecting(g, s, page, size, auth);
    }

    @PostMapping("/spatial/contains")
    @PreAuthorize("isAuthenticated()")
    public PageResponse<LandRecordResponse> spatialContainsPost(
            @Valid @RequestBody com.bhoomidrishti.landrecord.dto.SpatialQueryRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        return service.findContaining(request.geometry(), request.status(), page, size, auth);
    }

    @GetMapping("/spatial/contains")
    @PreAuthorize("isAuthenticated()")
    public PageResponse<LandRecordResponse> spatialContains(
            @RequestParam String geometry,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        Geometry g = parseGeometry(geometry);
        LandRecordStatus s = parseStatus(status);
        return service.findContaining(g, s, page, size, auth);
    }

    private Geometry parseGeometry(String geometryParam) {
        try {
            JsonNode node = objectMapper.readTree(geometryParam);
            return objectMapper.treeToValue(node, Geometry.class);
        } catch (Exception e) {
            try {
                WKTReader reader = new WKTReader();
                Geometry geom = reader.read(geometryParam);
                geom.setSRID(4326);
                return geom;
            } catch (ParseException ex) {
                throw new InvalidGeometryException(
                        "geometry parameter must be valid GeoJSON or WKT with SRID 4326: "
                                + ex.getMessage(), ex);
            }
        }
    }

    private static LandRecordStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return LandRecordStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("invalid status: " + status);
        }
    }
}