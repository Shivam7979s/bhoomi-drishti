package com.bhoomidrishti.policy.repository;

import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.landrecord.entity.OwnershipType;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/**
 * Deterministic PostGIS query repository for policy simulations.
 *
 * <p>Executes spatial filtering, bounding box calculation, and batch persistence
 * directly in PostgreSQL/PostGIS. Never transfers raw full geometries to Java
 * or loads unnecessary full entities.
 */
@Repository
public class PolicySimulationQueryRepository {

    private final JdbcTemplate jdbcTemplate;

    public PolicySimulationQueryRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Compact candidate parcel representation for simulation evaluation.
     * Contains zero owner PII.
     */
    public record CandidateParcel(
            UUID id,
            String parcelNumber,
            BigDecimal landAreaSqMeters,
            LandUseType landUseType,
            OwnershipType ownershipType,
            LandRecordStatus status
    ) {}

    /**
     * Bounding box metadata for spatial summary.
     */
    public record SpatialBoundingBox(
            Double minLon,
            Double minLat,
            Double maxLon,
            Double maxLat
    ) {}

    /**
     * Snapshot record for affected parcels.
     */
    public record AffectedParcelRecord(
            UUID scenarioResultId,
            UUID landRecordId,
            LandUseType baselineLandUse,
            LandUseType simulatedLandUse,
            BigDecimal parcelAreaSqm,
            LandRecordStatus status
    ) {}

    /**
     * Find candidate parcels deterministically based on administrative filters,
     * spatial geometry, corridor buffer, or project linkage.
     */
    public List<CandidateParcel> findCandidates(
            String targetState,
            String targetDistrict,
            String targetTehsil,
            String targetVillage,
            LandUseType sourceLandUse,
            OwnershipType targetOwnershipType,
            String interventionGeometryWkt,
            BigDecimal bufferDistanceMeters,
            UUID projectId
    ) {
        StringBuilder sql = new StringBuilder("""
            SELECT lr.id, lr.parcel_number, lr.land_area_sq_meters, lr.land_use_type, lr.ownership_type, lr.status
            FROM land_records lr
            WHERE 1=1
        """);

        List<Object> params = new ArrayList<>();

        if (targetState != null && !targetState.isBlank()) {
            sql.append(" AND lr.state = ?");
            params.add(targetState.trim());
        }
        if (targetDistrict != null && !targetDistrict.isBlank()) {
            sql.append(" AND lr.district = ?");
            params.add(targetDistrict.trim());
        }
        if (targetTehsil != null && !targetTehsil.isBlank()) {
            sql.append(" AND lr.tehsil = ?");
            params.add(targetTehsil.trim());
        }
        if (targetVillage != null && !targetVillage.isBlank()) {
            sql.append(" AND lr.village = ?");
            params.add(targetVillage.trim());
        }
        if (sourceLandUse != null) {
            sql.append(" AND lr.land_use_type = ?");
            params.add(sourceLandUse.name());
        }
        if (targetOwnershipType != null) {
            sql.append(" AND lr.ownership_type = ?");
            params.add(targetOwnershipType.name());
        }
        if (projectId != null) {
            sql.append(" AND lr.id IN (SELECT plr.land_record_id FROM project_land_records plr WHERE plr.project_id = ?)");
            params.add(projectId);
        }

        // Spatial criteria
        if (interventionGeometryWkt != null && !interventionGeometryWkt.isBlank()) {
            if (bufferDistanceMeters != null && bufferDistanceMeters.compareTo(BigDecimal.ZERO) >= 0) {
                // Geography-aware meter buffer query using ST_DWithin
                sql.append("""
                     AND ST_DWithin(
                         lr.boundary::geography,
                         ST_SetSRID(ST_GeomFromText(?, 4326), 4326)::geography,
                         ?
                     )
                """);
                params.add(interventionGeometryWkt);
                params.add(bufferDistanceMeters.doubleValue());
            } else {
                // Precise spatial intersection query
                sql.append(" AND ST_Intersects(lr.boundary, ST_SetSRID(ST_GeomFromText(?, 4326), 4326))");
                params.add(interventionGeometryWkt);
            }
        }

        // Strict deterministic ordering
        sql.append(" ORDER BY lr.parcel_number ASC, lr.id ASC");

        return jdbcTemplate.query(sql.toString(), new CandidateParcelRowMapper(), params.toArray());
    }

    /**
     * Computes the bounding box of a list of parcel IDs in PostGIS.
     */
    public SpatialBoundingBox computeBoundingBox(List<UUID> parcelIds) {
        if (parcelIds == null || parcelIds.isEmpty()) {
            return null;
        }

        StringBuilder sql = new StringBuilder("""
            SELECT ST_XMin(ST_Extent(boundary)) AS min_lon,
                   ST_YMin(ST_Extent(boundary)) AS min_lat,
                   ST_XMax(ST_Extent(boundary)) AS max_lon,
                   ST_YMax(ST_Extent(boundary)) AS max_lat
            FROM land_records
            WHERE id IN (
        """);

        for (int i = 0; i < parcelIds.size(); i++) {
            sql.append(i == 0 ? "?" : ", ?");
        }
        sql.append(")");

        return jdbcTemplate.query(sql.toString(), rs -> {
            if (rs.next()) {
                double minLon = rs.getDouble("min_lon");
                if (rs.wasNull()) return null;
                double minLat = rs.getDouble("min_lat");
                double maxLon = rs.getDouble("max_lon");
                double maxLat = rs.getDouble("max_lat");
                return new SpatialBoundingBox(minLon, minLat, maxLon, maxLat);
            }
            return null;
        }, parcelIds.toArray());
    }

    /**
     * Batch persists affected parcel snapshot records into scenario_affected_parcels.
     */
    public void batchInsertAffectedParcels(List<AffectedParcelRecord> records) {
        if (records == null || records.isEmpty()) {
            return;
        }

        String sql = """
            INSERT INTO scenario_affected_parcels
            (scenario_result_id, land_record_id, baseline_land_use, simulated_land_use, parcel_area_sqm, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """;

        jdbcTemplate.batchUpdate(sql, records, records.size(), (ps, r) -> {
            ps.setObject(1, r.scenarioResultId());
            ps.setObject(2, r.landRecordId());
            ps.setString(3, r.baselineLandUse().name());
            ps.setString(4, r.simulatedLandUse().name());
            ps.setBigDecimal(5, r.parcelAreaSqm());
            ps.setString(6, r.status().name());
        });
    }

    private static class CandidateParcelRowMapper implements RowMapper<CandidateParcel> {
        @Override
        public CandidateParcel mapRow(ResultSet rs, int rowNum) throws SQLException {
            UUID id = (UUID) rs.getObject("id");
            String parcelNumber = rs.getString("parcel_number");
            BigDecimal area = rs.getBigDecimal("land_area_sq_meters");
            LandUseType landUse = LandUseType.valueOf(rs.getString("land_use_type"));
            OwnershipType ownership = OwnershipType.valueOf(rs.getString("ownership_type"));
            LandRecordStatus status = LandRecordStatus.valueOf(rs.getString("status"));
            return new CandidateParcel(id, parcelNumber, area, landUse, ownership, status);
        }
    }
}
