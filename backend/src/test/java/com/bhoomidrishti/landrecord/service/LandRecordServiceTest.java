package com.bhoomidrishti.landrecord.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.exception.InvalidGeometryException;
import com.bhoomidrishti.exception.LandRecordNotFoundException;
import com.bhoomidrishti.landrecord.dto.CreateLandRecordRequest;
import com.bhoomidrishti.landrecord.dto.LandRecordResponse;
import com.bhoomidrishti.landrecord.dto.UpdateLandRecordRequest;
import com.bhoomidrishti.landrecord.entity.LandRecord;
import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.landrecord.entity.OwnershipType;
import com.bhoomidrishti.landrecord.repository.LandRecordRepository;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;

@ExtendWith(MockitoExtension.class)
class LandRecordServiceTest {

    @Mock
    private LandRecordRepository repository;

    private LandRecordService service;
    private final GeometryFactory geomFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @BeforeEach
    void setUp() {
        service = new LandRecordService(repository);
    }

    @Test
    void createRejectsNonPolygonGeometry() {
        Coordinate[] lineCoords = new Coordinate[] {
                new Coordinate(77.0, 23.0),
                new Coordinate(78.0, 24.0)
        };
        LineString line = geomFactory.createLineString(lineCoords);

        CreateLandRecordRequest req = new CreateLandRecordRequest(
                "P1", "S1", "MP", "Bhopal", "Huzur", "Kolar",
                new BigDecimal("1000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL,
                "Test Owner", null, LandRecordStatus.ACTIVE, line);

        Authentication auth = tokenFor(Role.GOVERNMENT_OFFICIAL);

        assertThatThrownBy(() -> service.create(req, auth))
                .isInstanceOf(InvalidGeometryException.class)
                .hasMessageContaining("boundary must be a Polygon or MultiPolygon");
    }

    @Test
    void createRejectsWrongSrid() {
        GeometryFactory srid3857Factory = new GeometryFactory(new PrecisionModel(), 3857);
        Coordinate[] coords = new Coordinate[] {
                new Coordinate(77.0, 23.0),
                new Coordinate(78.0, 23.0),
                new Coordinate(78.0, 24.0),
                new Coordinate(77.0, 24.0),
                new Coordinate(77.0, 23.0)
        };
        Polygon poly = srid3857Factory.createPolygon(coords);

        CreateLandRecordRequest req = new CreateLandRecordRequest(
                "P1", "S1", "MP", "Bhopal", "Huzur", "Kolar",
                new BigDecimal("1000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL,
                "Test Owner", null, LandRecordStatus.ACTIVE, poly);

        Authentication auth = tokenFor(Role.GOVERNMENT_OFFICIAL);

        assertThatThrownBy(() -> service.create(req, auth))
                .isInstanceOf(InvalidGeometryException.class)
                .hasMessageContaining("boundary must use SRID 4326");
    }

    @Test
    void createRejectsSelfIntersectingPolygon() {
        Coordinate[] bowTie = new Coordinate[] {
                new Coordinate(0, 0),
                new Coordinate(2, 2),
                new Coordinate(0, 2),
                new Coordinate(2, 0),
                new Coordinate(0, 0)
        };
        Polygon poly = geomFactory.createPolygon(bowTie);

        CreateLandRecordRequest req = new CreateLandRecordRequest(
                "P1", "S1", "MP", "Bhopal", "Huzur", "Kolar",
                new BigDecimal("1000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL,
                "Test Owner", null, LandRecordStatus.ACTIVE, poly);

        Authentication auth = tokenFor(Role.ADMIN);

        assertThatThrownBy(() -> service.create(req, auth))
                .isInstanceOf(InvalidGeometryException.class)
                .hasMessageContaining("boundary geometry is not valid");
    }

    @Test
    void createRejectsUnauthorizedRole() {
        Polygon poly = samplePolygon();
        CreateLandRecordRequest req = new CreateLandRecordRequest(
                "P1", "S1", "MP", "Bhopal", "Huzur", "Kolar",
                new BigDecimal("1000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL,
                "Test Owner", null, LandRecordStatus.ACTIVE, poly);

        Authentication auth = tokenFor(Role.PUBLIC);

        assertThatThrownBy(() -> service.create(req, auth))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void createSucceedsForGovernmentOfficial() {
        Polygon poly = samplePolygon();
        CreateLandRecordRequest req = new CreateLandRecordRequest(
                "P1", "S1", "MP", "Bhopal", "Huzur", "Kolar",
                new BigDecimal("1000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL,
                "Test Owner", null, LandRecordStatus.ACTIVE, poly);

        when(repository.save(any(LandRecord.class))).thenAnswer(inv -> inv.getArgument(0));

        LandRecordResponse response = service.create(req, tokenFor(Role.GOVERNMENT_OFFICIAL));

        assertThat(response).isNotNull();
        assertThat(response.parcelNumber()).isEqualTo("P1");
        assertThat(response.ownerName()).isEqualTo("Test Owner");
        verify(repository).save(any(LandRecord.class));
    }

    @Test
    void getByIdHidesInactiveRecordFromPublic() {
        UUID id = UUID.randomUUID();
        LandRecord record = new LandRecord();
        record.setId(id);
        record.setStatus(LandRecordStatus.DISPUTED);
        record.setBoundary(samplePolygon());

        when(repository.findById(id)).thenReturn(Optional.of(record));

        assertThatThrownBy(() -> service.getById(id, tokenFor(Role.PUBLIC)))
                .isInstanceOf(LandRecordNotFoundException.class);
    }

    @Test
    void getByIdAllowsResearcherToViewDisputedRecord() {
        UUID id = UUID.randomUUID();
        LandRecord record = new LandRecord();
        record.setId(id);
        record.setParcelNumber("P-DISP");
        record.setStatus(LandRecordStatus.DISPUTED);
        record.setState("MP");
        record.setDistrict("Bhopal");
        record.setTehsil("Huzur");
        record.setVillage("Kolar");
        record.setLandAreaSqMeters(new BigDecimal("500"));
        record.setLandUseType(LandUseType.COMMERCIAL);
        record.setOwnershipType(OwnershipType.JOINT);
        record.setOwnerName("Disputed Owner");
        record.setBoundary(samplePolygon());

        when(repository.findById(id)).thenReturn(Optional.of(record));

        LandRecordResponse response = service.getById(id, tokenFor(Role.RESEARCHER));
        assertThat(response.status()).isEqualTo(LandRecordStatus.DISPUTED);
    }

    @Test
    void deleteOnlyAllowedForAdmin() {
        UUID id = UUID.randomUUID();
        assertThatThrownBy(() -> service.delete(id, tokenFor(Role.GOVERNMENT_OFFICIAL)))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only ADMIN can delete records");
    }

    private Polygon samplePolygon() {
        Coordinate[] coords = new Coordinate[] {
                new Coordinate(77.0, 23.0),
                new Coordinate(77.1, 23.0),
                new Coordinate(77.1, 23.1),
                new Coordinate(77.0, 23.1),
                new Coordinate(77.0, 23.0)
        };
        LinearRing ring = geomFactory.createLinearRing(coords);
        return geomFactory.createPolygon(ring);
    }

    private Authentication tokenFor(Role role) {
        return new TestingAuthenticationToken("user", "pass", role.authority());
    }
}
