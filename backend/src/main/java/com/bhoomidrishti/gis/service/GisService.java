package com.bhoomidrishti.gis.service;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.exception.LandRecordNotFoundException;
import com.bhoomidrishti.gis.dto.GeoJsonFeature;
import com.bhoomidrishti.gis.dto.GeoJsonFeatureCollection;
import com.bhoomidrishti.gis.dto.GisFilterOptionsResponse;
import com.bhoomidrishti.gis.dto.ParcelSummaryResponse;
import com.bhoomidrishti.landrecord.entity.LandRecord;
import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.landrecord.entity.OwnershipType;
import com.bhoomidrishti.landrecord.repository.LandRecordRepository;
import com.bhoomidrishti.research.entity.ResearchDocumentStatus;
import com.bhoomidrishti.research.repository.ResearchDocumentRepository;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.locationtech.jts.geom.Envelope;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class GisService {

    public static final int DEFAULT_LIMIT = 100;
    public static final int MAX_LIMIT = 500;
    public static final double MAX_BBOX_AREA_DEGREES = 4.0;

    private final LandRecordRepository landRecordRepository;
    private final ResearchDocumentRepository researchDocumentRepository;

    public GisService(
            LandRecordRepository landRecordRepository,
            ResearchDocumentRepository researchDocumentRepository) {
        this.landRecordRepository = landRecordRepository;
        this.researchDocumentRepository = researchDocumentRepository;
    }

    public GeoJsonFeatureCollection getLandRecordsGeoJson(
            Double minLon,
            Double minLat,
            Double maxLon,
            Double maxLat,
            String state,
            String district,
            String tehsil,
            String village,
            String landUseType,
            String ownershipType,
            String status,
            Integer limit,
            Authentication auth) {

        if (minLon != null || minLat != null || maxLon != null || maxLat != null) {
            if (minLon == null || minLat == null || maxLon == null || maxLat == null) {
                throw new IllegalArgumentException(
                        "Incomplete bounding box: minLon, minLat, maxLon, and maxLat must all be provided together.");
            }
            validateBoundingBox(minLon, minLat, maxLon, maxLat);
        }

        int effectiveLimit = clampLimit(limit);

        // RBAC enforcement for filtering & status
        String effectiveStatus = status;
        if (isPublic(auth)) {
            effectiveStatus = LandRecordStatus.ACTIVE.name();
        } else if (status != null && !status.isBlank()) {
            try {
                effectiveStatus = LandRecordStatus.valueOf(status.toUpperCase()).name();
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid status filter: " + status);
            }
        }

        String effectiveLandUse = null;
        if (landUseType != null && !landUseType.isBlank()) {
            try {
                effectiveLandUse = LandUseType.valueOf(landUseType.toUpperCase()).name();
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid landUseType filter: " + landUseType);
            }
        }

        String effectiveOwnership = null;
        if (ownershipType != null && !ownershipType.isBlank()) {
            try {
                effectiveOwnership = OwnershipType.valueOf(ownershipType.toUpperCase()).name();
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid ownershipType filter: " + ownershipType);
            }
        }

        List<LandRecord> records = landRecordRepository.findInBoundingBox(
                minLon, minLat, maxLon, maxLat,
                trimToNull(state), trimToNull(district), trimToNull(tehsil), trimToNull(village),
                effectiveLandUse, effectiveOwnership, effectiveStatus,
                effectiveLimit);

        long totalCount = landRecordRepository.countInBoundingBox(
                minLon, minLat, maxLon, maxLat,
                trimToNull(state), trimToNull(district), trimToNull(tehsil), trimToNull(village),
                effectiveLandUse, effectiveOwnership, effectiveStatus);

        boolean allowPii = canViewOwnerPii(auth);

        List<GeoJsonFeature> features = new ArrayList<>(records.size());
        for (LandRecord r : records) {
            Map<String, Object> props = new LinkedHashMap<>();
            props.put("parcelNumber", r.getParcelNumber());
            props.put("surveyNumber", r.getSurveyNumber());
            props.put("state", r.getState());
            props.put("district", r.getDistrict());
            props.put("tehsil", r.getTehsil());
            props.put("village", r.getVillage());
            props.put("landAreaSqMeters", r.getLandAreaSqMeters());
            props.put("landUseType", r.getLandUseType().name());
            props.put("ownershipType", r.getOwnershipType().name());
            props.put("status", r.getStatus().name());

            // Strict Owner Privacy (PUBLIC and RESEARCHER/ACADEMIA receive strict nulls)
            if (allowPii) {
                props.put("ownerName", r.getOwnerName());
                props.put("ownerIdentifier", r.getOwnerIdentifier());
            } else {
                props.put("ownerName", null);
                props.put("ownerIdentifier", null);
            }

            long linkedDocs = isPublic(auth)
                    ? researchDocumentRepository.countByLinkedLandRecordIdAndStatus(r.getId(), ResearchDocumentStatus.PUBLISHED)
                    : researchDocumentRepository.countByLinkedLandRecordId(r.getId());
            props.put("linkedDocumentsCount", linkedDocs);

            features.add(GeoJsonFeature.of(r.getId(), r.getBoundary(), props));
        }

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("limit", effectiveLimit);
        if (minLon != null) {
            metadata.put("bbox", new double[]{minLon, minLat, maxLon, maxLat});
        }

        return GeoJsonFeatureCollection.of(features, totalCount, true, metadata);
    }

    public ParcelSummaryResponse getParcelSummary(UUID id, Authentication auth) {
        LandRecord record = landRecordRepository.findById(id)
                .orElseThrow(() -> new LandRecordNotFoundException(id));

        if (isPublic(auth) && record.getStatus() != LandRecordStatus.ACTIVE) {
            throw new LandRecordNotFoundException(id);
        }

        Envelope env = record.getBoundary().getEnvelopeInternal();
        double[] bbox = new double[]{env.getMinX(), env.getMinY(), env.getMaxX(), env.getMaxY()};

        long linkedDocs = isPublic(auth)
                ? researchDocumentRepository.countByLinkedLandRecordIdAndStatus(id, ResearchDocumentStatus.PUBLISHED)
                : researchDocumentRepository.countByLinkedLandRecordId(id);

        boolean allowPii = canViewOwnerPii(auth);
        String ownerName = allowPii ? record.getOwnerName() : null;
        String ownerIdentifier = allowPii ? record.getOwnerIdentifier() : null;

        return new ParcelSummaryResponse(
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
                record.getStatus(),
                ownerName,
                ownerIdentifier,
                bbox,
                linkedDocs
        );
    }

    public GisFilterOptionsResponse getFilterOptions() {
        List<String> states = landRecordRepository.findDistinctStates();
        List<String> districts = landRecordRepository.findDistinctDistricts(null);
        List<String> tehsils = landRecordRepository.findDistinctTehsils(null);
        List<String> villages = landRecordRepository.findDistinctVillages(null);

        List<String> landUseTypes = Arrays.stream(LandUseType.values()).map(Enum::name).toList();
        List<String> ownershipTypes = Arrays.stream(OwnershipType.values()).map(Enum::name).toList();
        List<String> statuses = Arrays.stream(LandRecordStatus.values()).map(Enum::name).toList();

        return new GisFilterOptionsResponse(
                states, districts, tehsils, villages, landUseTypes, ownershipTypes, statuses
        );
    }

    private void validateBoundingBox(double minLon, double minLat, double maxLon, double maxLat) {
        if (minLon < -180.0 || maxLon > 180.0 || minLat < -90.0 || maxLat > 90.0) {
            throw new IllegalArgumentException(
                    "Coordinates out of range: longitude must be between -180 and 180, latitude between -90 and 90.");
        }
        if (minLon > maxLon) {
            throw new IllegalArgumentException("minLon cannot be greater than maxLon.");
        }
        if (minLat > maxLat) {
            throw new IllegalArgumentException("minLat cannot be greater than maxLat.");
        }
        double width = maxLon - minLon;
        double height = maxLat - minLat;
        double area = width * height;
        if (area > MAX_BBOX_AREA_DEGREES) {
            throw new IllegalArgumentException(
                    "Bounding box query area (" + String.format("%.2f", area)
                            + " sq degrees) exceeds maximum threshold (" + MAX_BBOX_AREA_DEGREES
                            + " sq degrees). Please zoom in to view parcels.");
        }
    }

    private int clampLimit(Integer limit) {
        if (limit == null || limit < 1) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }

    private static String trimToNull(String s) {
        if (s == null || s.isBlank()) return null;
        return s.trim();
    }

    private boolean isPublic(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return true;
        return auth.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals(Role.ADMIN.authority())
                        || a.getAuthority().equals(Role.RESEARCHER.authority())
                        || a.getAuthority().equals(Role.ACADEMIA.authority())
                        || a.getAuthority().equals(Role.GOVERNMENT_OFFICIAL.authority()));
    }

    private boolean canViewOwnerPii(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(Role.GOVERNMENT_OFFICIAL.authority())
                        || a.getAuthority().equals(Role.ADMIN.authority()));
    }
}
