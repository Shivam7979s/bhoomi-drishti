package com.bhoomidrishti.landrecord.service;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.common.PageResponse;
import com.bhoomidrishti.landrecord.dto.CreateLandRecordRequest;
import com.bhoomidrishti.landrecord.dto.LandRecordResponse;
import com.bhoomidrishti.landrecord.dto.UpdateLandRecordRequest;
import com.bhoomidrishti.landrecord.entity.LandRecord;
import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.repository.LandRecordRepository;
import com.bhoomidrishti.exception.InvalidGeometryException;
import com.bhoomidrishti.exception.LandRecordNotFoundException;
import jakarta.annotation.Nullable;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.MultiPolygon;
import org.locationtech.jts.geom.Polygon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class LandRecordService {

    static final int DEFAULT_PAGE_SIZE = 20;
    static final int MAX_PAGE_SIZE = 100;
    private final LandRecordRepository repository;

    public LandRecordService(LandRecordRepository repository) {
        this.repository = repository;
    }

    public LandRecordResponse getById(UUID id, Authentication auth) {
        LandRecord record = repository.findById(id)
                .orElseThrow(() -> new LandRecordNotFoundException(id));
        if (!canRead(record, auth)) {
            throw new LandRecordNotFoundException(id);
        }
        return LandRecordResponse.from(record);
    }

    public PageResponse<LandRecordResponse> list(
            @Nullable String state, @Nullable String district, @Nullable String tehsil,
            @Nullable String village, @Nullable String parcelNumber,
            @Nullable String landUseType, @Nullable String status,
            int page, int size, Authentication auth) {

        Pageable pageable = PageRequest.of(page, clampSize(size), Sort.by("createdAt").descending());
        Specification<LandRecord> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();
            if (state != null && !state.isBlank()) {
                predicates.add(cb.equal(root.get("state"), state));
            }
            if (district != null && !district.isBlank()) {
                predicates.add(cb.equal(root.get("district"), district));
            }
            if (tehsil != null && !tehsil.isBlank()) {
                predicates.add(cb.equal(root.get("tehsil"), tehsil));
            }
            if (village != null && !village.isBlank()) {
                predicates.add(cb.equal(root.get("village"), village));
            }
            if (parcelNumber != null && !parcelNumber.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("parcelNumber")), "%" + parcelNumber.toLowerCase() + "%"));
            }
            if (landUseType != null && !landUseType.isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("landUseType"),
                            com.bhoomidrishti.landrecord.entity.LandUseType.valueOf(landUseType.toUpperCase())));
                } catch (IllegalArgumentException ignored) {
                }
            }
            if (status != null && !status.isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("status"), LandRecordStatus.valueOf(status.toUpperCase())));
                } catch (IllegalArgumentException ignored) {
                }
            }
            if (isPublic(auth)) {
                predicates.add(cb.equal(root.get("status"), LandRecordStatus.ACTIVE));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        Page<LandRecord> result = repository.findAll(spec, pageable);
        List<LandRecordResponse> items = result.getContent().stream()
                .map(LandRecordResponse::from)
                .collect(Collectors.toList());
        return new PageResponse<>(items, result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), result.isFirst(), result.isLast());
    }

    @Transactional
    public LandRecordResponse create(CreateLandRecordRequest req, Authentication auth) {
        assertCanWrite(auth);
        Geometry boundary = validateBoundary(req.boundary());
        LandRecord record = new LandRecord();
        record.setId(UUID.randomUUID());
        record.setParcelNumber(req.parcelNumber());
        record.setSurveyNumber(req.surveyNumber());
        record.setState(req.state());
        record.setDistrict(req.district());
        record.setTehsil(req.tehsil());
        record.setVillage(req.village());
        record.setLandAreaSqMeters(req.landAreaSqMeters());
        record.setLandUseType(req.landUseType());
        record.setOwnershipType(req.ownershipType());
        record.setOwnerName(req.ownerName());
        record.setOwnerIdentifier(req.ownerIdentifier());
        record.setStatus(req.status());
        record.setBoundary(boundary);
        return LandRecordResponse.from(repository.save(record));
    }

    @Transactional
    public LandRecordResponse update(UUID id, UpdateLandRecordRequest req, Authentication auth) {
        assertCanWrite(auth);
        LandRecord record = repository.findById(id)
                .orElseThrow(() -> new LandRecordNotFoundException(id));
        if (!canRead(record, auth)) {
            throw new LandRecordNotFoundException(id);
        }
        Geometry boundary = validateBoundary(req.boundary());
        record.setParcelNumber(req.parcelNumber());
        record.setSurveyNumber(req.surveyNumber());
        record.setState(req.state());
        record.setDistrict(req.district());
        record.setTehsil(req.tehsil());
        record.setVillage(req.village());
        record.setLandAreaSqMeters(req.landAreaSqMeters());
        record.setLandUseType(req.landUseType());
        record.setOwnershipType(req.ownershipType());
        record.setOwnerName(req.ownerName());
        record.setOwnerIdentifier(req.ownerIdentifier());
        record.setStatus(req.status());
        record.setBoundary(boundary);
        return LandRecordResponse.from(repository.save(record));
    }

    @Transactional
    public void delete(UUID id, Authentication auth) {
        assertCanDelete(auth);
        LandRecord record = repository.findById(id)
                .orElseThrow(() -> new LandRecordNotFoundException(id));
        if (!canRead(record, auth)) {
            throw new LandRecordNotFoundException(id);
        }
        repository.deleteById(id);
    }

    public PageResponse<LandRecordResponse> findIntersecting(
            Geometry queryGeom, LandRecordStatus status, int page, int size, Authentication auth) {
        Geometry valid = validateBoundary(queryGeom);
        Pageable pageable = PageRequest.of(page, clampSize(size));
        String effectiveStatus = isPublic(auth) ? LandRecordStatus.ACTIVE.name() : (status == null ? null : status.name());
        Page<LandRecord> result = repository.findIntersecting(
                valid.toText(), effectiveStatus, pageable);
        List<LandRecordResponse> items = result.getContent().stream()
                .filter(r -> canRead(r, auth))
                .map(LandRecordResponse::from)
                .collect(Collectors.toList());
        return toPage(items, result);
    }

    public PageResponse<LandRecordResponse> findContaining(
            Geometry queryGeom, LandRecordStatus status, int page, int size, Authentication auth) {
        Geometry valid = validateBoundary(queryGeom);
        Pageable pageable = PageRequest.of(page, clampSize(size));
        String effectiveStatus = isPublic(auth) ? LandRecordStatus.ACTIVE.name() : (status == null ? null : status.name());
        Page<LandRecord> result = repository.findContaining(
                valid.toText(), effectiveStatus, pageable);
        List<LandRecordResponse> items = result.getContent().stream()
                .filter(r -> canRead(r, auth))
                .map(LandRecordResponse::from)
                .collect(Collectors.toList());
        return toPage(items, result);
    }

    private static Geometry validateBoundary(Geometry geom) {
        if (geom == null || geom.isEmpty()) {
            throw new InvalidGeometryException("boundary must not be null or empty");
        }
        if (!(geom instanceof Polygon) && !(geom instanceof MultiPolygon)) {
            throw new InvalidGeometryException("boundary must be a Polygon or MultiPolygon, got: " + geom.getGeometryType());
        }
        if (!geom.isValid()) {
            throw new InvalidGeometryException("boundary geometry is not valid (self-intersections detected)");
        }
        if (geom.getSRID() != 4326) {
            throw new InvalidGeometryException("boundary must use SRID 4326 (WGS84), got: " + geom.getSRID());
        }
        return geom;
    }

    private static int clampSize(int size) {
        if (size < 1) return DEFAULT_PAGE_SIZE;
        return Math.min(size, MAX_PAGE_SIZE);
    }

    private static PageResponse<LandRecordResponse> toPage(List<LandRecordResponse> items, Page<LandRecord> result) {
        return new PageResponse<>(items, result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), result.isFirst(), result.isLast());
    }

    private boolean isPublic(Authentication auth) {
        if (auth == null || auth.getAuthorities() == null) return true;
        return auth.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals(Role.ADMIN.authority())
                        || a.getAuthority().equals(Role.RESEARCHER.authority())
                        || a.getAuthority().equals(Role.ACADEMIA.authority())
                        || a.getAuthority().equals(Role.GOVERNMENT_OFFICIAL.authority()));
    }

    private boolean canRead(LandRecord record, Authentication auth) {
        if (isPublic(auth)) {
            return record.getStatus() == LandRecordStatus.ACTIVE;
        }
        return true;
    }

    private void assertCanWrite(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        boolean ok = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(Role.GOVERNMENT_OFFICIAL.authority())
                        || a.getAuthority().equals(Role.ADMIN.authority()));
        if (!ok) throw new AccessDeniedException("Insufficient permissions");
    }

    private void assertCanDelete(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        boolean ok = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(Role.ADMIN.authority()));
        if (!ok) throw new AccessDeniedException("Only ADMIN can delete records");
    }
}
