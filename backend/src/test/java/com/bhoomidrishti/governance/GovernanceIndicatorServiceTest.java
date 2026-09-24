package com.bhoomidrishti.governance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.repository.ProjectRepository;
import com.bhoomidrishti.collaboration.service.CollaborationSecurityService;
import com.bhoomidrishti.exception.DuplicateEvidenceException;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.governance.dto.CreateGovernanceSnapshotRequest;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorDefinitionResponse;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorEvidenceResponse;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorSnapshotResponse;
import com.bhoomidrishti.governance.dto.LinkGovernanceEvidenceRequest;
import com.bhoomidrishti.governance.entity.AggregationMethod;
import com.bhoomidrishti.governance.entity.GovernanceEvidenceType;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorDefinition;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorEvidence;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorSnapshot;
import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import com.bhoomidrishti.governance.entity.IndicatorCategory;
import com.bhoomidrishti.governance.entity.IndicatorUnit;
import com.bhoomidrishti.governance.entity.SnapshotVisibility;
import com.bhoomidrishti.governance.repository.GovernanceCalculationRepository;
import com.bhoomidrishti.governance.repository.GovernanceCalculationRepository.CalculationResult;
import com.bhoomidrishti.governance.repository.GovernanceIndicatorDefinitionRepository;
import com.bhoomidrishti.governance.repository.GovernanceIndicatorEvidenceRepository;
import com.bhoomidrishti.governance.repository.GovernanceIndicatorSnapshotRepository;
import com.bhoomidrishti.governance.service.GovernanceIndicatorService;
import com.bhoomidrishti.policy.repository.DocumentChunkQueryRepository;
import com.bhoomidrishti.policy.repository.DocumentChunkQueryRepository.DocumentChunkProvenance;
import com.bhoomidrishti.research.entity.DocumentType;
import com.bhoomidrishti.research.entity.ResearchDocument;
import com.bhoomidrishti.research.entity.ResearchDocumentStatus;
import com.bhoomidrishti.research.repository.ResearchDocumentRepository;
import com.bhoomidrishti.research.service.ResearchDocumentService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class GovernanceIndicatorServiceTest {

    @Mock
    private GovernanceIndicatorDefinitionRepository definitionRepository;

    @Mock
    private GovernanceIndicatorSnapshotRepository snapshotRepository;

    @Mock
    private GovernanceIndicatorEvidenceRepository evidenceRepository;

    @Mock
    private GovernanceCalculationRepository calculationRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ResearchDocumentRepository researchDocumentRepository;

    @Mock
    private ResearchDocumentService researchDocumentService;

    @Mock
    private DocumentChunkQueryRepository documentChunkQueryRepository;

    @Mock
    private CollaborationSecurityService collaborationSecurityService;

    private GovernanceIndicatorService service;

    private User adminUser;
    private User researcherUser;
    private Authentication adminAuth;
    private Authentication researcherAuth;
    private GovernanceIndicatorDefinition activeDefinition;

    @BeforeEach
    void setUp() {
        service = new GovernanceIndicatorService(
                definitionRepository,
                snapshotRepository,
                evidenceRepository,
                calculationRepository,
                projectRepository,
                researchDocumentRepository,
                researchDocumentService,
                documentChunkQueryRepository,
                collaborationSecurityService);

        adminUser = User.registerLocal("Admin Officer", "admin@bhoomi.gov.in", "hash");
        adminUser.changeRole(Role.ADMIN);
        ReflectionTestUtils.setField(adminUser, "id", UUID.randomUUID());

        researcherUser = User.registerLocal("Dr. Sharma", "researcher@univ.edu", "hash");
        researcherUser.changeRole(Role.RESEARCHER);
        ReflectionTestUtils.setField(researcherUser, "id", UUID.randomUUID());

        adminAuth = new UsernamePasswordAuthenticationToken(adminUser, null);
        researcherAuth = new UsernamePasswordAuthenticationToken(researcherUser, null);

        activeDefinition = new GovernanceIndicatorDefinition(
                "DISPUTED_PARCEL_COUNT",
                "Disputed Parcel Count",
                "Description",
                IndicatorCategory.STATUS_DISTRIBUTION,
                IndicatorUnit.COUNT,
                AggregationMethod.COUNT,
                "LAND_RECORD",
                "1.0");
        activeDefinition.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("Should retrieve active definitions or by category")
    void testGetIndicatorDefinitions() {
        when(definitionRepository.findByActiveTrueOrderByCategoryAscNameAsc())
                .thenReturn(List.of(activeDefinition));
        when(definitionRepository.findByCategory(IndicatorCategory.STATUS_DISTRIBUTION))
                .thenReturn(List.of(activeDefinition));

        List<GovernanceIndicatorDefinitionResponse> all = service.getIndicatorDefinitions(null);
        assertThat(all).hasSize(1);
        assertThat(all.get(0).code()).isEqualTo("DISPUTED_PARCEL_COUNT");

        List<GovernanceIndicatorDefinitionResponse> byCat = service.getIndicatorDefinitions(IndicatorCategory.STATUS_DISTRIBUTION);
        assertThat(byCat).hasSize(1);
    }

    @Test
    @DisplayName("Should retrieve definition by code or throw 404")
    void testGetIndicatorDefinitionByCode() {
        when(definitionRepository.findByCode("DISPUTED_PARCEL_COUNT"))
                .thenReturn(Optional.of(activeDefinition));

        GovernanceIndicatorDefinitionResponse res = service.getIndicatorDefinitionByCode("DISPUTED_PARCEL_COUNT");
        assertThat(res.code()).isEqualTo("DISPUTED_PARCEL_COUNT");

        when(definitionRepository.findByCode("UNKNOWN")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getIndicatorDefinitionByCode("UNKNOWN"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Indicator definition not found");
    }

    @Test
    @DisplayName("Should create regional snapshot when user has GOVERNMENT_OFFICIAL or ADMIN role")
    void testCreateRegionalSnapshotSuccess() {
        when(collaborationSecurityService.requireAuthenticatedUser(adminAuth)).thenReturn(adminUser);
        when(definitionRepository.findByCode("DISPUTED_PARCEL_COUNT")).thenReturn(Optional.of(activeDefinition));

        CreateGovernanceSnapshotRequest req = new CreateGovernanceSnapshotRequest(
                "DISPUTED_PARCEL_COUNT",
                null,
                GovernanceScopeType.DISTRICT,
                "Madhya Pradesh",
                "Bhopal",
                null,
                null,
                SnapshotVisibility.INTERNAL,
                Instant.now(),
                null,
                null,
                "v1");

        when(calculationRepository.calculateIndicator(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new CalculationResult(BigDecimal.valueOf(142), BigDecimal.valueOf(5000), "{\"disputedRate\": 0.0284}", Instant.now()));

        when(snapshotRepository.save(any(GovernanceIndicatorSnapshot.class)))
                .thenAnswer(inv -> {
                    GovernanceIndicatorSnapshot s = inv.getArgument(0);
                    s.setId(UUID.randomUUID());
                    return s;
                });

        GovernanceIndicatorSnapshotResponse res = service.createSnapshot(req, adminAuth);

        assertThat(res).isNotNull();
        assertThat(res.indicatorCode()).isEqualTo("DISPUTED_PARCEL_COUNT");
        assertThat(res.numericValue()).isEqualTo(BigDecimal.valueOf(142));
        assertThat(res.scopeType()).isEqualTo(GovernanceScopeType.DISTRICT);
    }

    @Test
    @DisplayName("Should reject regional snapshot creation by non-government/admin users")
    void testCreateRegionalSnapshotForbidden() {
        when(collaborationSecurityService.requireAuthenticatedUser(researcherAuth)).thenReturn(researcherUser);
        when(definitionRepository.findByCode("DISPUTED_PARCEL_COUNT")).thenReturn(Optional.of(activeDefinition));

        CreateGovernanceSnapshotRequest req = new CreateGovernanceSnapshotRequest(
                "DISPUTED_PARCEL_COUNT",
                null,
                GovernanceScopeType.DISTRICT,
                "Madhya Pradesh",
                "Bhopal",
                null,
                null,
                SnapshotVisibility.INTERNAL,
                Instant.now(),
                null,
                null,
                "v1");

        assertThatThrownBy(() -> service.createSnapshot(req, researcherAuth))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only GOVERNMENT_OFFICIAL or ADMIN");
    }

    @Test
    @DisplayName("Should reject snapshot creation when required regional scope fields are missing")
    void testCreateSnapshotScopeMissingFields() {
        when(collaborationSecurityService.requireAuthenticatedUser(adminAuth)).thenReturn(adminUser);
        when(definitionRepository.findByCode("DISPUTED_PARCEL_COUNT")).thenReturn(Optional.of(activeDefinition));

        // Missing district in DISTRICT scope
        CreateGovernanceSnapshotRequest req = new CreateGovernanceSnapshotRequest(
                "DISPUTED_PARCEL_COUNT",
                null,
                GovernanceScopeType.DISTRICT,
                "Madhya Pradesh",
                null,
                null,
                null,
                SnapshotVisibility.INTERNAL,
                Instant.now(),
                null,
                null,
                "v1");

        assertThatThrownBy(() -> service.createSnapshot(req, adminAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("state and district are required for DISTRICT scope type");
    }

    @Test
    @DisplayName("Should reject snapshot creation when periodEnd is before periodStart")
    void testCreateSnapshotInvalidPeriod() {
        when(collaborationSecurityService.requireAuthenticatedUser(adminAuth)).thenReturn(adminUser);
        when(definitionRepository.findByCode("DISPUTED_PARCEL_COUNT")).thenReturn(Optional.of(activeDefinition));

        Instant start = Instant.parse("2026-06-01T00:00:00Z");
        Instant end = Instant.parse("2026-05-01T00:00:00Z"); // Earlier than start!

        CreateGovernanceSnapshotRequest req = new CreateGovernanceSnapshotRequest(
                "DISPUTED_PARCEL_COUNT",
                null,
                GovernanceScopeType.DISTRICT,
                "Madhya Pradesh",
                "Bhopal",
                null,
                null,
                SnapshotVisibility.INTERNAL,
                Instant.now(),
                start,
                end,
                "v1");

        assertThatThrownBy(() -> service.createSnapshot(req, adminAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("periodEnd cannot be before periodStart");
    }

    @Test
    @DisplayName("Should retrieve published regional snapshot without project checks")
    void testGetRegionalSnapshot() {
        GovernanceIndicatorSnapshot snapshot = new GovernanceIndicatorSnapshot(
                activeDefinition,
                null,
                GovernanceScopeType.DISTRICT,
                "Madhya Pradesh",
                "Bhopal",
                null,
                null,
                SnapshotVisibility.PUBLISHED,
                Instant.now(),
                null,
                null,
                BigDecimal.valueOf(142),
                null,
                null,
                "1.0",
                Instant.now(),
                null,
                adminUser);
        UUID snapshotId = UUID.randomUUID();
        snapshot.setId(snapshotId);

        when(snapshotRepository.findById(snapshotId)).thenReturn(Optional.of(snapshot));

        GovernanceIndicatorSnapshotResponse res = service.getSnapshotById(snapshotId, researcherAuth);
        assertThat(res.id()).isEqualTo(snapshotId);
        assertThat(res.projectId()).isNull();
    }

    @Test
    @DisplayName("Should link valid evidence to snapshot and reject duplicate")
    void testLinkEvidenceAndDuplicateCheck() {
        GovernanceIndicatorSnapshot snapshot = new GovernanceIndicatorSnapshot(
                activeDefinition,
                null,
                GovernanceScopeType.DISTRICT,
                "Madhya Pradesh",
                "Bhopal",
                null,
                null,
                SnapshotVisibility.INTERNAL,
                Instant.now(),
                null,
                null,
                BigDecimal.valueOf(142),
                null,
                null,
                "1.0",
                Instant.now(),
                null,
                adminUser);
        UUID snapshotId = UUID.randomUUID();
        snapshot.setId(snapshotId);

        UUID docId = UUID.randomUUID();
        UUID chunkId = UUID.randomUUID();

        ResearchDocument doc = new ResearchDocument(
                "Revenue Circular 2026",
                "Desc",
                DocumentType.GOVERNMENT_REPORT,
                "Author",
                "Org",
                null,
                null,
                null,
                "en",
                null,
                null,
                ResearchDocumentStatus.PUBLISHED,
                researcherUser);
        ReflectionTestUtils.setField(doc, "id", docId);

        DocumentChunkProvenance prov = new DocumentChunkProvenance(
                chunkId, docId, 0, "Statutory guidelines text", 1, "Section 1");

        when(collaborationSecurityService.requireAuthenticatedUser(adminAuth)).thenReturn(adminUser);
        when(snapshotRepository.findById(snapshotId)).thenReturn(Optional.of(snapshot));
        when(researchDocumentRepository.findById(docId)).thenReturn(Optional.of(doc));
        when(researchDocumentService.canRead(doc, adminAuth)).thenReturn(true);
        when(documentChunkQueryRepository.findProvenanceById(chunkId)).thenReturn(Optional.of(prov));
        when(evidenceRepository.existsBySnapshotIdAndResearchDocumentIdAndDocumentChunkIdAndEvidenceType(
                snapshotId, docId, chunkId, GovernanceEvidenceType.STATUTORY_BENCHMARK)).thenReturn(false);

        when(evidenceRepository.save(any(GovernanceIndicatorEvidence.class)))
                .thenAnswer(inv -> {
                    GovernanceIndicatorEvidence ev = inv.getArgument(0);
                    ev.setId(UUID.randomUUID());
                    return ev;
                });

        LinkGovernanceEvidenceRequest req = new LinkGovernanceEvidenceRequest(
                docId, chunkId, GovernanceEvidenceType.STATUTORY_BENCHMARK, "Statutory basis", new BigDecimal("0.8500"));

        GovernanceIndicatorEvidenceResponse res = service.linkEvidence(snapshotId, req, adminAuth);

        assertThat(res).isNotNull();
        assertThat(res.documentTitle()).isEqualTo("Revenue Circular 2026");
        assertThat(res.chunkText()).isEqualTo("Statutory guidelines text");

        // Duplicate test
        when(evidenceRepository.existsBySnapshotIdAndResearchDocumentIdAndDocumentChunkIdAndEvidenceType(
                snapshotId, docId, chunkId, GovernanceEvidenceType.STATUTORY_BENCHMARK)).thenReturn(true);

        assertThatThrownBy(() -> service.linkEvidence(snapshotId, req, adminAuth))
                .isInstanceOf(DuplicateEvidenceException.class)
                .hasMessageContaining("already been linked");
    }

    @Test
    @DisplayName("Should unlink evidence successfully")
    void testUnlinkEvidence() {
        GovernanceIndicatorSnapshot snapshot = new GovernanceIndicatorSnapshot(
                activeDefinition,
                null,
                GovernanceScopeType.DISTRICT,
                "Madhya Pradesh",
                "Bhopal",
                null,
                null,
                SnapshotVisibility.INTERNAL,
                Instant.now(),
                null,
                null,
                BigDecimal.valueOf(142),
                null,
                null,
                "1.0",
                Instant.now(),
                null,
                adminUser);
        UUID snapshotId = UUID.randomUUID();
        UUID evidenceId = UUID.randomUUID();

        GovernanceIndicatorEvidence ev = new GovernanceIndicatorEvidence();
        ev.setId(evidenceId);
        ev.setSnapshot(snapshot);

        when(collaborationSecurityService.requireAuthenticatedUser(adminAuth)).thenReturn(adminUser);
        when(snapshotRepository.findById(snapshotId)).thenReturn(Optional.of(snapshot));
        when(evidenceRepository.findByIdAndSnapshotId(evidenceId, snapshotId)).thenReturn(Optional.of(ev));

        service.unlinkEvidence(snapshotId, evidenceId, adminAuth);

        verify(evidenceRepository).delete(ev);
    }
}
