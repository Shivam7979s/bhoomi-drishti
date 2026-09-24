package com.bhoomidrishti.governance.controller;

import com.bhoomidrishti.governance.dto.CreateGovernanceSnapshotRequest;
import com.bhoomidrishti.governance.dto.GovernanceAdministrativeSummaryResponse;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorDefinitionResponse;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorEvidenceResponse;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorSnapshotResponse;
import com.bhoomidrishti.governance.dto.GovernanceScopeQuery;
import com.bhoomidrishti.governance.dto.LinkGovernanceEvidenceRequest;
import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import com.bhoomidrishti.governance.entity.IndicatorCategory;
import com.bhoomidrishti.governance.dto.GovernanceComparisonRequest;
import com.bhoomidrishti.governance.dto.GovernanceComparisonResponse;
import com.bhoomidrishti.governance.service.GovernanceComparisonService;
import com.bhoomidrishti.governance.service.GovernanceIndicatorService;
import com.bhoomidrishti.governance.service.GovernanceQueryService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
public class GovernanceIndicatorController {

    private final GovernanceIndicatorService governanceIndicatorService;
    private final GovernanceQueryService governanceQueryService;
    private final GovernanceComparisonService governanceComparisonService;

    public GovernanceIndicatorController(GovernanceIndicatorService governanceIndicatorService) {
        this(governanceIndicatorService, null, null);
    }

    public GovernanceIndicatorController(
            GovernanceIndicatorService governanceIndicatorService,
            GovernanceQueryService governanceQueryService) {
        this(governanceIndicatorService, governanceQueryService, null);
    }

    @Autowired
    public GovernanceIndicatorController(
            GovernanceIndicatorService governanceIndicatorService,
            GovernanceQueryService governanceQueryService,
            GovernanceComparisonService governanceComparisonService) {
        this.governanceIndicatorService = governanceIndicatorService;
        this.governanceQueryService = governanceQueryService;
        this.governanceComparisonService = governanceComparisonService;
    }

    // -------------------------------------------------------------------------
    // Administrative Summary (Live on-the-fly aggregation)
    // -------------------------------------------------------------------------

    @GetMapping("/api/governance/summary")
    public ResponseEntity<GovernanceAdministrativeSummaryResponse> getAdministrativeSummary(
            @RequestParam GovernanceScopeType scopeType,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String tehsil,
            @RequestParam(required = false) String village,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) IndicatorCategory category,
            @RequestParam(required = false) List<String> indicators,
            Authentication auth) {
        GovernanceScopeQuery scopeQuery = new GovernanceScopeQuery(
                scopeType, state, district, tehsil, village, projectId);
        GovernanceAdministrativeSummaryResponse summary = governanceQueryService.generateAdministrativeSummary(
                scopeQuery, category, indicators, auth);
        return ResponseEntity.ok(summary);
    }

    // -------------------------------------------------------------------------
    // Indicator Definitions (Metadata)
    // -------------------------------------------------------------------------

    @GetMapping("/api/governance/indicators")
    public ResponseEntity<List<GovernanceIndicatorDefinitionResponse>> getIndicatorDefinitions(
            @RequestParam(required = false) IndicatorCategory category) {
        return ResponseEntity.ok(governanceIndicatorService.getIndicatorDefinitions(category));
    }

    @GetMapping("/api/governance/indicators/{code}")
    public ResponseEntity<GovernanceIndicatorDefinitionResponse> getIndicatorDefinitionByCode(
            @PathVariable String code) {
        return ResponseEntity.ok(governanceIndicatorService.getIndicatorDefinitionByCode(code));
    }

    // -------------------------------------------------------------------------
    // Indicator Snapshots (Immutable calculation outputs)
    // -------------------------------------------------------------------------

    @PostMapping("/api/governance/snapshots")
    public ResponseEntity<GovernanceIndicatorSnapshotResponse> createSnapshot(
            @Valid @RequestBody CreateGovernanceSnapshotRequest request,
            Authentication auth) {
        GovernanceIndicatorSnapshotResponse response = governanceIndicatorService.createSnapshot(request, auth);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/governance/snapshots/{id}")
    public ResponseEntity<GovernanceIndicatorSnapshotResponse> getSnapshotById(
            @PathVariable UUID id,
            Authentication auth) {
        return ResponseEntity.ok(governanceIndicatorService.getSnapshotById(id, auth));
    }

    @GetMapping("/api/projects/{projectId}/governance-snapshots")
    public ResponseEntity<List<GovernanceIndicatorSnapshotResponse>> getSnapshotsByProject(
            @PathVariable UUID projectId,
            Authentication auth) {
        return ResponseEntity.ok(governanceIndicatorService.getSnapshotsByProject(projectId, auth));
    }

    @GetMapping("/api/governance/snapshots")
    public ResponseEntity<List<GovernanceIndicatorSnapshotResponse>> getSnapshotsByScope(
            @RequestParam GovernanceScopeType scopeType,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String tehsil,
            @RequestParam(required = false) String village,
            @RequestParam(required = false) String indicatorCode,
            Authentication auth) {
        return ResponseEntity.ok(governanceIndicatorService.getSnapshotsByScope(
                scopeType, state, district, tehsil, village, indicatorCode, auth));
    }

    // -------------------------------------------------------------------------
    // Evidence & Provenance Linking
    // -------------------------------------------------------------------------

    @GetMapping("/api/governance/snapshots/{snapshotId}/evidence")
    public ResponseEntity<List<GovernanceIndicatorEvidenceResponse>> getSnapshotEvidence(
            @PathVariable UUID snapshotId,
            Authentication auth) {
        return ResponseEntity.ok(governanceIndicatorService.getSnapshotEvidence(snapshotId, auth));
    }

    @PostMapping("/api/governance/snapshots/{snapshotId}/evidence")
    public ResponseEntity<GovernanceIndicatorEvidenceResponse> linkEvidence(
            @PathVariable UUID snapshotId,
            @Valid @RequestBody LinkGovernanceEvidenceRequest request,
            Authentication auth) {
        GovernanceIndicatorEvidenceResponse response = governanceIndicatorService.linkEvidence(snapshotId, request, auth);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/api/governance/snapshots/{snapshotId}/evidence/{evidenceId}")
    public ResponseEntity<Void> unlinkEvidence(
            @PathVariable UUID snapshotId,
            @PathVariable UUID evidenceId,
            Authentication auth) {
        governanceIndicatorService.unlinkEvidence(snapshotId, evidenceId, auth);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------
    // Temporal Governance Comparison
    // -------------------------------------------------------------------------

    @PostMapping("/api/governance/compare")
    public ResponseEntity<GovernanceComparisonResponse> compareSnapshots(
            @Valid @RequestBody GovernanceComparisonRequest request,
            Authentication auth) {
        GovernanceComparisonResponse response =
                governanceComparisonService.compareGovernanceSnapshots(request, auth);
        return ResponseEntity.ok(response);
    }
}
