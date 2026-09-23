package com.bhoomidrishti.collaboration.service;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.dto.CreateSharedDatasetRequest;
import com.bhoomidrishti.collaboration.dto.SharedDatasetResponse;
import com.bhoomidrishti.collaboration.dto.UpdateSharedDatasetRequest;
import com.bhoomidrishti.collaboration.entity.SharedDataset;
import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.entity.WorkspaceMember;
import com.bhoomidrishti.collaboration.entity.WorkspaceRole;
import com.bhoomidrishti.collaboration.repository.SharedDatasetRepository;
import com.bhoomidrishti.collaboration.repository.WorkspaceRepository;
import com.bhoomidrishti.common.PageResponse;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SharedDatasetService {

    private final SharedDatasetRepository sharedDatasetRepository;
    private final WorkspaceRepository workspaceRepository;
    private final CollaborationSecurityService securityService;

    public SharedDatasetService(
            SharedDatasetRepository sharedDatasetRepository,
            WorkspaceRepository workspaceRepository,
            CollaborationSecurityService securityService) {
        this.sharedDatasetRepository = sharedDatasetRepository;
        this.workspaceRepository = workspaceRepository;
        this.securityService = securityService;
    }

    @Transactional(readOnly = true)
    public PageResponse<SharedDatasetResponse> listWorkspaceDatasets(
            UUID workspaceId, int page, int size, Authentication auth) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        Optional<User> currentUser = securityService.resolveCurrentUser(auth);
        securityService.checkCanViewWorkspace(workspace, currentUser.orElse(null));

        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<SharedDataset> p = sharedDatasetRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId, pageable);

        List<SharedDatasetResponse> content = p.getContent().stream()
                .map(ds -> SharedDatasetResponse.from(ds, currentUser.isPresent()))
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
    public SharedDatasetResponse getDataset(UUID id, Authentication auth) {
        SharedDataset dataset = sharedDatasetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shared dataset not found"));

        Optional<User> currentUser = securityService.resolveCurrentUser(auth);
        securityService.checkCanViewWorkspace(dataset.getWorkspace(), currentUser.orElse(null));

        return SharedDatasetResponse.from(dataset, currentUser.isPresent());
    }

    public SharedDatasetResponse createDataset(
            UUID workspaceId, CreateSharedDatasetRequest request, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        securityService.requireWorkspaceMember(workspace, user);

        SharedDataset dataset = new SharedDataset(
                workspace,
                request.title().trim(),
                request.description(),
                request.format(),
                request.sourceUrl(),
                request.spatialCoverage(),
                request.temporalCoverage(),
                request.license(),
                request.recordCount(),
                request.fileSizeBytes(),
                user
        );

        dataset = sharedDatasetRepository.save(dataset);
        return SharedDatasetResponse.from(dataset, true);
    }

    public SharedDatasetResponse updateDataset(
            UUID id, UpdateSharedDatasetRequest request, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        SharedDataset dataset = sharedDatasetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shared dataset not found"));

        checkCanManageDataset(dataset, user);

        if (request.title() != null && !request.title().isBlank()) {
            dataset.setTitle(request.title().trim());
        }
        if (request.description() != null) {
            dataset.setDescription(request.description());
        }
        if (request.format() != null) {
            dataset.setFormat(request.format());
        }
        if (request.sourceUrl() != null) {
            dataset.setSourceUrl(request.sourceUrl());
        }
        if (request.spatialCoverage() != null) {
            dataset.setSpatialCoverage(request.spatialCoverage());
        }
        if (request.temporalCoverage() != null) {
            dataset.setTemporalCoverage(request.temporalCoverage());
        }
        if (request.license() != null) {
            dataset.setLicense(request.license());
        }
        if (request.recordCount() != null) {
            dataset.setRecordCount(request.recordCount());
        }
        if (request.fileSizeBytes() != null) {
            dataset.setFileSizeBytes(request.fileSizeBytes());
        }

        dataset = sharedDatasetRepository.save(dataset);
        return SharedDatasetResponse.from(dataset, true);
    }

    public void deleteDataset(UUID id, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        SharedDataset dataset = sharedDatasetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shared dataset not found"));

        checkCanManageDataset(dataset, user);

        sharedDatasetRepository.delete(dataset);
    }

    private void checkCanManageDataset(SharedDataset dataset, User user) {
        if (securityService.isPlatformAdmin(user)) {
            return;
        }
        if (dataset.getCreatedBy() != null && dataset.getCreatedBy().getId().equals(user.getId())) {
            return;
        }
        Optional<WorkspaceMember> wsMember = securityService.findWorkspaceMember(dataset.getWorkspace(), user);
        if (wsMember.isPresent() && (wsMember.get().getRole() == WorkspaceRole.OWNER || wsMember.get().getRole() == WorkspaceRole.ADMIN)) {
            return;
        }
        throw new AccessDeniedException("Insufficient permissions to modify this dataset");
    }
}
