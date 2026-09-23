package com.bhoomidrishti.knowledge.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.exception.DuplicateIngestionException;
import com.bhoomidrishti.exception.ResearchDocumentNotFoundException;
import com.bhoomidrishti.knowledge.client.AiServiceClient;
import com.bhoomidrishti.knowledge.dto.DocumentProcessingStatusResponse;
import com.bhoomidrishti.knowledge.dto.EvidenceItemResponse;
import com.bhoomidrishti.knowledge.dto.IngestDocumentResponse;
import com.bhoomidrishti.knowledge.dto.KnowledgeSearchRequest;
import com.bhoomidrishti.knowledge.dto.KnowledgeSearchResponse;
import com.bhoomidrishti.knowledge.entity.DocumentProcessing;
import com.bhoomidrishti.knowledge.entity.ProcessingStatus;
import com.bhoomidrishti.knowledge.repository.DocumentProcessingRepository;
import com.bhoomidrishti.research.entity.DocumentType;
import com.bhoomidrishti.research.entity.ResearchDocument;
import com.bhoomidrishti.research.entity.ResearchDocumentStatus;
import com.bhoomidrishti.research.repository.ResearchDocumentRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class KnowledgeServiceTest {

    @Mock
    private AiServiceClient aiServiceClient;

    @Mock
    private ResearchDocumentRepository researchDocumentRepository;

    @Mock
    private DocumentProcessingRepository documentProcessingRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private KnowledgeService knowledgeService;

    private User researcher;
    private User otherResearcher;
    private User admin;
    private ResearchDocument publishedDoc;
    private ResearchDocument draftDoc;

    @BeforeEach
    void setUp() {
        researcher = User.registerLocal("Researcher", "researcher@example.com", "pass");
        ReflectionTestUtils.setField(researcher, "id", UUID.randomUUID());
        researcher.changeRole(Role.RESEARCHER);

        otherResearcher = User.registerLocal("Other", "other@example.com", "pass");
        ReflectionTestUtils.setField(otherResearcher, "id", UUID.randomUUID());
        otherResearcher.changeRole(Role.RESEARCHER);

        admin = User.registerLocal("Admin", "admin@example.com", "pass");
        ReflectionTestUtils.setField(admin, "id", UUID.randomUUID());
        admin.changeRole(Role.ADMIN);

        publishedDoc = new ResearchDocument(
                "Land Tenure Guidelines",
                "Policy review for cadastre",
                DocumentType.POLICY_DOCUMENT,
                "MoRD",
                "Ministry of Rural Development",
                LocalDate.now(),
                "https://example.com/source",
                "https://example.com/paper.pdf",
                "en",
                "cadastre,tenure",
                "Abstract summary",
                ResearchDocumentStatus.PUBLISHED,
                researcher
        );
        ReflectionTestUtils.setField(publishedDoc, "id", UUID.randomUUID());

        draftDoc = new ResearchDocument(
                "Draft Cadastre Strategy",
                "Internal draft",
                DocumentType.RESEARCH_PAPER,
                "Author",
                "Org",
                LocalDate.now(),
                null,
                null,
                "en",
                "draft",
                "Draft abstract",
                ResearchDocumentStatus.DRAFT,
                researcher
        );
        ReflectionTestUtils.setField(draftDoc, "id", UUID.randomUUID());
    }

    @Test
    void searchAsPublicRestrictsToPublishedOnly() {
        KnowledgeSearchRequest request = new KnowledgeSearchRequest("land tenure", 5, null, null);

        EvidenceItemResponse item = new EvidenceItemResponse(
                UUID.randomUUID(),
                publishedDoc.getId(),
                publishedDoc.getTitle(),
                publishedDoc.getDocumentType().name(),
                publishedDoc.getAuthors(),
                publishedDoc.getOrganization(),
                publishedDoc.getPublicationDate(),
                "Evidence excerpt",
                1,
                "Introduction",
                0.85,
                publishedDoc.getSourceUrl(),
                "Citation",
                0
        );

        KnowledgeSearchResponse mockResponse = new KnowledgeSearchResponse(
                "land tenure",
                1,
                25,
                List.of(item)
        );

        when(aiServiceClient.search(eq(request), eq(true), any())).thenReturn(mockResponse);

        KnowledgeSearchResponse result = knowledgeService.search(request, null);

        assertThat(result.totalResults()).isEqualTo(1);
        assertThat(result.results().get(0).documentTitle()).isEqualTo("Land Tenure Guidelines");
        verify(aiServiceClient).search(eq(request), eq(true), any());
    }

    @Test
    void searchAsAdminAllowsAllStatuses() {
        KnowledgeSearchRequest request = new KnowledgeSearchRequest("land tenure", 5, null, null);
        Authentication adminAuth = new UsernamePasswordAuthenticationToken(
                admin.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        KnowledgeSearchResponse mockResponse = new KnowledgeSearchResponse(
                "land tenure",
                0,
                10,
                List.of()
        );

        when(aiServiceClient.search(eq(request), eq(false), any())).thenReturn(mockResponse);

        KnowledgeSearchResponse result = knowledgeService.search(request, adminAuth);

        assertThat(result.totalResults()).isEqualTo(0);
        verify(aiServiceClient).search(eq(request), eq(false), any());
    }

    @Test
    void triggerIngestEnforcesOwnership() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                otherResearcher.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_RESEARCHER"))
        );
        when(researchDocumentRepository.findById(publishedDoc.getId())).thenReturn(Optional.of(publishedDoc));
        when(userRepository.findByEmail(otherResearcher.getEmail())).thenReturn(Optional.of(otherResearcher));

        assertThatThrownBy(() -> knowledgeService.triggerIngest(publishedDoc.getId(), auth))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("You can only ingest");
    }

    @Test
    void triggerIngestRejectsDuplicateActiveProcessing() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                researcher.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_RESEARCHER"))
        );
        when(researchDocumentRepository.findById(publishedDoc.getId())).thenReturn(Optional.of(publishedDoc));
        when(userRepository.findByEmail(researcher.getEmail())).thenReturn(Optional.of(researcher));
        when(documentProcessingRepository.existsByResearchDocumentIdAndStatusIn(
                eq(publishedDoc.getId()),
                any()
        )).thenReturn(true);

        assertThatThrownBy(() -> knowledgeService.triggerIngest(publishedDoc.getId(), auth))
                .isInstanceOf(DuplicateIngestionException.class);
    }

    @Test
    void triggerIngestSucceedsForOwner() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                researcher.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_RESEARCHER"))
        );
        when(researchDocumentRepository.findById(publishedDoc.getId())).thenReturn(Optional.of(publishedDoc));
        when(userRepository.findByEmail(researcher.getEmail())).thenReturn(Optional.of(researcher));
        when(documentProcessingRepository.existsByResearchDocumentIdAndStatusIn(
                eq(publishedDoc.getId()),
                any()
        )).thenReturn(false);

        IngestDocumentResponse mockAiResponse = new IngestDocumentResponse(
                publishedDoc.getId(),
                ProcessingStatus.QUEUED,
                "Document ingestion queued."
        );
        when(aiServiceClient.triggerIngest(publishedDoc.getId(), publishedDoc.getFileUrl(), publishedDoc.getSourceUrl(), null))
                .thenReturn(mockAiResponse);

        IngestDocumentResponse response = knowledgeService.triggerIngest(publishedDoc.getId(), auth);

        assertThat(response.documentId()).isEqualTo(publishedDoc.getId());
        assertThat(response.status()).isEqualTo(ProcessingStatus.QUEUED);
        verify(aiServiceClient).triggerIngest(publishedDoc.getId(), publishedDoc.getFileUrl(), publishedDoc.getSourceUrl(), null);
    }

    @Test
    void getProcessingStatusReturnsNotIngestedWhenRecordAbsent() {
        when(researchDocumentRepository.findById(publishedDoc.getId())).thenReturn(Optional.of(publishedDoc));
        when(documentProcessingRepository.findByResearchDocumentId(publishedDoc.getId())).thenReturn(Optional.empty());

        DocumentProcessingStatusResponse status = knowledgeService.getProcessingStatus(publishedDoc.getId(), null);

        assertThat(status.status()).isEqualTo(ProcessingStatus.NOT_INGESTED);
        assertThat(status.chunkCount()).isEqualTo(0);
    }
}
