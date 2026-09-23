package com.bhoomidrishti.policy.controller;

import com.bhoomidrishti.knowledge.dto.KnowledgeSearchRequest;
import com.bhoomidrishti.knowledge.dto.KnowledgeSearchResponse;
import com.bhoomidrishti.policy.dto.LinkScenarioEvidenceRequest;
import com.bhoomidrishti.policy.dto.ScenarioEvidenceResponse;
import com.bhoomidrishti.policy.service.ScenarioEvidenceService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API for policy scenario evidence linking and provenance verification.
 */
@RestController
@RequestMapping("/api/scenarios/{scenarioId}/evidence")
public class ScenarioEvidenceController {

    private final ScenarioEvidenceService evidenceService;

    public ScenarioEvidenceController(ScenarioEvidenceService evidenceService) {
        this.evidenceService = evidenceService;
    }

    /**
     * Links a research document or specific chunk as evidence to a policy scenario.
     */
    @PostMapping
    public ResponseEntity<ScenarioEvidenceResponse> linkEvidence(
            @PathVariable UUID scenarioId,
            @Valid @RequestBody LinkScenarioEvidenceRequest request,
            Authentication auth
    ) {
        ScenarioEvidenceResponse response = evidenceService.linkEvidence(scenarioId, request, auth);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Retrieves all evidence linked to a policy scenario.
     */
    @GetMapping
    public ResponseEntity<List<ScenarioEvidenceResponse>> getScenarioEvidence(
            @PathVariable UUID scenarioId,
            Authentication auth
    ) {
        List<ScenarioEvidenceResponse> evidence = evidenceService.getScenarioEvidence(scenarioId, auth);
        return ResponseEntity.ok(evidence);
    }

    /**
     * Removes an evidence link from a policy scenario.
     */
    @DeleteMapping("/{evidenceId}")
    public ResponseEntity<Void> unlinkEvidence(
            @PathVariable UUID scenarioId,
            @PathVariable UUID evidenceId,
            Authentication auth
    ) {
        evidenceService.unlinkEvidence(scenarioId, evidenceId, auth);
        return ResponseEntity.noContent().build();
    }

    /**
     * Searches knowledge base for candidate evidence items for this scenario.
     * Does NOT persist evidence records.
     */
    @PostMapping("/search")
    public ResponseEntity<KnowledgeSearchResponse> searchEvidenceCandidates(
            @PathVariable UUID scenarioId,
            @Valid @RequestBody KnowledgeSearchRequest request,
            Authentication auth
    ) {
        KnowledgeSearchResponse response = evidenceService.searchEvidenceCandidates(scenarioId, request, auth);
        return ResponseEntity.ok(response);
    }
}
