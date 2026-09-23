package com.bhoomidrishti.collaboration.controller;

import com.bhoomidrishti.collaboration.dto.CreateSharedDatasetRequest;
import com.bhoomidrishti.collaboration.dto.SharedDatasetResponse;
import com.bhoomidrishti.collaboration.dto.UpdateSharedDatasetRequest;
import com.bhoomidrishti.collaboration.service.SharedDatasetService;
import com.bhoomidrishti.common.PageResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
public class SharedDatasetController {

    private final SharedDatasetService datasetService;

    public SharedDatasetController(SharedDatasetService datasetService) {
        this.datasetService = datasetService;
    }

    @GetMapping("/api/workspaces/{workspaceId}/datasets")
    public PageResponse<SharedDatasetResponse> listWorkspaceDatasets(
            @PathVariable UUID workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        return datasetService.listWorkspaceDatasets(workspaceId, page, size, auth);
    }

    @PostMapping("/api/workspaces/{workspaceId}/datasets")
    @ResponseStatus(HttpStatus.CREATED)
    public SharedDatasetResponse createDataset(
            @PathVariable UUID workspaceId,
            @Valid @RequestBody CreateSharedDatasetRequest request,
            Authentication auth) {
        return datasetService.createDataset(workspaceId, request, auth);
    }

    @GetMapping("/api/datasets/{id}")
    public SharedDatasetResponse getDataset(
            @PathVariable UUID id, Authentication auth) {
        return datasetService.getDataset(id, auth);
    }

    @PutMapping("/api/datasets/{id}")
    public SharedDatasetResponse updateDataset(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSharedDatasetRequest request,
            Authentication auth) {
        return datasetService.updateDataset(id, request, auth);
    }

    @DeleteMapping("/api/datasets/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDataset(
            @PathVariable UUID id, Authentication auth) {
        datasetService.deleteDataset(id, auth);
    }
}
