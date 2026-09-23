package com.bhoomidrishti.knowledge.controller;

import com.bhoomidrishti.knowledge.dto.DocumentProcessingStatusResponse;
import com.bhoomidrishti.knowledge.dto.IngestDocumentResponse;
import com.bhoomidrishti.knowledge.dto.KnowledgeSearchRequest;
import com.bhoomidrishti.knowledge.dto.KnowledgeSearchResponse;
import com.bhoomidrishti.knowledge.service.KnowledgeService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class KnowledgeController {

    private final KnowledgeService service;

    public KnowledgeController(KnowledgeService service) {
        this.service = service;
    }

    /**
     * Semantic Knowledge Search endpoint:
     * Open to all users (including unauthenticated guests).
     * Strictly filters out non-published documents for public callers.
     */
    @PostMapping("/api/knowledge/search")
    public ResponseEntity<KnowledgeSearchResponse> search(
            @Valid @RequestBody KnowledgeSearchRequest request,
            Authentication auth) {
        return ResponseEntity.ok(service.search(request, auth));
    }

    /**
     * Ingests a research document into the AI Knowledge & Evidence layer.
     * Restricted to authenticated RESEARCHER, ACADEMIA, GOVERNMENT_OFFICIAL, and ADMIN.
     */
    @PostMapping("/api/research-documents/{id}/ingest")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'ACADEMIA', 'GOVERNMENT_OFFICIAL', 'ADMIN')")
    public ResponseEntity<IngestDocumentResponse> triggerIngest(
            @PathVariable UUID id,
            Authentication auth) {
        return ResponseEntity.accepted().body(service.triggerIngest(id, auth));
    }

    /**
     * Retrieves the ingestion and processing status for a research document.
     * Public callers may only inspect status for PUBLISHED documents.
     */
    @GetMapping("/api/research-documents/{id}/processing-status")
    public ResponseEntity<DocumentProcessingStatusResponse> getProcessingStatus(
            @PathVariable UUID id,
            Authentication auth) {
        return ResponseEntity.ok(service.getProcessingStatus(id, auth));
    }
}
