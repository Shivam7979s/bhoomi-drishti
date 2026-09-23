package com.bhoomidrishti.gis.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.gis.dto.GeoJsonFeatureCollection;
import com.bhoomidrishti.landrecord.entity.LandRecord;
import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.landrecord.entity.OwnershipType;
import com.bhoomidrishti.landrecord.repository.LandRecordRepository;
import com.bhoomidrishti.research.repository.ResearchDocumentRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@ExtendWith(MockitoExtension.class)
class GisServiceTest {

    @Mock
    private LandRecordRepository landRecordRepository;

    @Mock
    private ResearchDocumentRepository researchDocumentRepository;

    private GisService gisService;

    private final GeometryFactory geometryFactory = new GeometryFactory();

    @BeforeEach
    void setUp() {
        gisService = new GisService(landRecordRepository, researchDocumentRepository);
    }

    private LandRecord createSampleRecord() {
        Coordinate[] coords = new Coordinate[]{
                new Coordinate(77.4126, 23.2599),
                new Coordinate(77.4140, 23.2599),
                new Coordinate(77.4140, 23.2585),
                new Coordinate(77.4126, 23.2585),
                new Coordinate(77.4126, 23.2599)
        };
        Polygon poly = geometryFactory.createPolygon(coords);
        poly.setSRID(4326);

        LandRecord r = new LandRecord();
        r.setId(UUID.randomUUID());
        r.setParcelNumber("MP-BHP-001");
        r.setSurveyNumber("142/1");
        r.setState("Madhya Pradesh");
        r.setDistrict("Bhopal");
        r.setTehsil("Huzur");
        r.setVillage("Berasia");
        r.setLandAreaSqMeters(new BigDecimal("10000.00"));
        r.setLandUseType(LandUseType.AGRICULTURAL);
        r.setOwnershipType(OwnershipType.INDIVIDUAL);
        r.setOwnerName("Ramesh Kumar Sharma");
        r.setOwnerIdentifier("SECRET-AADHAAR-HASH");
        r.setStatus(LandRecordStatus.ACTIVE);
        r.setBoundary(poly);
        return r;
    }

    @Test
    @DisplayName("Public user receives strict nulls for ownerName and ownerIdentifier")
    void testPublicCaller_PrivacyRedaction() {
        LandRecord record = createSampleRecord();
        when(landRecordRepository.findInBoundingBox(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of(record));
        when(landRecordRepository.countInBoundingBox(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(1L);

        GeoJsonFeatureCollection result = gisService.getLandRecordsGeoJson(
                77.30, 23.15, 77.55, 23.35,
                null, null, null, null, null, null, null,
                100, null // unauthenticated public caller
        );

        assertThat(result.features()).hasSize(1);
        var props = result.features().get(0).properties();
        assertThat(props.get("ownerName")).isNull();
        assertThat(props.get("ownerIdentifier")).isNull();
        assertThat(props.get("parcelNumber")).isEqualTo("MP-BHP-001");
        assertThat(props.get("landUseType")).isEqualTo("AGRICULTURAL");
    }

    @Test
    @DisplayName("Researcher/Academia role also receives strict nulls for ownerName and ownerIdentifier")
    void testResearcherCaller_PrivacyRedaction() {
        LandRecord record = createSampleRecord();
        when(landRecordRepository.findInBoundingBox(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of(record));
        when(landRecordRepository.countInBoundingBox(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(1L);

        Authentication auth = new UsernamePasswordAuthenticationToken(
                "researcher", "n/a", List.of(new SimpleGrantedAuthority(Role.RESEARCHER.authority()))
        );

        GeoJsonFeatureCollection result = gisService.getLandRecordsGeoJson(
                77.30, 23.15, 77.55, 23.35,
                null, null, null, null, null, null, null,
                100, auth
        );

        assertThat(result.features()).hasSize(1);
        var props = result.features().get(0).properties();
        assertThat(props.get("ownerName")).isNull();
        assertThat(props.get("ownerIdentifier")).isNull();
    }

    @Test
    @DisplayName("Government Official and Admin roles receive unmasked owner details")
    void testGovernmentOfficial_ReceivesPii() {
        LandRecord record = createSampleRecord();
        when(landRecordRepository.findInBoundingBox(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of(record));
        when(landRecordRepository.countInBoundingBox(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(1L);

        Authentication auth = new UsernamePasswordAuthenticationToken(
                "official", "n/a", List.of(new SimpleGrantedAuthority(Role.GOVERNMENT_OFFICIAL.authority()))
        );

        GeoJsonFeatureCollection result = gisService.getLandRecordsGeoJson(
                77.30, 23.15, 77.55, 23.35,
                null, null, null, null, null, null, null,
                100, auth
        );

        assertThat(result.features()).hasSize(1);
        var props = result.features().get(0).properties();
        assertThat(props.get("ownerName")).isEqualTo("Ramesh Kumar Sharma");
        assertThat(props.get("ownerIdentifier")).isEqualTo("SECRET-AADHAAR-HASH");
    }

    @Test
    @DisplayName("Truncation metadata correctly flags when totalCount exceeds limit")
    void testTruncationMetadata_WhenExceedsLimit() {
        LandRecord record = createSampleRecord();
        when(landRecordRepository.findInBoundingBox(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of(record));
        when(landRecordRepository.countInBoundingBox(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(520L); // 520 total matches

        GeoJsonFeatureCollection result = gisService.getLandRecordsGeoJson(
                77.30, 23.15, 77.55, 23.35,
                null, null, null, null, null, null, null,
                100, null
        );

        assertThat(result.totalCount()).isEqualTo(520);
        assertThat(result.returnedCount()).isEqualTo(1);
        assertThat(result.truncated()).isTrue();
    }

    @Test
    @DisplayName("Oversized bounding box exceeding 4.0 sq degrees throws IllegalArgumentException")
    void testBboxValidation_AreaExceedsMaximum_ThrowsException() {
        assertThatThrownBy(() -> gisService.getLandRecordsGeoJson(
                70.0, 10.0, 75.0, 15.0, // 5 x 5 = 25 sq degrees
                null, null, null, null, null, null, null,
                100, null
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("exceeds maximum threshold");
    }

    @Test
    @DisplayName("Invalid coordinates out of bounds throw IllegalArgumentException")
    void testBboxValidation_CoordinatesOutOfRange_ThrowsException() {
        assertThatThrownBy(() -> gisService.getLandRecordsGeoJson(
                -195.0, 10.0, 75.0, 15.0,
                null, null, null, null, null, null, null,
                100, null
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Coordinates out of range");
    }

    @Test
    @DisplayName("minLon > maxLon throws IllegalArgumentException")
    void testBboxValidation_MinGreaterThanMax_ThrowsException() {
        assertThatThrownBy(() -> gisService.getLandRecordsGeoJson(
                78.0, 23.0, 77.0, 24.0,
                null, null, null, null, null, null, null,
                100, null
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("minLon cannot be greater than maxLon");
    }
}
