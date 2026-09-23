package com.bhoomidrishti.research.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
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
import com.bhoomidrishti.exception.ResearchDocumentNotFoundException;
import com.bhoomidrishti.landrecord.dto.LandRecordResponse;
import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.landrecord.entity.OwnershipType;
import com.bhoomidrishti.research.dto.CreateResearchDocumentRequest;
import com.bhoomidrishti.research.dto.ResearchDocumentResponse;
import com.bhoomidrishti.research.dto.UpdateResearchDocumentRequest;
import com.bhoomidrishti.research.entity.DocumentType;
import com.bhoomidrishti.research.entity.ResearchDocumentStatus;
import com.bhoomidrishti.research.service.ResearchDocumentService;
import com.bhoomidrishti.testconfig.SecurityTestConfiguration;
import jakarta.servlet.http.Cookie;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ResearchDocumentController.class)
@Import(SecurityTestConfiguration.class)
class ResearchDocumentControllerTest {

    private static final String SESSION_COOKIE = "bhoomi_auth";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private ResearchDocumentService service;

    @MockitoBean
    private UserRepository userRepository;

    // -------------------------------------------------------------------------
    // Public Access & Status Guard Tests
    // -------------------------------------------------------------------------

    @Test
    void publicCanListPublishedDocumentsWithoutAuthentication() throws Exception {
        UUID docId = UUID.randomUUID();
        ResearchDocumentResponse item = sampleResponse(docId, ResearchDocumentStatus.PUBLISHED);
        PageResponse<ResearchDocumentResponse> page =
                new PageResponse<>(List.of(item), 0, 20, 1, 1, true, true);

        when(service.list(any(), any(), any(), any(), any(), any(), any(), any(), any(), anyInt(), anyInt(), any()))
                .thenReturn(page);

        mockMvc.perform(get("/api/research-documents"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(docId.toString()))
                .andExpect(jsonPath("$.content[0].status").value("PUBLISHED"));
    }

    @Test
    void publicCanGetPublishedDocumentByUuid() throws Exception {
        UUID docId = UUID.randomUUID();
        when(service.getById(eq(docId), any()))
                .thenReturn(sampleResponse(docId, ResearchDocumentStatus.PUBLISHED));

        mockMvc.perform(get("/api/research-documents/{id}", docId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(docId.toString()))
                .andExpect(jsonPath("$.status").value("PUBLISHED"));
    }

    @Test
    void publicRequestingDraftByUuidReturns404() throws Exception {
        UUID draftId = UUID.randomUUID();
        when(service.getById(eq(draftId), any()))
                .thenThrow(new ResearchDocumentNotFoundException(draftId));

        mockMvc.perform(get("/api/research-documents/{id}", draftId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Research document not found: " + draftId));
    }

    @Test
    void publicRequestingArchivedDocumentByUuidReturns404() throws Exception {
        UUID archivedId = UUID.randomUUID();
        when(service.getById(eq(archivedId), any()))
                .thenThrow(new ResearchDocumentNotFoundException(archivedId));

        mockMvc.perform(get("/api/research-documents/{id}", archivedId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Research document not found: " + archivedId));
    }

    // -------------------------------------------------------------------------
    // Creation & Role Permissions
    // -------------------------------------------------------------------------

    @Test
    void unauthenticatedCannotCreateDocument() throws Exception {
        String payload = """
                {
                  "title": "Land Tenure Survey",
                  "description": "Evaluation of rural parcel boundaries",
                  "documentType": "RESEARCH_PAPER",
                  "authors": "Dr. A. Sharma",
                  "language": "en"
                }
                """;

        mockMvc.perform(post("/api/research-documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void publicRoleCannotCreateDocument() throws Exception {
        String payload = """
                {
                  "title": "Land Tenure Survey",
                  "description": "Evaluation of rural parcel boundaries",
                  "documentType": "RESEARCH_PAPER",
                  "authors": "Dr. A. Sharma",
                  "language": "en"
                }
                """;

        mockMvc.perform(post("/api/research-documents")
                        .cookie(sessionCookieFor(Role.PUBLIC))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden());
    }

    @Test
    void researcherCanCreateDocument() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.create(any(CreateResearchDocumentRequest.class), any()))
                .thenReturn(sampleResponse(id, ResearchDocumentStatus.DRAFT));

        String payload = """
                {
                  "title": "Digital Cadastral Reform",
                  "description": "Analysis of land records and PostGIS integration",
                  "documentType": "RESEARCH_PAPER",
                  "authors": "Researcher Smith",
                  "organization": "Land Institute",
                  "language": "en"
                }
                """;

        mockMvc.perform(post("/api/research-documents")
                        .cookie(sessionCookieFor(Role.RESEARCHER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    void academiaCanCreateDocument() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.create(any(CreateResearchDocumentRequest.class), any()))
                .thenReturn(sampleResponse(id, ResearchDocumentStatus.DRAFT));

        String payload = """
                {
                  "title": "Academic Land Policy Study",
                  "description": "Evaluation of agricultural land distribution",
                  "documentType": "ACADEMIC_PUBLICATION",
                  "authors": "Prof. Rao",
                  "organization": "University of Delhi",
                  "language": "en"
                }
                """;

        mockMvc.perform(post("/api/research-documents")
                        .cookie(sessionCookieFor(Role.ACADEMIA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    void governmentOfficialCanCreateDocument() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.create(any(CreateResearchDocumentRequest.class), any()))
                .thenReturn(sampleResponse(id, ResearchDocumentStatus.PUBLISHED));

        String payload = """
                {
                  "title": "State Land Governance Whitepaper",
                  "description": "Government guidelines for spatial verification",
                  "documentType": "GOVERNMENT_REPORT",
                  "authors": "Revenue Department",
                  "organization": "Ministry of Land",
                  "language": "en"
                }
                """;

        mockMvc.perform(post("/api/research-documents")
                        .cookie(sessionCookieFor(Role.GOVERNMENT_OFFICIAL))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(id.toString()));
    }

    // -------------------------------------------------------------------------
    // Ownership & Update Enforcement
    // -------------------------------------------------------------------------

    @Test
    void researcherAttemptingToUpdateAnotherUsersDocumentReturns403() throws Exception {
        UUID otherDocId = UUID.randomUUID();
        when(service.update(eq(otherDocId), any(UpdateResearchDocumentRequest.class), any()))
                .thenThrow(new AccessDeniedException("You can only modify documents you created"));

        String payload = """
                {
                  "title": "Hijacked Title",
                  "description": "Attempting unauthorized update",
                  "documentType": "RESEARCH_PAPER",
                  "authors": "Attacker",
                  "status": "PUBLISHED"
                }
                """;

        mockMvc.perform(put("/api/research-documents/{id}", otherDocId)
                        .cookie(sessionCookieFor(Role.RESEARCHER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("Insufficient permissions"));
    }

    @Test
    void academiaAttemptingToUpdateAnotherUsersDocumentReturns403() throws Exception {
        UUID otherDocId = UUID.randomUUID();
        when(service.update(eq(otherDocId), any(UpdateResearchDocumentRequest.class), any()))
                .thenThrow(new AccessDeniedException("You can only modify documents you created"));

        String payload = """
                {
                  "title": "Modified Title",
                  "description": "Academia unauthorized edit attempt",
                  "documentType": "ACADEMIC_PUBLICATION",
                  "authors": "Other Academic",
                  "status": "DRAFT"
                }
                """;

        mockMvc.perform(put("/api/research-documents/{id}", otherDocId)
                        .cookie(sessionCookieFor(Role.ACADEMIA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("Insufficient permissions"));
    }

    @Test
    void researcherUpdatingOwnDocumentSucceeds() throws Exception {
        UUID ownDocId = UUID.randomUUID();
        when(service.update(eq(ownDocId), any(UpdateResearchDocumentRequest.class), any()))
                .thenReturn(sampleResponse(ownDocId, ResearchDocumentStatus.PUBLISHED));

        String payload = """
                {
                  "title": "Updated Cadastral Study",
                  "description": "Updated description with new evidence",
                  "documentType": "RESEARCH_PAPER",
                  "authors": "Researcher Smith",
                  "status": "PUBLISHED"
                }
                """;

        mockMvc.perform(put("/api/research-documents/{id}", ownDocId)
                        .cookie(sessionCookieFor(Role.RESEARCHER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(ownDocId.toString()));
    }

    // -------------------------------------------------------------------------
    // Delete Permissions
    // -------------------------------------------------------------------------

    @Test
    void nonAdminCannotDeleteDocument() throws Exception {
        UUID docId = UUID.randomUUID();
        mockMvc.perform(delete("/api/research-documents/{id}", docId)
                        .cookie(sessionCookieFor(Role.GOVERNMENT_OFFICIAL)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/research-documents/{id}", docId)
                        .cookie(sessionCookieFor(Role.RESEARCHER)))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanDeleteDocument() throws Exception {
        UUID docId = UUID.randomUUID();
        doNothing().when(service).delete(eq(docId), any());

        mockMvc.perform(delete("/api/research-documents/{id}", docId)
                        .cookie(sessionCookieFor(Role.ADMIN)))
                .andExpect(status().isNoContent());
    }

    // -------------------------------------------------------------------------
    // Land Record Linking & Unlinking Tests
    // -------------------------------------------------------------------------

    @Test
    void linkingNonexistentLandRecordReturns404() throws Exception {
        UUID docId = UUID.randomUUID();
        UUID invalidLrId = UUID.randomUUID();

        when(service.linkLandRecord(eq(docId), eq(invalidLrId), any()))
                .thenThrow(new LandRecordNotFoundException(invalidLrId));

        mockMvc.perform(post("/api/research-documents/{docId}/land-records/{lrId}", docId, invalidLrId)
                        .cookie(sessionCookieFor(Role.RESEARCHER))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Land record not found: " + invalidLrId));
    }

    @Test
    void linkingNonexistentResearchDocumentReturns404() throws Exception {
        UUID invalidDocId = UUID.randomUUID();
        UUID lrId = UUID.randomUUID();

        when(service.linkLandRecord(eq(invalidDocId), eq(lrId), any()))
                .thenThrow(new ResearchDocumentNotFoundException(invalidDocId));

        mockMvc.perform(post("/api/research-documents/{docId}/land-records/{lrId}", invalidDocId, lrId)
                        .cookie(sessionCookieFor(Role.RESEARCHER))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Research document not found: " + invalidDocId));
    }

    @Test
    void authorizedUserCanLinkAndUnlinkLandRecord() throws Exception {
        UUID docId = UUID.randomUUID();
        UUID lrId = UUID.randomUUID();

        when(service.linkLandRecord(eq(docId), eq(lrId), any()))
                .thenReturn(sampleResponse(docId, ResearchDocumentStatus.PUBLISHED));
        when(service.unlinkLandRecord(eq(docId), eq(lrId), any()))
                .thenReturn(sampleResponse(docId, ResearchDocumentStatus.PUBLISHED));

        mockMvc.perform(post("/api/research-documents/{docId}/land-records/{lrId}", docId, lrId)
                        .cookie(sessionCookieFor(Role.GOVERNMENT_OFFICIAL)))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/research-documents/{docId}/land-records/{lrId}", docId, lrId)
                        .cookie(sessionCookieFor(Role.GOVERNMENT_OFFICIAL)))
                .andExpect(status().isOk());
    }

    @Test
    void canGetLinkedLandRecordsForDocument() throws Exception {
        UUID docId = UUID.randomUUID();
        when(service.getLinkedLandRecords(eq(docId), any()))
                .thenReturn(List.of(sampleLandRecordResponse(UUID.randomUUID())));

        mockMvc.perform(get("/api/research-documents/{docId}/land-records", docId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].parcelNumber").value("MP-BHO-2026-001"));
    }

    @Test
    void canGetLinkedResearchDocumentsForLandRecord() throws Exception {
        UUID lrId = UUID.randomUUID();
        ResearchDocumentResponse item = sampleResponse(UUID.randomUUID(), ResearchDocumentStatus.PUBLISHED);
        PageResponse<ResearchDocumentResponse> page =
                new PageResponse<>(List.of(item), 0, 20, 1, 1, true, true);

        when(service.getLinkedResearchDocuments(eq(lrId), anyInt(), anyInt(), any()))
                .thenReturn(page);

        mockMvc.perform(get("/api/land-records/{lrId}/research-documents", lrId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Sample Document"));
    }

    // -------------------------------------------------------------------------
    // Validation Failure Tests
    // -------------------------------------------------------------------------

    @Test
    void creationRejectsMissingTitle() throws Exception {
        String payload = """
                {
                  "title": "",
                  "description": "Some description",
                  "documentType": "RESEARCH_PAPER",
                  "authors": "Author"
                }
                """;

        mockMvc.perform(post("/api/research-documents")
                        .cookie(sessionCookieFor(Role.RESEARCHER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.title").exists());
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Cookie sessionCookieFor(Role role) {
        User user = User.registerLocal(
                "Test " + role.name(),
                role.name().toLowerCase() + "@example.com",
                passwordEncoder.encode("secret-pass"));
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        user.changeRole(role);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        return new Cookie(SESSION_COOKIE, jwtService.generateToken(user));
    }

    private ResearchDocumentResponse sampleResponse(UUID id, ResearchDocumentStatus status) {
        return new ResearchDocumentResponse(
                id,
                "Sample Document",
                "Detailed evidence regarding land governance",
                DocumentType.RESEARCH_PAPER,
                "Dr. Expert",
                "National Land Council",
                LocalDate.of(2026, 1, 15),
                "https://example.com/source",
                "https://example.com/file.pdf",
                "en",
                "land,cadastre,reform",
                "Abstract summary of evidence",
                status,
                UUID.randomUUID(),
                "Creator User",
                Instant.now(),
                Instant.now(),
                0,
                Collections.emptyList()
        );
    }

    private LandRecordResponse sampleLandRecordResponse(UUID id) {
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
