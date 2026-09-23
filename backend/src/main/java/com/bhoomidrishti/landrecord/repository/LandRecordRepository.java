package com.bhoomidrishti.landrecord.repository;

import com.bhoomidrishti.landrecord.entity.LandRecord;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Land record persistence. Combinable attribute filters go through
 * {@link JpaSpecificationExecutor}
 * (built in the service); the two spatial queries are real PostGIS SQL executed
 * by PostgreSQL -
 * never emulated in Java.
 */
public interface LandRecordRepository
                extends JpaRepository<LandRecord, UUID>, JpaSpecificationExecutor<LandRecord> {

        /**
         * Records whose boundary intersects the supplied geometry (WKT, SRID 4326).
         * When {@code status}
         * is not null only records in that status are returned (used to restrict PUBLIC
         * callers to
         * ACTIVE records).
         */
        @Query(value = """
                        SELECT * FROM land_records lr
                        WHERE ST_Intersects(lr.boundary, ST_GeomFromText(:wkt, 4326))
                          AND (:status IS NULL OR lr.status = :status)
                        ORDER BY lr.created_at DESC
                        """, countQuery = """
                        SELECT count(*) FROM land_records lr
                        WHERE ST_Intersects(lr.boundary, ST_GeomFromText(:wkt, 4326))
                          AND (:status IS NULL OR lr.status = :status)
                        """, nativeQuery = true)
        Page<LandRecord> findIntersecting(
                        @Param("wkt") String wkt, @Param("status") String status, Pageable pageable);

        /**
         * Records whose boundary fully contains the supplied geometry (WKT, SRID 4326).
         * Same {@code
         * status} semantics as {@link #findIntersecting}.
         */
        @Query(value = """
                        SELECT * FROM land_records lr
                        WHERE ST_Contains(lr.boundary, ST_GeomFromText(:wkt, 4326))
                          AND (:status IS NULL OR lr.status = :status)
                        ORDER BY lr.created_at DESC
                        """, countQuery = """
                        SELECT count(*) FROM land_records lr
                        WHERE ST_Contains(lr.boundary, ST_GeomFromText(:wkt, 4326))
                          AND (:status IS NULL OR lr.status = :status)
                        """, nativeQuery = true)
        Page<LandRecord> findContaining(
                        @Param("wkt") String wkt, @Param("status") String status, Pageable pageable);

        @Query(value = """
                        SELECT * FROM land_records lr
                        WHERE (CAST(:minLon AS float8) IS NULL OR (
                              lr.boundary && ST_MakeEnvelope(CAST(:minLon AS float8), CAST(:minLat AS float8), CAST(:maxLon AS float8), CAST(:maxLat AS float8), 4326)
                          AND ST_Intersects(lr.boundary, ST_MakeEnvelope(CAST(:minLon AS float8), CAST(:minLat AS float8), CAST(:maxLon AS float8), CAST(:maxLat AS float8), 4326))))
                          AND (CAST(:state AS varchar) IS NULL OR lr.state = CAST(:state AS varchar))
                          AND (CAST(:district AS varchar) IS NULL OR lr.district = CAST(:district AS varchar))
                          AND (CAST(:tehsil AS varchar) IS NULL OR lr.tehsil = CAST(:tehsil AS varchar))
                          AND (CAST(:village AS varchar) IS NULL OR lr.village = CAST(:village AS varchar))
                          AND (CAST(:landUseType AS varchar) IS NULL OR lr.land_use_type = CAST(:landUseType AS varchar))
                          AND (CAST(:ownershipType AS varchar) IS NULL OR lr.ownership_type = CAST(:ownershipType AS varchar))
                          AND (CAST(:status AS varchar) IS NULL OR lr.status = CAST(:status AS varchar))
                        ORDER BY lr.created_at DESC
                        LIMIT :limit
                        """, nativeQuery = true)
        java.util.List<LandRecord> findInBoundingBox(
                        @Param("minLon") Double minLon,
                        @Param("minLat") Double minLat,
                        @Param("maxLon") Double maxLon,
                        @Param("maxLat") Double maxLat,
                        @Param("state") String state,
                        @Param("district") String district,
                        @Param("tehsil") String tehsil,
                        @Param("village") String village,
                        @Param("landUseType") String landUseType,
                        @Param("ownershipType") String ownershipType,
                        @Param("status") String status,
                        @Param("limit") int limit);

        @Query(value = """
                        SELECT count(*) FROM land_records lr
                        WHERE (CAST(:minLon AS float8) IS NULL OR (
                              lr.boundary && ST_MakeEnvelope(CAST(:minLon AS float8), CAST(:minLat AS float8), CAST(:maxLon AS float8), CAST(:maxLat AS float8), 4326)
                          AND ST_Intersects(lr.boundary, ST_MakeEnvelope(CAST(:minLon AS float8), CAST(:minLat AS float8), CAST(:maxLon AS float8), CAST(:maxLat AS float8), 4326))))
                          AND (CAST(:state AS varchar) IS NULL OR lr.state = CAST(:state AS varchar))
                          AND (CAST(:district AS varchar) IS NULL OR lr.district = CAST(:district AS varchar))
                          AND (CAST(:tehsil AS varchar) IS NULL OR lr.tehsil = CAST(:tehsil AS varchar))
                          AND (CAST(:village AS varchar) IS NULL OR lr.village = CAST(:village AS varchar))
                          AND (CAST(:landUseType AS varchar) IS NULL OR lr.land_use_type = CAST(:landUseType AS varchar))
                          AND (CAST(:ownershipType AS varchar) IS NULL OR lr.ownership_type = CAST(:ownershipType AS varchar))
                          AND (CAST(:status AS varchar) IS NULL OR lr.status = CAST(:status AS varchar))
                        """, nativeQuery = true)
        long countInBoundingBox(
                        @Param("minLon") Double minLon,
                        @Param("minLat") Double minLat,
                        @Param("maxLon") Double maxLon,
                        @Param("maxLat") Double maxLat,
                        @Param("state") String state,
                        @Param("district") String district,
                        @Param("tehsil") String tehsil,
                        @Param("village") String village,
                        @Param("landUseType") String landUseType,
                        @Param("ownershipType") String ownershipType,
                        @Param("status") String status);

        @Query("SELECT DISTINCT lr.state FROM LandRecord lr ORDER BY lr.state")
        java.util.List<String> findDistinctStates();

        @Query("SELECT DISTINCT lr.district FROM LandRecord lr WHERE (:state IS NULL OR lr.state = :state) ORDER BY lr.district")
        java.util.List<String> findDistinctDistricts(@Param("state") String state);

        @Query("SELECT DISTINCT lr.tehsil FROM LandRecord lr WHERE (:district IS NULL OR lr.district = :district) ORDER BY lr.tehsil")
        java.util.List<String> findDistinctTehsils(@Param("district") String district);

        @Query("SELECT DISTINCT lr.village FROM LandRecord lr WHERE (:tehsil IS NULL OR lr.tehsil = :tehsil) ORDER BY lr.village")
        java.util.List<String> findDistinctVillages(@Param("tehsil") String tehsil);
}
