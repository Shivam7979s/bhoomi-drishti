package com.bhoomidrishti.assistant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bhoomidrishti.assistant.dto.AssistantContextRequestDTO;
import com.bhoomidrishti.assistant.dto.AssistantQueryRequestDTO;
import com.bhoomidrishti.assistant.dto.AssistantQueryResponseDTO;
import com.bhoomidrishti.assistant.dto.AuthorizedAssistantContextDTO;
import com.bhoomidrishti.assistant.dto.GroundingStatus;
import com.bhoomidrishti.assistant.service.AssistantContextResolverService;
import com.bhoomidrishti.assistant.service.AssistantService;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.governance.dto.GovernanceComparisonRequest;
import com.bhoomidrishti.governance.dto.GovernanceComparisonResponse;
import com.bhoomidrishti.governance.dto.GovernanceEvidenceDeltaDTO;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorDefinitionResponse;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorEvidenceResponse;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorSnapshotResponse;
import com.bhoomidrishti.governance.dto.GovernanceMetricDeltaDTO;
import com.bhoomidrishti.governance.dto.GovernanceMilestoneDTO;
import com.bhoomidrishti.governance.entity.AggregationMethod;
import com.bhoomidrishti.governance.entity.GovernanceEvidenceType;
import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import com.bhoomidrishti.governance.entity.IndicatorCategory;
import com.bhoomidrishti.governance.entity.IndicatorUnit;
import com.bhoomidrishti.governance.entity.SnapshotVisibility;
import com.bhoomidrishti.governance.service.GovernanceComparisonService;
import com.bhoomidrishti.governance.service.GovernanceIndicatorService;
import com.bhoomidrishti.knowledge.client.AiServiceClient;
import com.bhoomidrishti.landrecord.dto.LandRecordResponse;
import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.landrecord.entity.OwnershipType;
import com.bhoomidrishti.landrecord.service.LandRecordService;
import com.bhoomidrishti.research.dto.ResearchDocumentResponse;
import com.bhoomidrishti.research.entity.DocumentType;
import com.bhoomidrishti.research.entity.ResearchDocumentStatus;
import com.bhoomidrishti.research.service.ResearchDocumentService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;

@ExtendWith(MockitoExtension.class)
class AssistantContextResolverServiceTest {

    @Mock
    private GovernanceIndicatorService governanceIndicatorService;

    @Mock
    private GovernanceComparisonService governanceComparisonService;

    @Mock
    private ResearchDocumentService researchDocumentService;

    @Mock
    private LandRecordService landRecordService;

    @Mock
    private AiServiceClient aiServiceClient;

    private AssistantContextResolverService contextResolverService;
    private AssistantService assistantService;

    private final Authentication auth = new TestingAuthenticationToken("user", "pass", "ROLE_USER");

    @BeforeEach
    void setUp() {
        contextResolverService = new AssistantContextResolverService(
                governanceIndicatorService,
                governanceComparisonService,
                researchDocumentService,
                landRecordService
        );
        assistantService = new AssistantService(aiServiceClient, contextResolverService);
    }

    private GovernanceIndicatorDefinitionResponse createDef(String code, String name) {
        return new GovernanceIndicatorDefinitionResponse(
                UUID.randomUUID(), code, name, "Description", IndicatorCategory.LAND_USE,
                IndicatorUnit.PERCENTAGE, AggregationMethod.PERCENTAGE_SHARE, "FOREST_DEPT",
                "1.0", true, Instant.now(), Instant.now()
        );
    }

    private GovernanceIndicatorSnapshotResponse createSnapshot(UUID id, String code, String name, BigDecimal val, Instant asOf) {
        return new GovernanceIndicatorSnapshotResponse(
                id, UUID.randomUUID(), code, name, IndicatorCategory.LAND_USE, IndicatorUnit.PERCENTAGE,
                null, GovernanceScopeType.STATE, "Madhya Pradesh", "Bhopal", null, null, SnapshotVisibility.PUBLISHED,
                asOf, asOf.minusSeconds(86400 * 30), asOf, val, BigDecimal.valueOf(100.0),
                null, "1.0", asOf, "v1", UUID.randomUUID(), "Officer", asOf, 1
        );
    }

    @Test
    void resolveAndAuthorize_nullRequestContext_returnsNull() {
        AuthorizedAssistantContextDTO result = contextResolverService.resolveAndAuthorize(null, auth);
        assertThat(result).isNull();
    }

    @Test
    void resolveAndAuthorize_indicatorDefinition_success() {
        GovernanceIndicatorDefinitionResponse def = createDef("IND-001", "Forest Land Compliance");
        when(governanceIndicatorService.getIndicatorDefinitionByCode("IND-001")).thenReturn(def);

        AssistantContextRequestDTO req = AssistantContextRequestDTO.forIndicator("IND-001");
        AuthorizedAssistantContextDTO result = contextResolverService.resolveAndAuthorize(req, auth);

        assertThat(result).isNotNull();
        assertThat(result.contextType()).isEqualTo("GOVERNANCE_INDICATOR");
        assertThat(result.title()).isEqualTo("Forest Land Compliance (IND-001)");
        assertThat(result.summary()).contains("Forest Land Compliance").contains("1.0");
        assertThat(result.metadata()).containsEntry("indicatorCode", "IND-001");
    }

    @Test
    void resolveAndAuthorize_indicatorDefinition_notFound_throws404() {
        when(governanceIndicatorService.getIndicatorDefinitionByCode("UNKNOWN")).thenReturn(null);

        AssistantContextRequestDTO req = AssistantContextRequestDTO.forIndicator("UNKNOWN");
        assertThatThrownBy(() -> contextResolverService.resolveAndAuthorize(req, auth))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void resolveAndAuthorize_snapshot_successWithEvidenceTargetDocs() {
        UUID snapshotId = UUID.randomUUID();
        UUID docId1 = UUID.randomUUID();

        GovernanceIndicatorSnapshotResponse snapshot = createSnapshot(
                snapshotId, "IND-002", "Title Dispute Ratio", BigDecimal.valueOf(14.5), Instant.now()
        );

        GovernanceIndicatorEvidenceResponse ev = new GovernanceIndicatorEvidenceResponse(
                UUID.randomUUID(),
                snapshotId,
                docId1,
                UUID.randomUUID(),
                "MP Revenue Court Annual Report",
                "POLICY_DOCUMENT",
                "Dispute metrics reported for Bhopal district",
                12,
                "Section 4",
                GovernanceEvidenceType.STATUTORY_BENCHMARK,
                BigDecimal.valueOf(0.85),
                "Dispute metrics note",
                UUID.randomUUID(),
                "Officer",
                Instant.now()
        );

        when(governanceIndicatorService.getSnapshotById(snapshotId, auth)).thenReturn(snapshot);
        when(governanceIndicatorService.getSnapshotEvidence(snapshotId, auth)).thenReturn(List.of(ev));

        AssistantContextRequestDTO req = AssistantContextRequestDTO.forSnapshot(snapshotId);
        AuthorizedAssistantContextDTO result = contextResolverService.resolveAndAuthorize(req, auth);

        assertThat(result).isNotNull();
        assertThat(result.contextType()).isEqualTo("GOVERNANCE_SNAPSHOT");
        assertThat(result.title()).contains("Title Dispute Ratio");
        assertThat(result.targetDocumentIds()).containsExactly(docId1);
        assertThat(result.summary()).contains("14.5 PERCENTAGE").contains("MP Revenue Court Annual Report");
    }

    @Test
    void resolveAndAuthorize_snapshot_unauthorized_throws404AntiIdor() {
        UUID snapshotId = UUID.randomUUID();
        when(governanceIndicatorService.getSnapshotById(snapshotId, auth))
                .thenThrow(new ResourceNotFoundException("Snapshot not found: " + snapshotId));

        AssistantContextRequestDTO req = AssistantContextRequestDTO.forSnapshot(snapshotId);
        assertThatThrownBy(() -> contextResolverService.resolveAndAuthorize(req, auth))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void resolveAndAuthorize_researchDocument_successRestrictsTargetDoc() {
        UUID docId = UUID.randomUUID();
        ResearchDocumentResponse doc = new ResearchDocumentResponse(
                docId,
                "Forest Conservation Guidelines 2024",
                "Guidelines description",
                DocumentType.POLICY_DOCUMENT,
                "Ministry of Environment",
                "MoEFCC",
                LocalDate.of(2024, 1, 15),
                "http://example.com/source",
                "http://example.com/file.pdf",
                "en",
                "forest, conservation",
                "Official guidelines on forest land conversion",
                ResearchDocumentStatus.PUBLISHED,
                UUID.randomUUID(),
                "Admin",
                Instant.now(),
                Instant.now(),
                0,
                List.of()
        );
        when(researchDocumentService.getById(docId, auth)).thenReturn(doc);

        AssistantContextRequestDTO req = AssistantContextRequestDTO.forDocument(docId);
        AuthorizedAssistantContextDTO result = contextResolverService.resolveAndAuthorize(req, auth);

        assertThat(result).isNotNull();
        assertThat(result.contextType()).isEqualTo("RESEARCH_DOCUMENT");
        assertThat(result.title()).isEqualTo("Forest Conservation Guidelines 2024");
        assertThat(result.targetDocumentIds()).containsExactly(docId);
        assertThat(result.summary()).contains("Ministry of Environment").contains("POLICY_DOCUMENT");
    }

    @Test
    void resolveAndAuthorize_landRecord_successOmitsPii() {
        UUID recordId = UUID.randomUUID();
        LandRecordResponse record = new LandRecordResponse(
                recordId,
                "MP-BHO-101",
                "SUR-402",
                "Madhya Pradesh",
                "Bhopal",
                "Sehore",
                "Shyampur",
                BigDecimal.valueOf(15000.5),
                LandUseType.AGRICULTURAL,
                OwnershipType.INDIVIDUAL,
                "Secret Owner Name",
                "AADHAAR-1234-5678",
                LandRecordStatus.ACTIVE,
                null,
                Instant.now(),
                Instant.now()
        );
        when(landRecordService.getById(recordId, auth)).thenReturn(record);

        AssistantContextRequestDTO req = AssistantContextRequestDTO.forLandRecord(recordId);
        AuthorizedAssistantContextDTO result = contextResolverService.resolveAndAuthorize(req, auth);

        assertThat(result).isNotNull();
        assertThat(result.contextType()).isEqualTo("LAND_RECORD");
        assertThat(result.title()).contains("MP-BHO-101");
        assertThat(result.summary()).contains("AGRICULTURAL").contains("15000.5 sq. meters");
        // Verify sensitive owner PII is strictly excluded
        assertThat(result.summary()).doesNotContain("Secret Owner Name").doesNotContain("AADHAAR");
    }

    @Test
    void resolveAndAuthorize_comparison_success() {
        UUID baseId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        UUID docId = UUID.randomUUID();
        Instant now = Instant.now();

        GovernanceIndicatorSnapshotResponse baseSnapshot = createSnapshot(baseId, "IND-001", "Compliance", BigDecimal.valueOf(80.0), now.minusSeconds(86400 * 365));
        GovernanceIndicatorSnapshotResponse targetSnapshot = createSnapshot(targetId, "IND-001", "Compliance", BigDecimal.valueOf(88.0), now);

        GovernanceIndicatorEvidenceResponse ev = new GovernanceIndicatorEvidenceResponse(
                UUID.randomUUID(), targetId, docId, UUID.randomUUID(), "Annual Forest Audit 2026",
                "GOVERNMENT_REPORT", "Audit text", 1, "Section 1", GovernanceEvidenceType.STATUTORY_BENCHMARK,
                BigDecimal.valueOf(0.9), "Audit evidence", UUID.randomUUID(), "Officer", now
        );

        GovernanceMilestoneDTO baseMilestone = new GovernanceMilestoneDTO(
                baseId, now.minusSeconds(86400 * 365), BigDecimal.valueOf(80.0), null, "1.0", false, 0
        );
        GovernanceMilestoneDTO targetMilestone = new GovernanceMilestoneDTO(
                targetId, now, BigDecimal.valueOf(88.0), null, "1.0", false, 1
        );

        GovernanceMetricDeltaDTO variance = new GovernanceMetricDeltaDTO(
                BigDecimal.valueOf(8.0), BigDecimal.valueOf(10.0), true, "INCREASING", null
        );

        GovernanceEvidenceDeltaDTO evidenceDelta = new GovernanceEvidenceDeltaDTO(
                0, 1, 0, List.of(), List.of(ev), List.of()
        );

        GovernanceComparisonResponse comparisonResponse = new GovernanceComparisonResponse(
                "IND-001", "Forest Compliance", IndicatorCategory.LAND_USE, IndicatorUnit.PERCENTAGE,
                GovernanceScopeType.STATE, "MP", null, null, null, null,
                baseMilestone, targetMilestone, variance, List.of(), evidenceDelta,
                false, 365L, false
        );

        when(governanceIndicatorService.getSnapshotById(baseId, auth)).thenReturn(baseSnapshot);
        when(governanceIndicatorService.getSnapshotById(targetId, auth)).thenReturn(targetSnapshot);
        when(governanceComparisonService.compareGovernanceSnapshots(any(GovernanceComparisonRequest.class), eq(auth)))
                .thenReturn(comparisonResponse);

        AssistantContextRequestDTO req = AssistantContextRequestDTO.forComparison(baseId, targetId);
        AuthorizedAssistantContextDTO result = contextResolverService.resolveAndAuthorize(req, auth);

        assertThat(result).isNotNull();
        assertThat(result.contextType()).isEqualTo("GOVERNANCE_COMPARISON");
        assertThat(result.targetDocumentIds()).containsExactly(docId);
        assertThat(result.summary()).contains("Temporal Comparison").contains("8.0 PERCENTAGE");
        assertThat(result.summary()).contains("Correlation between temporal snapshots does not establish legal causality");
    }

    @Test
    void assistantService_withContext_forwardsAuthorizedContextAndRestrictsDocuments() {
        UUID docId = UUID.randomUUID();
        ResearchDocumentResponse doc = new ResearchDocumentResponse(
                docId, "Guidelines 2024", "Desc", DocumentType.POLICY_DOCUMENT, "Govt", "MoEF",
                LocalDate.of(2024, 1, 1), "http://src", "http://file", "en", "kw", "Summary",
                ResearchDocumentStatus.PUBLISHED, UUID.randomUUID(), "Admin", Instant.now(), Instant.now(), 0, List.of()
        );
        when(researchDocumentService.getById(docId, auth)).thenReturn(doc);

        AssistantContextRequestDTO contextReq = AssistantContextRequestDTO.forDocument(docId);
        AssistantQueryRequestDTO queryReq = new AssistantQueryRequestDTO("What are conversion rules?", 5, null, null, contextReq);

        AssistantQueryResponseDTO expectedResp = new AssistantQueryResponseDTO(
                queryReq.query(), "Conversion rules require prior clearance.", GroundingStatus.GROUNDED,
                List.of(), "Disclaimer", Map.of("contextType", "RESEARCH_DOCUMENT")
        );

        when(aiServiceClient.queryAssistant(eq(queryReq), any(AuthorizedAssistantContextDTO.class), eq(true), eq(List.of(docId))))
                .thenReturn(expectedResp);

        AssistantQueryResponseDTO actualResp = assistantService.query(queryReq, auth);

        assertThat(actualResp).isNotNull();
        assertThat(actualResp.answer()).contains("Conversion rules");
        verify(aiServiceClient).queryAssistant(eq(queryReq), any(AuthorizedAssistantContextDTO.class), eq(true), eq(List.of(docId)));
    }

    @Test
    void resolveAndAuthorize_comparison_unauthorizedTarget_throws404AntiIdor() {
        UUID baseId = UUID.randomUUID();
        UUID unauthorizedTargetId = UUID.randomUUID();
        Instant now = Instant.now();

        GovernanceIndicatorSnapshotResponse baseSnapshot = createSnapshot(baseId, "IND-001", "Compliance", BigDecimal.valueOf(80.0), now.minusSeconds(86400 * 365));

        when(governanceIndicatorService.getSnapshotById(baseId, auth)).thenReturn(baseSnapshot);
        when(governanceIndicatorService.getSnapshotById(unauthorizedTargetId, auth))
                .thenThrow(new ResourceNotFoundException("Governance snapshot not found: " + unauthorizedTargetId));

        AssistantContextRequestDTO req = AssistantContextRequestDTO.forComparison(baseId, unauthorizedTargetId);

        assertThatThrownBy(() -> contextResolverService.resolveAndAuthorize(req, auth))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(unauthorizedTargetId.toString());
    }

    @Test
    void resolveAndAuthorize_comparison_unauthorizedBase_throws404AntiIdor() {
        UUID unauthorizedBaseId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        when(governanceIndicatorService.getSnapshotById(unauthorizedBaseId, auth))
                .thenThrow(new ResourceNotFoundException("Governance snapshot not found: " + unauthorizedBaseId));

        AssistantContextRequestDTO req = AssistantContextRequestDTO.forComparison(unauthorizedBaseId, targetId);

        assertThatThrownBy(() -> contextResolverService.resolveAndAuthorize(req, auth))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(unauthorizedBaseId.toString());
    }

    @Test
    void resolveAndAuthorize_researchDocument_unauthorized_throws404AntiIdor() {
        UUID unauthorizedDocId = UUID.randomUUID();
        when(researchDocumentService.getById(unauthorizedDocId, auth))
                .thenThrow(new ResourceNotFoundException("Research document not found: " + unauthorizedDocId));

        AssistantContextRequestDTO req = AssistantContextRequestDTO.forDocument(unauthorizedDocId);

        assertThatThrownBy(() -> contextResolverService.resolveAndAuthorize(req, auth))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void resolveAndAuthorize_landRecord_unauthorized_throws404AntiIdor() {
        UUID unauthorizedRecordId = UUID.randomUUID();
        when(landRecordService.getById(unauthorizedRecordId, auth))
                .thenThrow(new ResourceNotFoundException("Land record not found: " + unauthorizedRecordId));

        AssistantContextRequestDTO req = AssistantContextRequestDTO.forLandRecord(unauthorizedRecordId);

        assertThatThrownBy(() -> contextResolverService.resolveAndAuthorize(req, auth))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void resolveAndAuthorize_partialComparison_singleSnapshotOnly_returnsNull() {
        // Supplying only base snapshot without target must NOT produce a partial comparison
        UUID baseId = UUID.randomUUID();
        AssistantContextRequestDTO req = new AssistantContextRequestDTO(
                "GOVERNANCE_COMPARISON", null, null, baseId, null, null, null, null
        );

        AuthorizedAssistantContextDTO result = contextResolverService.resolveAndAuthorize(req, auth);
        assertThat(result).isNull();
    }

    @Test
    void resolveAndAuthorize_suppliedProjectId_cannotBypassOrOverrideSnapshotAuthorization() {
        UUID snapshotId = UUID.randomUUID();
        UUID fakeProjectId = UUID.randomUUID();

        // Even if frontend provides a projectId, the server queries getSnapshotById which validates
        // the snapshot's actual project against the user's project memberships
        when(governanceIndicatorService.getSnapshotById(snapshotId, auth))
                .thenThrow(new ResourceNotFoundException("Governance snapshot not found: " + snapshotId));

        AssistantContextRequestDTO req = new AssistantContextRequestDTO(
                "GOVERNANCE_SNAPSHOT", null, snapshotId, null, null, null, null, fakeProjectId
        );

        assertThatThrownBy(() -> contextResolverService.resolveAndAuthorize(req, auth))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
