package com.bhoomidrishti.assistant.service;

import com.bhoomidrishti.assistant.dto.AssistantContextRequestDTO;
import com.bhoomidrishti.assistant.dto.AuthorizedAssistantContextDTO;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.governance.dto.GovernanceComparisonRequest;
import com.bhoomidrishti.governance.dto.GovernanceComparisonResponse;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorDefinitionResponse;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorEvidenceResponse;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorSnapshotResponse;
import com.bhoomidrishti.governance.service.GovernanceComparisonService;
import com.bhoomidrishti.governance.service.GovernanceIndicatorService;
import com.bhoomidrishti.landrecord.dto.LandRecordResponse;
import com.bhoomidrishti.landrecord.service.LandRecordService;
import com.bhoomidrishti.research.dto.ResearchDocumentResponse;
import com.bhoomidrishti.research.service.ResearchDocumentService;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Server-side resolver and authorizer for statutory assistant context.
 *
 * <p>Enforces strict server-authoritative boundaries:
 * <ul>
 *   <li>Resolves entity state directly from PostgreSQL.</li>
 *   <li>Enforces RBAC and project isolation via domain services.</li>
 *   <li>Preserves anti-IDOR concealment: unauthorized contextual references throw 404.</li>
 *   <li>Filters out sensitive owner PII and internal database details.</li>
 * </ul>
 */
@Service
@Transactional(readOnly = true)
public class AssistantContextResolverService {

    private final GovernanceIndicatorService governanceIndicatorService;
    private final GovernanceComparisonService governanceComparisonService;
    private final ResearchDocumentService researchDocumentService;
    private final LandRecordService landRecordService;

    public AssistantContextResolverService(
            GovernanceIndicatorService governanceIndicatorService,
            GovernanceComparisonService governanceComparisonService,
            ResearchDocumentService researchDocumentService,
            LandRecordService landRecordService) {
        this.governanceIndicatorService = governanceIndicatorService;
        this.governanceComparisonService = governanceComparisonService;
        this.researchDocumentService = researchDocumentService;
        this.landRecordService = landRecordService;
    }

    /**
     * Resolves and authorizes platform context from lightweight request references.
     *
     * @param requestContext Context references supplied by the caller
     * @param auth           Spring Security authentication token
     * @return Fully authorized, structured context or null if no valid context requested
     */
    public AuthorizedAssistantContextDTO resolveAndAuthorize(
            AssistantContextRequestDTO requestContext,
            Authentication auth) {

        if (requestContext == null) {
            return null;
        }

        // 1. Governance Comparison Context
        if (requestContext.comparisonBaseSnapshotId() != null && requestContext.comparisonTargetSnapshotId() != null) {
            return resolveComparisonContext(
                    requestContext.comparisonBaseSnapshotId(),
                    requestContext.comparisonTargetSnapshotId(),
                    auth);
        }

        // 2. Governance Snapshot Context
        if (requestContext.snapshotId() != null) {
            return resolveSnapshotContext(requestContext.snapshotId(), auth);
        }

        // 3. Governance Indicator Definition Context
        if (requestContext.indicatorCode() != null && !requestContext.indicatorCode().isBlank()) {
            return resolveIndicatorDefinitionContext(requestContext.indicatorCode().trim());
        }

        // 4. Research Document Context
        if (requestContext.documentId() != null) {
            return resolveResearchDocumentContext(requestContext.documentId(), auth);
        }

        // 5. Land Record / Parcel Context
        if (requestContext.landRecordId() != null) {
            return resolveLandRecordContext(requestContext.landRecordId(), auth);
        }

        return null;
    }

    private AuthorizedAssistantContextDTO resolveIndicatorDefinitionContext(String indicatorCode) {
        GovernanceIndicatorDefinitionResponse def = governanceIndicatorService.getIndicatorDefinitionByCode(indicatorCode);
        if (def == null) {
            throw new ResourceNotFoundException("Governance indicator definition not found: " + indicatorCode);
        }

        StringBuilder summary = new StringBuilder();
        summary.append("Indicator Code: ").append(def.code()).append("\n");
        summary.append("Indicator Name: ").append(def.name()).append("\n");
        summary.append("Category: ").append(def.category()).append("\n");
        summary.append("Unit: ").append(def.unit()).append("\n");
        summary.append("Aggregation Method: ").append(def.aggregationMethod()).append("\n");
        summary.append("Source Domain: ").append(def.sourceDomain()).append("\n");
        summary.append("Description: ").append(def.description()).append("\n");
        summary.append("Calculation Version: ").append(def.calculationVersion());

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("indicatorCode", def.code());
        metadata.put("indicatorCategory", def.category().name());
        metadata.put("calculationVersion", def.calculationVersion());

        return new AuthorizedAssistantContextDTO(
                "GOVERNANCE_INDICATOR",
                def.name() + " (" + def.code() + ")",
                summary.toString(),
                List.of(),
                metadata
        );
    }

    private AuthorizedAssistantContextDTO resolveSnapshotContext(UUID snapshotId, Authentication auth) {
        // Enforces view authorization & anti-IDOR via GovernanceIndicatorService
        GovernanceIndicatorSnapshotResponse snapshot = governanceIndicatorService.getSnapshotById(snapshotId, auth);
        List<GovernanceIndicatorEvidenceResponse> evidenceList = governanceIndicatorService.getSnapshotEvidence(snapshotId, auth);

        StringBuilder summary = new StringBuilder();
        summary.append("Governance Snapshot ID: ").append(snapshot.id()).append("\n");
        summary.append("Indicator: ").append(snapshot.indicatorName()).append(" (").append(snapshot.indicatorCode()).append(")\n");
        summary.append("Category: ").append(snapshot.category()).append("\n");
        summary.append("Administrative Scope: ").append(snapshot.scopeType());
        if (snapshot.state() != null) summary.append(", State: ").append(snapshot.state());
        if (snapshot.district() != null) summary.append(", District: ").append(snapshot.district());
        if (snapshot.tehsil() != null) summary.append(", Tehsil: ").append(snapshot.tehsil());
        if (snapshot.village() != null) summary.append(", Village: ").append(snapshot.village());
        summary.append("\n");
        summary.append("Authoritative Evaluated Value: ").append(snapshot.numericValue()).append(" ").append(snapshot.unit()).append("\n");
        if (snapshot.denominator() != null) {
            summary.append("Denominator / Base Metric: ").append(snapshot.denominator()).append("\n");
        }
        summary.append("As Of Date: ").append(snapshot.asOf()).append("\n");
        summary.append("Source Data Timestamp: ").append(snapshot.sourceDataTimestamp()).append("\n");
        summary.append("Calculation Version: ").append(snapshot.calculationVersion()).append("\n");

        List<UUID> targetDocIds = new ArrayList<>();
        if (!evidenceList.isEmpty()) {
            summary.append("Linked Evidence Documents (").append(evidenceList.size()).append("):\n");
            for (GovernanceIndicatorEvidenceResponse ev : evidenceList) {
                summary.append("- [").append(ev.evidenceType()).append("] ")
                        .append(ev.documentTitle())
                        .append(ev.pageNumber() != null ? " (Page " + ev.pageNumber() + ")" : "")
                        .append(ev.rationale() != null ? " - Note: " + ev.rationale() : "")
                        .append("\n");
                if (ev.researchDocumentId() != null) {
                    targetDocIds.add(ev.researchDocumentId());
                }
            }
        }

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("snapshotId", snapshot.id().toString());
        metadata.put("indicatorCode", snapshot.indicatorCode());
        metadata.put("scopeType", snapshot.scopeType().name());
        metadata.put("numericValue", snapshot.numericValue());

        return new AuthorizedAssistantContextDTO(
                "GOVERNANCE_SNAPSHOT",
                "Snapshot: " + snapshot.indicatorName() + " (" + snapshot.scopeType() + ")",
                summary.toString(),
                targetDocIds,
                metadata
        );
    }

    private AuthorizedAssistantContextDTO resolveComparisonContext(
            UUID baseSnapshotId,
            UUID targetSnapshotId,
            Authentication auth) {

        // Verify view access for both snapshots (throws 404 if unauthorized)
        governanceIndicatorService.getSnapshotById(baseSnapshotId, auth);
        governanceIndicatorService.getSnapshotById(targetSnapshotId, auth);

        GovernanceComparisonResponse comparison = governanceComparisonService.compareGovernanceSnapshots(
                new GovernanceComparisonRequest(baseSnapshotId, targetSnapshotId, false),
                auth);

        StringBuilder summary = new StringBuilder();
        summary.append("Temporal Comparison for Indicator: ").append(comparison.indicatorName())
                .append(" (").append(comparison.indicatorCode()).append(")\n");
        summary.append("Scope: ").append(comparison.scopeType());
        if (comparison.state() != null) summary.append(", State: ").append(comparison.state());
        if (comparison.district() != null) summary.append(", District: ").append(comparison.district());
        summary.append("\n");
        summary.append("Baseline Snapshot: ").append(comparison.baseline().numericValue())
                .append(" ").append(comparison.unit())
                .append(" (as of ").append(comparison.baseline().asOf()).append(")\n");
        summary.append("Target Snapshot: ").append(comparison.target().numericValue())
                .append(" ").append(comparison.unit())
                .append(" (as of ").append(comparison.target().asOf()).append(")\n");
        if (comparison.quantitativeVariance() != null) {
            summary.append("Absolute Delta: ").append(comparison.quantitativeVariance().absoluteDelta())
                    .append(" ").append(comparison.unit())
                    .append(" (Trend: ").append(comparison.quantitativeVariance().trendDirection()).append(")\n");
        }
        summary.append("Elapsed Duration: ").append(comparison.elapsedDays()).append(" days\n");
        if (comparison.evidenceDelta() != null) {
            summary.append("Evidence Delta: ")
                    .append(comparison.evidenceDelta().commonEvidenceCount()).append(" common, ")
                    .append(comparison.evidenceDelta().addedEvidenceCount()).append(" added, ")
                    .append(comparison.evidenceDelta().removedEvidenceCount()).append(" removed documents.\n");
        }
        summary.append("Important Boundary: Correlation between temporal snapshots does not establish legal causality; "
                + "any explanation must be strictly supported by retrieved statutory documents and evidence.");

        List<UUID> targetDocIds = new ArrayList<>();
        if (comparison.evidenceDelta() != null) {
            comparison.evidenceDelta().commonEvidence().forEach(ev -> { if (ev.researchDocumentId() != null) targetDocIds.add(ev.researchDocumentId()); });
            comparison.evidenceDelta().addedEvidence().forEach(ev -> { if (ev.researchDocumentId() != null) targetDocIds.add(ev.researchDocumentId()); });
            comparison.evidenceDelta().removedEvidence().forEach(ev -> { if (ev.researchDocumentId() != null) targetDocIds.add(ev.researchDocumentId()); });
        }

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("baseSnapshotId", baseSnapshotId.toString());
        metadata.put("targetSnapshotId", targetSnapshotId.toString());
        metadata.put("indicatorCode", comparison.indicatorCode());

        return new AuthorizedAssistantContextDTO(
                "GOVERNANCE_COMPARISON",
                "Comparison: " + comparison.indicatorName(),
                summary.toString(),
                targetDocIds,
                metadata
        );
    }

    private AuthorizedAssistantContextDTO resolveResearchDocumentContext(UUID documentId, Authentication auth) {
        // Enforces read authorization & anti-IDOR via ResearchDocumentService
        ResearchDocumentResponse doc = researchDocumentService.getById(documentId, auth);

        StringBuilder summary = new StringBuilder();
        summary.append("Research Document Title: ").append(doc.title()).append("\n");
        summary.append("Document Type: ").append(doc.documentType()).append("\n");
        if (doc.authors() != null) summary.append("Authors: ").append(doc.authors()).append("\n");
        if (doc.organization() != null) summary.append("Publishing Organization: ").append(doc.organization()).append("\n");
        if (doc.publicationDate() != null) summary.append("Publication Date: ").append(doc.publicationDate()).append("\n");
        if (doc.abstractText() != null && !doc.abstractText().isBlank()) {
            summary.append("Document Abstract: ").append(doc.abstractText()).append("\n");
        }
        summary.append("Document Status: ").append(doc.status());

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("documentId", doc.id().toString());
        metadata.put("documentType", doc.documentType().name());
        metadata.put("documentStatus", doc.status().name());

        return new AuthorizedAssistantContextDTO(
                "RESEARCH_DOCUMENT",
                doc.title(),
                summary.toString(),
                List.of(documentId),
                metadata
        );
    }

    private AuthorizedAssistantContextDTO resolveLandRecordContext(UUID landRecordId, Authentication auth) {
        // Enforces read authorization & anti-IDOR via LandRecordService
        LandRecordResponse record = landRecordService.getById(landRecordId, auth);

        StringBuilder summary = new StringBuilder();
        summary.append("Land Record Parcel Number: ").append(record.parcelNumber()).append("\n");
        if (record.surveyNumber() != null && !record.surveyNumber().isBlank()) {
            summary.append("Survey Number: ").append(record.surveyNumber()).append("\n");
        }
        summary.append("Administrative Jurisdiction: ")
                .append(record.village()).append(", ")
                .append(record.tehsil()).append(", ")
                .append(record.district()).append(", ")
                .append(record.state()).append("\n");
        summary.append("Land Use Classification: ").append(record.landUseType()).append("\n");
        summary.append("Ownership Type: ").append(record.ownershipType()).append("\n");
        summary.append("Legal / Cadastral Status: ").append(record.status()).append("\n");
        summary.append("Parcel Area: ").append(record.landAreaSqMeters()).append(" sq. meters");

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("landRecordId", record.id().toString());
        metadata.put("parcelNumber", record.parcelNumber());
        metadata.put("landUseType", record.landUseType().name());
        metadata.put("status", record.status().name());

        return new AuthorizedAssistantContextDTO(
                "LAND_RECORD",
                "Land Parcel: " + record.parcelNumber() + " (" + record.village() + ")",
                summary.toString(),
                List.of(),
                metadata
        );
    }
}
