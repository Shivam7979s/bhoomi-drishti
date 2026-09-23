package com.bhoomidrishti.collaboration.service;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.dto.CreateSavedResearchRequest;
import com.bhoomidrishti.collaboration.dto.SavedResearchResponse;
import com.bhoomidrishti.collaboration.dto.UpdateSavedResearchRequest;
import com.bhoomidrishti.collaboration.entity.SavedResearch;
import com.bhoomidrishti.collaboration.repository.SavedResearchRepository;
import com.bhoomidrishti.common.PageResponse;
import com.bhoomidrishti.exception.ResearchDocumentNotFoundException;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.research.entity.ResearchDocument;
import com.bhoomidrishti.research.repository.ResearchDocumentRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SavedResearchService {

    private final SavedResearchRepository savedResearchRepository;
    private final ResearchDocumentRepository researchDocumentRepository;
    private final CollaborationSecurityService securityService;

    public SavedResearchService(
            SavedResearchRepository savedResearchRepository,
            ResearchDocumentRepository researchDocumentRepository,
            CollaborationSecurityService securityService) {
        this.savedResearchRepository = savedResearchRepository;
        this.researchDocumentRepository = researchDocumentRepository;
        this.securityService = securityService;
    }

    @Transactional(readOnly = true)
    public PageResponse<SavedResearchResponse> listSavedResearch(int page, int size, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));

        Page<SavedResearch> p = savedResearchRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        List<SavedResearchResponse> content = p.getContent().stream()
                .map(SavedResearchResponse::from)
                .toList();

        return new PageResponse<>(
                content,
                p.getNumber(),
                p.getSize(),
                p.getTotalElements(),
                p.getTotalPages(),
                p.isFirst(),
                p.isLast()
        );
    }

    @Transactional(readOnly = true)
    public SavedResearchResponse getSavedResearch(UUID id, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        SavedResearch sr = savedResearchRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Saved research not found"));

        return SavedResearchResponse.from(sr);
    }

    public SavedResearchResponse saveResearch(CreateSavedResearchRequest request, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);

        if (request.researchDocumentId() == null && request.documentChunkId() == null) {
            throw new IllegalArgumentException("At least one of researchDocumentId or documentChunkId must be provided");
        }

        ResearchDocument doc = null;
        if (request.researchDocumentId() != null) {
            doc = researchDocumentRepository.findById(request.researchDocumentId())
                    .orElseThrow(() -> new ResearchDocumentNotFoundException(request.researchDocumentId()));
        }

        SavedResearch sr = new SavedResearch(
                user,
                doc,
                request.documentChunkId(),
                request.title().trim(),
                request.notes(),
                request.tags()
        );

        sr = savedResearchRepository.save(sr);
        return SavedResearchResponse.from(sr);
    }

    public SavedResearchResponse updateSavedResearch(UUID id, UpdateSavedResearchRequest request, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        SavedResearch sr = savedResearchRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Saved research not found"));

        sr.setTitle(request.title().trim());
        sr.setNotes(request.notes());
        sr.setTags(request.tags());

        sr = savedResearchRepository.save(sr);
        return SavedResearchResponse.from(sr);
    }

    public void deleteSavedResearch(UUID id, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        SavedResearch sr = savedResearchRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Saved research not found"));

        savedResearchRepository.delete(sr);
    }
}
