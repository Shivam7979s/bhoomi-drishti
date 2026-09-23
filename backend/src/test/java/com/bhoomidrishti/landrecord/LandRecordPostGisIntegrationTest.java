package com.bhoomidrishti.landrecord;

import static org.assertj.core.api.Assertions.assertThat;

import com.bhoomidrishti.landrecord.entity.LandRecord;
import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.landrecord.entity.OwnershipType;
import com.bhoomidrishti.landrecord.repository.LandRecordRepository;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

/**
 * Real PostGIS integration test.
 *
 * <p>Executes against the running PostgreSQL + PostGIS container (port 5433)
 * verifying Flyway migration V2, PostGIS version, spatial GiST indexing,
 * and real SQL ST_Intersects / ST_Contains operations.
 */
@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:5433/bhoomi_drishti",
        "spring.datasource.username=bhoomi",
        "spring.datasource.password=change_me",
        "spring.flyway.enabled=true"
})
@Transactional
class LandRecordPostGisIntegrationTest {

    @Autowired
    private LandRecordRepository repository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final GeometryFactory geomFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void postGisExtensionAndVersionAreAvailable() {
        String postgisVersion = jdbcTemplate.queryForObject("SELECT PostGIS_Version();", String.class);
        assertThat(postgisVersion).isNotNull().startsWith("3.");
    }

    @Test
    void flywayMigrationAppliedV2AndCreatedSpatialIndex() {
        // Confirm V2 migration is recorded in flyway_schema_history
        Integer countV2 = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM flyway_schema_history WHERE version = '2' AND success = true",
                Integer.class);
        assertThat(countV2).isEqualTo(1);

        // Confirm land_records table exists
        Integer tableCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM information_schema.tables WHERE table_name = 'land_records'",
                Integer.class);
        assertThat(tableCount).isEqualTo(1);

        // Confirm GiST spatial index exists on boundary column
        Integer gistIndexCount = jdbcTemplate.queryForObject(
                """
                SELECT count(*)
                FROM pg_indexes
                WHERE tablename = 'land_records'
                  AND indexdef ILIKE '%USING gist (boundary)%'
                """,
                Integer.class);
        assertThat(gistIndexCount).isGreaterThanOrEqualTo(1);
    }

    @Test
    void persistsLandRecordWithJtsGeometry() {
        LandRecord record = createSampleRecord("MP-TEST-001", 77.4100, 23.2500, 77.4200, 23.2600);
        LandRecord saved = repository.saveAndFlush(record);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getParcelNumber()).isEqualTo("MP-TEST-001");
        assertThat(saved.getBoundary()).isNotNull();
        assertThat(saved.getBoundary().getSRID()).isEqualTo(4326);
        assertThat(saved.getBoundary().getGeometryType()).isEqualTo("Polygon");
    }

    @Test
    void spatialIntersectsReturnsOverlappingParcelsAndExcludesDisjointParcels() {
        // Parcel A in Bhopal (around lon 77.41, lat 23.25)
        LandRecord parcelA = createSampleRecord("BHOPAL-01", 77.4100, 23.2500, 77.4200, 23.2600);
        // Parcel B in Indore (around lon 75.85, lat 22.71)
        LandRecord parcelB = createSampleRecord("INDORE-01", 75.8500, 22.7100, 75.8600, 22.7200);

        repository.saveAndFlush(parcelA);
        repository.saveAndFlush(parcelB);

        // Query polygon that overlaps with Bhopal Parcel A only
        Polygon queryGeom = createPolygon(77.4000, 23.2400, 77.4300, 23.2700);

        Page<LandRecord> results = repository.findIntersecting(
                queryGeom.toText(), null, PageRequest.of(0, 10));

        assertThat(results.getContent()).hasSize(1);
        assertThat(results.getContent().get(0).getParcelNumber()).isEqualTo("BHOPAL-01");
    }

    @Test
    void spatialContainsReturnsParcelsContainingQueryGeometry() {
        // Large Parcel encompassing the whole district sector
        LandRecord largeParcel = createSampleRecord("LARGE-PARCEL", 77.4000, 23.2000, 77.5000, 23.3000);
        // Outside Parcel
        LandRecord smallOutside = createSampleRecord("OUTSIDE-PARCEL", 77.6000, 23.2000, 77.7000, 23.3000);

        repository.saveAndFlush(largeParcel);
        repository.saveAndFlush(smallOutside);

        // Inner polygon strictly inside LARGE-PARCEL
        Polygon innerGeom = createPolygon(77.4200, 23.2200, 77.4400, 23.2400);

        Page<LandRecord> results = repository.findContaining(
                innerGeom.toText(), null, PageRequest.of(0, 10));

        assertThat(results.getContent()).hasSize(1);
        assertThat(results.getContent().get(0).getParcelNumber()).isEqualTo("LARGE-PARCEL");
    }

    private LandRecord createSampleRecord(String parcelNumber, double minX, double minY, double maxX, double maxY) {
        LandRecord record = new LandRecord();
        record.setId(UUID.randomUUID());
        record.setParcelNumber(parcelNumber);
        record.setSurveyNumber("SN-" + parcelNumber);
        record.setState("Madhya Pradesh");
        record.setDistrict("Bhopal");
        record.setTehsil("Huzur");
        record.setVillage("Kolar");
        record.setLandAreaSqMeters(new BigDecimal("5000.00"));
        record.setLandUseType(LandUseType.AGRICULTURAL);
        record.setOwnershipType(OwnershipType.INDIVIDUAL);
        record.setOwnerName("Integration Test Owner");
        record.setOwnerIdentifier("INT-TEST-001");
        record.setStatus(LandRecordStatus.ACTIVE);
        record.setBoundary(createPolygon(minX, minY, maxX, maxY));
        return record;
    }

    private Polygon createPolygon(double minX, double minY, double maxX, double maxY) {
        Coordinate[] coords = new Coordinate[] {
                new Coordinate(minX, minY),
                new Coordinate(maxX, minY),
                new Coordinate(maxX, maxY),
                new Coordinate(minX, maxY),
                new Coordinate(minX, minY)
        };
        LinearRing ring = geomFactory.createLinearRing(coords);
        Polygon poly = geomFactory.createPolygon(ring);
        poly.setSRID(4326);
        return poly;
    }
}
