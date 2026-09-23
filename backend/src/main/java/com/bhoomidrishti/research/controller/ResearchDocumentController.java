package com.bhoomidrishti.research.controller;

import com.bhoomidrishti.common.PageResponse;
import com.bhoomidrishti.landrecord.dto.LandRecordResponse;
import com.bhoomidrishti.research.dto.CreateResearchDocumentRequest;
import com.bhoomidrishti.research.dto.ResearchDocumentResponse;
import com.bhoomidrishti.research.dto.UpdateResearchDocumentRequest;
import com.bhoomidrishti.research.service.ResearchDocumentService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
public class ResearchDocumentController {

    private final ResearchDocumentService service;

    public ResearchDocumentController(ResearchDocumentService service) {
        this.service = service;
    }

    @GetMapping("/api/research-documents")
    public PageResponse<ResearchDocumentResponse> list(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String documentType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String organization,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        return service.list(title, documentType, status, organization, author, language,
                startDate, endDate, search, page, size, auth);
    }

    @GetMapping("/api/research-documents/{id}")
    public ResearchDocumentResponse getById(@PathVariable UUID id, Authentication auth) {
        return service.getById(id, auth);
    }

    @PostMapping("/api/research-documents")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'ACADEMIA', 'GOVERNMENT_OFFICIAL', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ResearchDocumentResponse create(
            @Valid @RequestBody CreateResearchDocumentRequest request,
            Authentication auth) {
        return service.create(request, auth);
    }

    @PutMapping("/api/research-documents/{id}")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'ACADEMIA', 'GOVERNMENT_OFFICIAL', 'ADMIN')")
    public ResearchDocumentResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateResearchDocumentRequest request,
            Authentication auth) {
        return service.update(id, request, auth);
    }

    @DeleteMapping("/api/research-documents/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, Authentication auth) {
        service.delete(id, auth);
    }

    @PostMapping("/api/research-documents/{documentId}/land-records/{landRecordId}")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'ACADEMIA', 'GOVERNMENT_OFFICIAL', 'ADMIN')")
    public ResearchDocumentResponse linkLandRecord(
            @PathVariable UUID documentId,
            @PathVariable UUID landRecordId,
            Authentication auth) {
        return service.linkLandRecord(documentId, landRecordId, auth);
    }

    @DeleteMapping("/api/research-documents/{documentId}/land-records/{landRecordId}")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'ACADEMIA', 'GOVERNMENT_OFFICIAL', 'ADMIN')")
    public ResearchDocumentResponse unlinkLandRecord(
            @PathVariable UUID documentId,
            @PathVariable UUID landRecordId,
            Authentication auth) {
        return service.unlinkLandRecord(documentId, landRecordId, auth);
    }

    @GetMapping("/api/research-documents/{documentId}/land-records")
    public List<LandRecordResponse> getLinkedLandRecords(
            @PathVariable UUID documentId,
            Authentication auth) {
        return service.getLinkedLandRecords(documentId, auth);
    }

    @GetMapping("/api/land-records/{landRecordId}/research-documents")
    public PageResponse<ResearchDocumentResponse> getLinkedResearchDocuments(
            @PathVariable UUID landRecordId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        return service.getLinkedResearchDocuments(landRecordId, page, size, auth);
    }
}
