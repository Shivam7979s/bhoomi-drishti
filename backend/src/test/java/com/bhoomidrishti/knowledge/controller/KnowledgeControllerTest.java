package com.bhoomidrishti.knowledge.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.auth.security.JwtService;
import com.bhoomidrishti.exception.AiServiceUnavailableException;
import com.bhoomidrishti.exception.DuplicateIngestionException;
import com.bhoomidrishti.knowledge.dto.DocumentProcessingStatusResponse;
import com.bhoomidrishti.knowledge.dto.EvidenceItemResponse;
import com.bhoomidrishti.knowledge.dto.IngestDocumentResponse;
import com.bhoomidrishti.knowledge.dto.KnowledgeSearchResponse;
import com.bhoomidrishti.knowledge.entity.ProcessingStatus;
import com.bhoomidrishti.knowledge.service.KnowledgeService;
import com.bhoomidrishti.testconfig.SecurityTestConfiguration;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(KnowledgeController.class)
@Import(SecurityTestConfiguration.class)
class KnowledgeControllerTest {

    private static final String SESSION_COOKIE = "bhoomi_auth";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private KnowledgeService knowledgeService;

    @MockitoBean
    private UserRepository userRepository;

    // -------------------------------------------------------------------------
    // Public Search Endpoint Tests
    // -------------------------------------------------------------------------

    @Test
    void searchReturnsResultsPubliclyWithoutAuth() throws Exception {
        UUID docId = UUID.randomUUID();
        UUID chunkId = UUID.randomUUID();
        EvidenceItemResponse item = new EvidenceItemResponse(
                chunkId,
                docId,
                "Cadastral Survey Guidelines 2026",
                "RESEARCH_PAPER",
                "Survey of India",
                "Survey of India",
                LocalDate.now(),
                "Cadastral boundaries must be surveyed using DGPS or high-resolution orthophotos.",
                1,
                "1. Introduction",
                0.892,
                "https://example.com/survey.pdf",
                "Survey of India. (2026). Cadastral Survey Guidelines 2026, p. 1.",
                0
        );

        KnowledgeSearchResponse response = new KnowledgeSearchResponse(
                "cadastral boundary survey",
                1,
                45,
                List.of(item)
        );

        when(knowledgeService.search(any(), any())).thenReturn(response);

        String payload = """
                {
                  "query": "cadastral boundary survey",
                  "topK": 5
                }
                """;

        mockMvc.perform(post("/api/knowledge/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.query").value("cadastral boundary survey"))
                .andExpect(jsonPath("$.totalResults").value(1))
                .andExpect(jsonPath("$.results[0].documentTitle").value("Cadastral Survey Guidelines 2026"))
                .andExpect(jsonPath("$.results[0].pageNumber").value(1))
                .andExpect(jsonPath("$.results[0].similarity").value(0.892));
    }

    @Test
    void searchRejectsBlankQuery() throws Exception {
        String payload = """
                {
                  "query": "   ",
                  "topK": 5
                }
                """;

        mockMvc.perform(post("/api/knowledge/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // Ingestion Security & Flow Tests
    // -------------------------------------------------------------------------

    @Test
    void ingestRequiresAuthentication() throws Exception {
        UUID docId = UUID.randomUUID();
        mockMvc.perform(post("/api/research-documents/" + docId + "/ingest"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void ingestSucceedsForResearcher() throws Exception {
        UUID docId = UUID.randomUUID();
        IngestDocumentResponse response = new IngestDocumentResponse(
                docId,
                ProcessingStatus.QUEUED,
                "Document ingestion initiated asynchronously."
        );

        when(knowledgeService.triggerIngest(eq(docId), any())).thenReturn(response);

        mockMvc.perform(post("/api/research-documents/" + docId + "/ingest")
                        .cookie(sessionCookieFor(Role.RESEARCHER)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.documentId").value(docId.toString()))
                .andExpect(jsonPath("$.status").value("QUEUED"));
    }

    @Test
    void ingestFailsWith403WhenForbidden() throws Exception {
        UUID docId = UUID.randomUUID();
        when(knowledgeService.triggerIngest(eq(docId), any()))
                .thenThrow(new AccessDeniedException("Only the document creator or an administrator can ingest this document."));

        mockMvc.perform(post("/api/research-documents/" + docId + "/ingest")
                        .cookie(sessionCookieFor(Role.RESEARCHER)))
                .andExpect(status().isForbidden());
    }

    @Test
    void ingestFailsWith409OnDuplicateIngestion() throws Exception {
        UUID docId = UUID.randomUUID();
        when(knowledgeService.triggerIngest(eq(docId), any()))
                .thenThrow(new DuplicateIngestionException("Ingestion is already in progress for document: " + docId));

        mockMvc.perform(post("/api/research-documents/" + docId + "/ingest")
                        .cookie(sessionCookieFor(Role.ADMIN)))
                .andExpect(status().isConflict());
    }

    @Test
    void ingestFailsWith503WhenAiServiceDown() throws Exception {
        UUID docId = UUID.randomUUID();
        when(knowledgeService.triggerIngest(eq(docId), any()))
                .thenThrow(new AiServiceUnavailableException("AI service is currently unavailable."));

        mockMvc.perform(post("/api/research-documents/" + docId + "/ingest")
                        .cookie(sessionCookieFor(Role.ADMIN)))
                .andExpect(status().isServiceUnavailable());
    }

    // -------------------------------------------------------------------------
    // Processing Status Tests
    // -------------------------------------------------------------------------

    @Test
    void processingStatusRequiresAuthentication() throws Exception {
        UUID docId = UUID.randomUUID();
        mockMvc.perform(get("/api/research-documents/" + docId + "/processing-status"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void processingStatusSucceedsForAuthenticatedUser() throws Exception {
        UUID docId = UUID.randomUUID();
        UUID processingId = UUID.randomUUID();
        DocumentProcessingStatusResponse response = new DocumentProcessingStatusResponse(
                processingId,
                docId,
                ProcessingStatus.COMPLETED,
                null,
                12,
                "abc123hash",
                "v1-bge-small",
                Instant.now().minusSeconds(60),
                Instant.now()
        );

        when(knowledgeService.getProcessingStatus(eq(docId), any())).thenReturn(response);

        mockMvc.perform(get("/api/research-documents/" + docId + "/processing-status")
                        .cookie(sessionCookieFor(Role.RESEARCHER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.researchDocumentId").value(docId.toString()))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.chunkCount").value(12));
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
}
