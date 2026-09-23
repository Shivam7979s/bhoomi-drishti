package com.bhoomidrishti.collaboration.controller;

import com.bhoomidrishti.collaboration.dto.CreateSavedResearchRequest;
import com.bhoomidrishti.collaboration.dto.SavedResearchResponse;
import com.bhoomidrishti.collaboration.dto.UpdateSavedResearchRequest;
import com.bhoomidrishti.collaboration.service.SavedResearchService;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/saved-research")
@Validated
public class SavedResearchController {

    private final SavedResearchService savedResearchService;

    public SavedResearchController(SavedResearchService savedResearchService) {
        this.savedResearchService = savedResearchService;
    }

    @GetMapping
    public PageResponse<SavedResearchResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        return savedResearchService.listSavedResearch(page, size, auth);
    }

    @GetMapping("/{id}")
    public SavedResearchResponse getById(
            @PathVariable UUID id, Authentication auth) {
        return savedResearchService.getSavedResearch(id, auth);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SavedResearchResponse create(
            @Valid @RequestBody CreateSavedResearchRequest request, Authentication auth) {
        return savedResearchService.saveResearch(request, auth);
    }

    @PutMapping("/{id}")
    public SavedResearchResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSavedResearchRequest request,
            Authentication auth) {
        return savedResearchService.updateSavedResearch(id, request, auth);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID id, Authentication auth) {
        savedResearchService.deleteSavedResearch(id, auth);
    }
}
