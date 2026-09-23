package com.bhoomidrishti.landrecord.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.auth.security.JwtService;
import com.bhoomidrishti.common.PageResponse;
import com.bhoomidrishti.exception.LandRecordNotFoundException;
import com.bhoomidrishti.landrecord.dto.LandRecordResponse;
import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.landrecord.entity.OwnershipType;
import com.bhoomidrishti.landrecord.service.LandRecordService;
import com.bhoomidrishti.testconfig.SecurityTestConfiguration;
import jakarta.servlet.http.Cookie;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Controller-slice tests for LandRecord endpoints validating HTTP semantics,
 * bean validation, RBAC security, and pagination envelopes.
 */
@WebMvcTest(LandRecordController.class)
@Import(SecurityTestConfiguration.class)
class LandRecordControllerTest {

    private static final String SESSION_COOKIE = "bhoomi_auth";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private LandRecordService landRecordService;

    private static final String VALID_PARCEL_GEOJSON = """
            {
              "parcelNumber": "MP-BHO-2026-001",
              "surveyNumber": "SN-45/1",
              "state": "Madhya Pradesh",
              "district": "Bhopal",
              "tehsil": "Huzur",
              "village": "Kolar",
              "landAreaSqMeters": 4500.50,
              "landUseType": "AGRICULTURAL",
              "ownershipType": "INDIVIDUAL",
              "ownerName": "Ramesh Kumar Sharma",
              "ownerIdentifier": "OWN-IND-2026-45",
              "status": "ACTIVE",
              "boundary": {
                "type": "Polygon",
                "coordinates": [
                  [
                    [77.4100, 23.2500],
                    [77.4200, 23.2500],
                    [77.4200, 23.2600],
                    [77.4100, 23.2600],
                    [77.4100, 23.2500]
                  ]
                ]
              }
            }
            """;

    @Test
    void unauthenticatedCreateReturns401() throws Exception {
        mockMvc.perform(post("/api/land-records")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PARCEL_GEOJSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void publicUserCreateReturns403() throws Exception {
        mockMvc.perform(post("/api/land-records")
                        .cookie(sessionCookieFor(Role.PUBLIC))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PARCEL_GEOJSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void researcherCreateReturns403() throws Exception {
        mockMvc.perform(post("/api/land-records")
                        .cookie(sessionCookieFor(Role.RESEARCHER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PARCEL_GEOJSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void governmentOfficialCreateSucceeds() throws Exception {
        UUID id = UUID.randomUUID();
        when(landRecordService.create(any(), any())).thenReturn(sampleResponse(id));

        mockMvc.perform(post("/api/land-records")
                        .cookie(sessionCookieFor(Role.GOVERNMENT_OFFICIAL))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PARCEL_GEOJSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.parcelNumber").value("MP-BHO-2026-001"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void adminCreateSucceeds() throws Exception {
        UUID id = UUID.randomUUID();
        when(landRecordService.create(any(), any())).thenReturn(sampleResponse(id));

        mockMvc.perform(post("/api/land-records")
                        .cookie(sessionCookieFor(Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PARCEL_GEOJSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    void validationFailsOnNegativeArea() throws Exception {
        String invalidPayload = VALID_PARCEL_GEOJSON.replace("4500.50", "-100.00");

        mockMvc.perform(post("/api/land-records")
                        .cookie(sessionCookieFor(Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors.landAreaSqMeters").exists());
    }

    @Test
    void validationFailsOnMalformedGeometry() throws Exception {
        String malformedGeoJson = VALID_PARCEL_GEOJSON.replace(
                "\"coordinates\": [", "\"coordinates\": \"not-coordinates\", \"bad\": [");

        mockMvc.perform(post("/api/land-records")
                        .cookie(sessionCookieFor(Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(malformedGeoJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void listRecordsReturnsPageResponse() throws Exception {
        UUID id = UUID.randomUUID();
        PageResponse<LandRecordResponse> page = new PageResponse<>(
                List.of(sampleResponse(id)), 0, 20, 1, 1, true, true);
        when(landRecordService.list(any(), any(), any(), any(), any(), any(), any(), eq(0), eq(20), any()))
                .thenReturn(page);

        mockMvc.perform(get("/api/land-records")
                        .cookie(sessionCookieFor(Role.PUBLIC))
                        .param("state", "Madhya Pradesh")
                        .param("district", "Bhopal")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].parcelNumber").value("MP-BHO-2026-001"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1));
    }

    @Test
    void getByIdReturnsRecord() throws Exception {
        UUID id = UUID.randomUUID();
        when(landRecordService.getById(eq(id), any())).thenReturn(sampleResponse(id));

        mockMvc.perform(get("/api/land-records/" + id)
                        .cookie(sessionCookieFor(Role.RESEARCHER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.parcelNumber").value("MP-BHO-2026-001"));
    }

    @Test
    void getByIdNotFoundReturns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(landRecordService.getById(eq(id), any())).thenThrow(new LandRecordNotFoundException(id));

        mockMvc.perform(get("/api/land-records/" + id)
                        .cookie(sessionCookieFor(Role.PUBLIC)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void updateAsGovernmentOfficialSucceeds() throws Exception {
        UUID id = UUID.randomUUID();
        when(landRecordService.update(eq(id), any(), any())).thenReturn(sampleResponse(id));

        mockMvc.perform(put("/api/land-records/" + id)
                        .cookie(sessionCookieFor(Role.GOVERNMENT_OFFICIAL))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PARCEL_GEOJSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    void updateAsPublicUserReturns403() throws Exception {
        UUID id = UUID.randomUUID();
        mockMvc.perform(put("/api/land-records/" + id)
                        .cookie(sessionCookieFor(Role.PUBLIC))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_PARCEL_GEOJSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteAsGovernmentOfficialReturns403() throws Exception {
        UUID id = UUID.randomUUID();
        mockMvc.perform(delete("/api/land-records/" + id)
                        .cookie(sessionCookieFor(Role.GOVERNMENT_OFFICIAL)))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteAsAdminReturns204() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(landRecordService).delete(eq(id), any());

        mockMvc.perform(delete("/api/land-records/" + id)
                        .cookie(sessionCookieFor(Role.ADMIN)))
                .andExpect(status().isNoContent());

        verify(landRecordService).delete(eq(id), any());
    }

    @Test
    void spatialIntersectsPostSucceedsForAuthenticatedUser() throws Exception {
        UUID id = UUID.randomUUID();
        PageResponse<LandRecordResponse> page = new PageResponse<>(
                List.of(sampleResponse(id)), 0, 20, 1, 1, true, true);
        when(landRecordService.findIntersecting(any(), any(), eq(0), eq(20), any()))
                .thenReturn(page);

        String spatialQueryPayload = """
                {
                  "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                      [
                        [77.4000, 23.2400],
                        [77.4300, 23.2400],
                        [77.4300, 23.2700],
                        [77.4000, 23.2700],
                        [77.4000, 23.2400]
                      ]
                    ]
                  },
                  "status": "ACTIVE"
                }
                """;

        mockMvc.perform(post("/api/land-records/spatial/intersects")
                        .cookie(sessionCookieFor(Role.RESEARCHER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(spatialQueryPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].parcelNumber").value("MP-BHO-2026-001"));
    }

    @Test
    void spatialContainsPostSucceedsForAuthenticatedUser() throws Exception {
        UUID id = UUID.randomUUID();
        PageResponse<LandRecordResponse> page = new PageResponse<>(
                List.of(sampleResponse(id)), 0, 20, 1, 1, true, true);
        when(landRecordService.findContaining(any(), any(), eq(0), eq(20), any()))
                .thenReturn(page);

        String spatialQueryPayload = """
                {
                  "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                      [
                        [77.4120, 23.2520],
                        [77.4180, 23.2520],
                        [77.4180, 23.2580],
                        [77.4120, 23.2580],
                        [77.4120, 23.2520]
                      ]
                    ]
                  }
                }
                """;

        mockMvc.perform(post("/api/land-records/spatial/contains")
                        .cookie(sessionCookieFor(Role.ACADEMIA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(spatialQueryPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].parcelNumber").value("MP-BHO-2026-001"));
    }

    // ------------------------------------------------ helpers

    private Cookie sessionCookieFor(Role role) {
        User user = User.registerLocal(
                "Test User", role.name().toLowerCase() + "@example.com", passwordEncoder.encode("x-password1"));
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        user.changeRole(role);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        return new Cookie(SESSION_COOKIE, jwtService.generateToken(user));
    }

    private LandRecordResponse sampleResponse(UUID id) {
        GeometryFactory factory = new GeometryFactory(new PrecisionModel(), 4326);
        Coordinate[] coords = new Coordinate[] {
                new Coordinate(77.4100, 23.2500),
                new Coordinate(77.4200, 23.2500),
                new Coordinate(77.4200, 23.2600),
                new Coordinate(77.4100, 23.2600),
                new Coordinate(77.4100, 23.2500)
        };
        LinearRing ring = factory.createLinearRing(coords);
        Polygon polygon = factory.createPolygon(ring);

        return new LandRecordResponse(
                id,
                "MP-BHO-2026-001",
                "SN-45/1",
                "Madhya Pradesh",
                "Bhopal",
                "Huzur",
                "Kolar",
                new BigDecimal("4500.50"),
                LandUseType.AGRICULTURAL,
                OwnershipType.INDIVIDUAL,
                "Ramesh Kumar Sharma",
                "OWN-IND-2026-45",
                LandRecordStatus.ACTIVE,
                polygon,
                Instant.now(),
                Instant.now());
    }
}
