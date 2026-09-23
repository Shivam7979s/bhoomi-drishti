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
 * Land record persistence. Combinable attribute filters go through {@link JpaSpecificationExecutor}
 * (built in the service); the two spatial queries are real PostGIS SQL executed by PostgreSQL -
 * never emulated in Java.
 */
public interface LandRecordRepository
        extends JpaRepository<LandRecord, UUID>, JpaSpecificationExecutor<LandRecord> {

    /**
     * Records whose boundary intersects the supplied geometry (WKT, SRID 4326). When {@code status}
     * is not null only records in that status are returned (used to restrict PUBLIC callers to
     * ACTIVE records).
     */
    @Query(
            value =
                    """
                    SELECT * FROM land_records lr
                    WHERE ST_Intersects(lr.boundary, ST_GeomFromText(:wkt, 4326))
                      AND (:status IS NULL OR lr.status = :status)
                    ORDER BY lr.created_at DESC
                    """,
            countQuery =
                    """
                    SELECT count(*) FROM land_records lr
                    WHERE ST_Intersects(lr.boundary, ST_GeomFromText(:wkt, 4326))
                      AND (:status IS NULL OR lr.status = :status)
                    """,
            nativeQuery = true)
    Page<LandRecord> findIntersecting(
            @Param("wkt") String wkt, @Param("status") String status, Pageable pageable);

    /**
     * Records whose boundary fully contains the supplied geometry (WKT, SRID 4326). Same {@code
     * status} semantics as {@link #findIntersecting}.
     */
    @Query(
            value =
                    """
                    SELECT * FROM land_records lr
                    WHERE ST_Contains(lr.boundary, ST_GeomFromText(:wkt, 4326))
                      AND (:status IS NULL OR lr.status = :status)
                    ORDER BY lr.created_at DESC
                    """,
            countQuery =
                    """
                    SELECT count(*) FROM land_records lr
                    WHERE ST_Contains(lr.boundary, ST_GeomFromText(:wkt, 4326))
                      AND (:status IS NULL OR lr.status = :status)
                    """,
            nativeQuery = true)
    Page<LandRecord> findContaining(
            @Param("wkt") String wkt, @Param("status") String status, Pageable pageable);
}
