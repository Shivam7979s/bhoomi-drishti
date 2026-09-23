package com.bhoomidrishti.collaboration.controller;

import com.bhoomidrishti.collaboration.dto.LinkLandRecordRequest;
import com.bhoomidrishti.collaboration.dto.LinkResearchDocumentRequest;
import com.bhoomidrishti.collaboration.dto.ProjectLandRecordResponse;
import com.bhoomidrishti.collaboration.dto.ProjectResearchDocumentResponse;
import com.bhoomidrishti.collaboration.dto.ProjectSharedDatasetResponse;
import com.bhoomidrishti.collaboration.service.ProjectLinkageService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
public class ProjectLinkageController {

    private final ProjectLinkageService linkageService;

    public ProjectLinkageController(ProjectLinkageService linkageService) {
        this.linkageService = linkageService;
    }

    // --- Land Records ---

    @GetMapping("/api/projects/{projectId}/land-records")
    public List<ProjectLandRecordResponse> listLandRecords(
            @PathVariable UUID projectId, Authentication auth) {
        return linkageService.listLandRecords(projectId, auth);
    }

    @PostMapping("/api/projects/{projectId}/land-records")
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectLandRecordResponse linkLandRecord(
            @PathVariable UUID projectId,
            @Valid @RequestBody LinkLandRecordRequest request,
            Authentication auth) {
        return linkageService.linkLandRecord(projectId, request, auth);
    }

    @DeleteMapping("/api/projects/{projectId}/land-records/{landRecordId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlinkLandRecord(
            @PathVariable UUID projectId,
            @PathVariable UUID landRecordId,
            Authentication auth) {
        linkageService.unlinkLandRecord(projectId, landRecordId, auth);
    }

    // --- Research Documents ---

    @GetMapping("/api/projects/{projectId}/research-documents")
    public List<ProjectResearchDocumentResponse> listResearchDocuments(
            @PathVariable UUID projectId, Authentication auth) {
        return linkageService.listResearchDocuments(projectId, auth);
    }

    @PostMapping("/api/projects/{projectId}/research-documents")
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResearchDocumentResponse linkResearchDocument(
            @PathVariable UUID projectId,
            @Valid @RequestBody LinkResearchDocumentRequest request,
            Authentication auth) {
        return linkageService.linkResearchDocument(projectId, request, auth);
    }

    @DeleteMapping("/api/projects/{projectId}/research-documents/{researchDocumentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlinkResearchDocument(
            @PathVariable UUID projectId,
            @PathVariable UUID researchDocumentId,
            Authentication auth) {
        linkageService.unlinkResearchDocument(projectId, researchDocumentId, auth);
    }

    // --- Shared Datasets ---

    @GetMapping("/api/projects/{projectId}/datasets")
    public List<ProjectSharedDatasetResponse> listDatasets(
            @PathVariable UUID projectId, Authentication auth) {
        return linkageService.listDatasets(projectId, auth);
    }

    @PostMapping("/api/projects/{projectId}/datasets/{datasetId}")
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectSharedDatasetResponse linkDataset(
            @PathVariable UUID projectId,
            @PathVariable UUID datasetId,
            Authentication auth) {
        return linkageService.linkDataset(projectId, datasetId, auth);
    }

    @DeleteMapping("/api/projects/{projectId}/datasets/{datasetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlinkDataset(
            @PathVariable UUID projectId,
            @PathVariable UUID datasetId,
            Authentication auth) {
        linkageService.unlinkDataset(projectId, datasetId, auth);
    }
}
