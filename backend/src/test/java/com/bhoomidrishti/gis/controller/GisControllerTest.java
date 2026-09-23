package com.bhoomidrishti.gis.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bhoomidrishti.auth.security.JwtAuthenticationFilter;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.auth.security.JwtAuthenticationFilter;
import com.bhoomidrishti.auth.security.JwtService;
import com.bhoomidrishti.gis.dto.GeoJsonFeature;
import com.bhoomidrishti.gis.dto.GeoJsonFeatureCollection;
import com.bhoomidrishti.gis.dto.GisFilterOptionsResponse;
import com.bhoomidrishti.gis.dto.ParcelSummaryResponse;
import com.bhoomidrishti.gis.service.GisService;
import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.landrecord.entity.OwnershipType;
import com.bhoomidrishti.testconfig.SecurityTestConfiguration;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Polygon;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(GisController.class)
@Import(SecurityTestConfiguration.class)
class GisControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GisService gisService;

    @MockitoBean
    private UserRepository userRepository;

    private final GeometryFactory geometryFactory = new GeometryFactory();

    private Polygon samplePolygon() {
        Coordinate[] coords = new Coordinate[]{
                new Coordinate(77.4126, 23.2599),
                new Coordinate(77.4140, 23.2599),
                new Coordinate(77.4140, 23.2585),
                new Coordinate(77.4126, 23.2585),
                new Coordinate(77.4126, 23.2599)
        };
        LinearRing ring = geometryFactory.createLinearRing(coords);
        Polygon poly = geometryFactory.createPolygon(ring);
        poly.setSRID(4326);
        return poly;
    }

    @Test
    @DisplayName("GET /api/gis/land-records with bbox returns GeoJSON FeatureCollection")
    void testGetLandRecordsGeoJson_Success() throws Exception {
        UUID parcelId = UUID.randomUUID();
        Map<String, Object> props = Map.of(
                "parcelNumber", "MP-BHP-001",
                "state", "Madhya Pradesh",
                "district", "Bhopal",
                "landUseType", "AGRICULTURAL",
                "ownershipType", "INDIVIDUAL",
                "status", "ACTIVE",
                "linkedDocumentsCount", 3
        );
        GeoJsonFeature feature = GeoJsonFeature.of(parcelId, samplePolygon(), props);
        GeoJsonFeatureCollection collection = GeoJsonFeatureCollection.of(
                List.of(feature), 1, true, Map.of("limit", 100)
        );

        when(gisService.getLandRecordsGeoJson(
                eq(77.30), eq(23.15), eq(77.55), eq(23.35),
                any(), any(), any(), any(), any(), any(), any(), eq(100), any()))
                .thenReturn(collection);

        mockMvc.perform(get("/api/gis/land-records")
                        .param("bbox", "77.30,23.15,77.55,23.35"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("FeatureCollection"))
                .andExpect(jsonPath("$.features[0].type").value("Feature"))
                .andExpect(jsonPath("$.features[0].id").value(parcelId.toString()))
                .andExpect(jsonPath("$.features[0].properties.parcelNumber").value("MP-BHP-001"))
                .andExpect(jsonPath("$.features[0].properties.landUseType").value("AGRICULTURAL"))
                .andExpect(jsonPath("$.features[0].properties.linkedDocumentsCount").value(3))
                .andExpect(jsonPath("$.totalCount").value(1))
                .andExpect(jsonPath("$.returnedCount").value(1))
                .andExpect(jsonPath("$.truncated").value(false));
    }

    @Test
    @DisplayName("GET /api/gis/land-records with invalid bbox format returns 400")
    void testBbox_Malformed_Returns400() throws Exception {
        mockMvc.perform(get("/api/gis/land-records")
                        .param("bbox", "77.30,23.15,not-a-number"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("GET /api/gis/land-records with non-numeric coordinates returns 400")
    void testBbox_NonNumeric_Returns400() throws Exception {
        mockMvc.perform(get("/api/gis/land-records")
                        .param("bbox", "foo,bar,baz,qux"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("GET /api/gis/land-records/{id}/summary returns parcel summary and bounds")
    void testGetParcelSummary_Success() throws Exception {
        UUID id = UUID.randomUUID();
        ParcelSummaryResponse summary = new ParcelSummaryResponse(
                id,
                "MP-BHP-001",
                "142/1",
                "Madhya Pradesh",
                "Bhopal",
                "Huzur",
                "Berasia",
                new BigDecimal("14250.00"),
                LandUseType.AGRICULTURAL,
                OwnershipType.INDIVIDUAL,
                LandRecordStatus.ACTIVE,
                null,
                null,
                new double[]{77.4126, 23.2585, 77.4140, 23.2599},
                2
        );

        when(gisService.getParcelSummary(eq(id), any())).thenReturn(summary);

        mockMvc.perform(get("/api/gis/land-records/" + id + "/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.parcelNumber").value("MP-BHP-001"))
                .andExpect(jsonPath("$.district").value("Bhopal"))
                .andExpect(jsonPath("$.landUseType").value("AGRICULTURAL"))
                .andExpect(jsonPath("$.bbox[0]").value(77.4126))
                .andExpect(jsonPath("$.linkedResearchDocumentsCount").value(2));
    }

    @Test
    @DisplayName("GET /api/gis/filters returns distinct available location and attribute filters")
    void testGetFilters_Success() throws Exception {
        GisFilterOptionsResponse options = new GisFilterOptionsResponse(
                List.of("Madhya Pradesh"),
                List.of("Bhopal", "Indore"),
                List.of("Huzur"),
                List.of("Berasia"),
                List.of("AGRICULTURAL", "RESIDENTIAL"),
                List.of("INDIVIDUAL", "GOVERNMENT"),
                List.of("ACTIVE", "DISPUTED")
        );

        when(gisService.getFilterOptions()).thenReturn(options);

        mockMvc.perform(get("/api/gis/filters"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.states[0]").value("Madhya Pradesh"))
                .andExpect(jsonPath("$.districts[0]").value("Bhopal"))
                .andExpect(jsonPath("$.landUseTypes[0]").value("AGRICULTURAL"));
    }
}
