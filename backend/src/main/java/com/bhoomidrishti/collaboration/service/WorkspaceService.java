package com.bhoomidrishti.collaboration.service;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.collaboration.dto.AddWorkspaceMemberRequest;
import com.bhoomidrishti.collaboration.dto.CreateWorkspaceRequest;
import com.bhoomidrishti.collaboration.dto.TransferOwnershipRequest;
import com.bhoomidrishti.collaboration.dto.UpdateWorkspaceMemberRequest;
import com.bhoomidrishti.collaboration.dto.UpdateWorkspaceRequest;
import com.bhoomidrishti.collaboration.dto.WorkspaceMemberResponse;
import com.bhoomidrishti.collaboration.dto.WorkspaceResponse;
import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.entity.WorkspaceMember;
import com.bhoomidrishti.collaboration.entity.WorkspaceRole;
import com.bhoomidrishti.collaboration.entity.WorkspaceStatus;
import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
import com.bhoomidrishti.collaboration.repository.ProjectMemberRepository;
import com.bhoomidrishti.collaboration.repository.ProjectRepository;
import com.bhoomidrishti.collaboration.repository.WorkspaceMemberRepository;
import com.bhoomidrishti.collaboration.repository.WorkspaceRepository;
import com.bhoomidrishti.common.PageResponse;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final CollaborationSecurityService securityService;

    public WorkspaceService(
            WorkspaceRepository workspaceRepository,
            WorkspaceMemberRepository workspaceMemberRepository,
            ProjectRepository projectRepository,
            ProjectMemberRepository projectMemberRepository,
            UserRepository userRepository,
            CollaborationSecurityService securityService) {
        this.workspaceRepository = workspaceRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userRepository = userRepository;
        this.securityService = securityService;
    }

    public WorkspaceResponse createWorkspace(CreateWorkspaceRequest request, Authentication auth) {
        User creator = securityService.requireAuthenticatedUser(auth);

        String slug = generateUniqueSlug(request.slug(), request.name());
        WorkspaceVisibility visibility = request.visibility() != null
                ? request.visibility()
                : WorkspaceVisibility.PRIVATE;

        Workspace workspace = new Workspace(
                request.name(),
                slug,
                request.description(),
                request.institution(),
                visibility,
                creator
        );

        workspace = workspaceRepository.save(workspace);

        // Creator becomes OWNER
        WorkspaceMember ownerMember = new WorkspaceMember(workspace, creator, WorkspaceRole.OWNER);
        workspaceMemberRepository.save(ownerMember);

        return WorkspaceResponse.from(workspace, 1L, 0L, WorkspaceRole.OWNER, true);
    }

    @Transactional(readOnly = true)
    public PageResponse<WorkspaceResponse> listWorkspaces(
            Boolean memberOnly, int page, int size, Authentication auth) {
        Optional<User> currentUser = securityService.resolveCurrentUser(auth);
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Workspace> workspacePage;
        if (currentUser.isEmpty()) {
            workspacePage = workspaceRepository.findByVisibilityAndStatus(
                    WorkspaceVisibility.PUBLIC, WorkspaceStatus.ACTIVE, pageable);
        } else if (Boolean.TRUE.equals(memberOnly)) {
            workspacePage = workspaceRepository.findMemberWorkspaces(
                    currentUser.get().getId(), WorkspaceStatus.ACTIVE, pageable);
        } else if (securityService.isPlatformAdmin(currentUser.get())) {
            workspacePage = workspaceRepository.findAllByStatus(WorkspaceStatus.ACTIVE, pageable);
        } else {
            workspacePage = workspaceRepository.findAccessibleWorkspaces(
                    currentUser.get().getId(), WorkspaceStatus.ACTIVE, pageable);
        }

        List<WorkspaceResponse> content = workspacePage.getContent().stream().map(w -> {
            long memberCount = workspaceMemberRepository.findByWorkspaceId(w.getId()).size();
            long projectCount = projectRepository.countByWorkspaceId(w.getId());
            WorkspaceRole role = currentUser
                    .flatMap(u -> workspaceMemberRepository.findByWorkspaceIdAndUserId(w.getId(), u.getId()))
                    .map(WorkspaceMember::getRole)
                    .orElse(null);
            return WorkspaceResponse.from(w, memberCount, projectCount, role, currentUser.isPresent());
        }).toList();

        return new PageResponse<>(
                content,
                workspacePage.getNumber(),
                workspacePage.getSize(),
                workspacePage.getTotalElements(),
                workspacePage.getTotalPages(),
                workspacePage.isFirst(),
                workspacePage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public WorkspaceResponse getWorkspace(String idOrSlug, Authentication auth) {
        Workspace workspace = resolveWorkspace(idOrSlug);
        Optional<User> currentUser = securityService.resolveCurrentUser(auth);

        securityService.checkCanViewWorkspace(workspace, currentUser.orElse(null));

        long memberCount = workspaceMemberRepository.findByWorkspaceId(workspace.getId()).size();
        long projectCount = projectRepository.countByWorkspaceId(workspace.getId());
        WorkspaceRole role = currentUser
                .flatMap(u -> workspaceMemberRepository.findByWorkspaceIdAndUserId(workspace.getId(), u.getId()))
                .map(WorkspaceMember::getRole)
                .orElse(null);

        return WorkspaceResponse.from(workspace, memberCount, projectCount, role, currentUser.isPresent());
    }

    public WorkspaceResponse updateWorkspace(UUID id, UpdateWorkspaceRequest request, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        Workspace workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        securityService.checkCanManageWorkspace(workspace, user);

        if (request.name() != null && !request.name().isBlank()) {
            workspace.setName(request.name().trim());
        }
        if (request.description() != null) {
            workspace.setDescription(request.description());
        }
        if (request.institution() != null) {
            workspace.setInstitution(request.institution());
        }
        if (request.visibility() != null) {
            workspace.setVisibility(request.visibility());
        }
        if (request.status() != null) {
            workspace.setStatus(request.status());
        }

        workspace = workspaceRepository.save(workspace);

        long memberCount = workspaceMemberRepository.findByWorkspaceId(workspace.getId()).size();
        long projectCount = projectRepository.countByWorkspaceId(workspace.getId());
        WorkspaceRole role = securityService.findWorkspaceMember(workspace, user)
                .map(WorkspaceMember::getRole)
                .orElse(WorkspaceRole.ADMIN);

        return WorkspaceResponse.from(workspace, memberCount, projectCount, role, true);
    }

    public void archiveWorkspace(UUID id, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        Workspace workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        securityService.checkIsWorkspaceOwner(workspace, user);

        workspace.setStatus(WorkspaceStatus.ARCHIVED);
        workspaceRepository.save(workspace);
    }

    public WorkspaceResponse transferOwnership(UUID workspaceId, TransferOwnershipRequest request, Authentication auth) {
        User currentUser = securityService.requireAuthenticatedUser(auth);
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        // Only current owner or platform admin can transfer ownership
        securityService.checkIsWorkspaceOwner(workspace, currentUser);

        if (request.newOwnerUserId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("User is already the owner of this workspace");
        }

        // Target must already be an active member of this workspace
        WorkspaceMember targetMember = workspaceMemberRepository
                .findByWorkspaceIdAndUserId(workspaceId, request.newOwnerUserId())
                .orElseThrow(() -> new IllegalArgumentException("Target user must already be a member of this workspace"));

        // Old owner becomes ADMIN
        WorkspaceMember currentOwnerMember = workspaceMemberRepository
                .findByWorkspaceIdAndUserId(workspaceId, currentUser.getId())
                .orElse(null);

        if (currentOwnerMember != null && currentOwnerMember.getRole() == WorkspaceRole.OWNER) {
            currentOwnerMember.setRole(WorkspaceRole.ADMIN);
            workspaceMemberRepository.save(currentOwnerMember);
        }

        // Target becomes OWNER
        targetMember.setRole(WorkspaceRole.OWNER);
        workspaceMemberRepository.save(targetMember);

        long memberCount = workspaceMemberRepository.findByWorkspaceId(workspace.getId()).size();
        long projectCount = projectRepository.countByWorkspaceId(workspace.getId());

        return WorkspaceResponse.from(workspace, memberCount, projectCount, WorkspaceRole.ADMIN, true);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceMemberResponse> listMembers(UUID workspaceId, Authentication auth) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        Optional<User> currentUser = securityService.resolveCurrentUser(auth);
        securityService.checkCanViewWorkspace(workspace, currentUser.orElse(null));

        boolean includeEmail = currentUser.isPresent();
        return workspaceMemberRepository.findByWorkspaceId(workspaceId).stream()
                .map(m -> WorkspaceMemberResponse.from(m, includeEmail))
                .toList();
    }

    public WorkspaceMemberResponse addMember(UUID workspaceId, AddWorkspaceMemberRequest request, Authentication auth) {
        User currentUser = securityService.requireAuthenticatedUser(auth);
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        securityService.checkCanManageWorkspace(workspace, currentUser);

        if (request.role() == WorkspaceRole.OWNER) {
            throw new IllegalArgumentException("Cannot assign OWNER role via addMember. Use transfer-ownership instead.");
        }

        if (workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, request.userId())) {
            throw new IllegalArgumentException("User is already a member of this workspace");
        }

        User targetUser = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        WorkspaceMember member = new WorkspaceMember(workspace, targetUser, request.role());
        member = workspaceMemberRepository.save(member);

        return WorkspaceMemberResponse.from(member, true);
    }

    public WorkspaceMemberResponse updateMemberRole(
            UUID workspaceId, UUID targetUserId, UpdateWorkspaceMemberRequest request, Authentication auth) {
        User currentUser = securityService.requireAuthenticatedUser(auth);
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        securityService.checkCanManageWorkspace(workspace, currentUser);

        if (request.role() == WorkspaceRole.OWNER) {
            throw new IllegalArgumentException("Cannot promote to OWNER via updateMemberRole. Use transfer-ownership instead.");
        }

        WorkspaceMember targetMember = workspaceMemberRepository
                .findByWorkspaceIdAndUserId(workspaceId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace member not found"));

        if (targetMember.getRole() == WorkspaceRole.OWNER) {
            throw new IllegalArgumentException("Cannot demote the sole workspace OWNER. Transfer ownership first.");
        }

        targetMember.setRole(request.role());
        targetMember = workspaceMemberRepository.save(targetMember);

        return WorkspaceMemberResponse.from(targetMember, true);
    }

    public void removeMember(UUID workspaceId, UUID targetUserId, Authentication auth) {
        User currentUser = securityService.requireAuthenticatedUser(auth);
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        boolean isSelf = currentUser.getId().equals(targetUserId);
        if (!isSelf) {
            securityService.checkCanManageWorkspace(workspace, currentUser);
        }

        WorkspaceMember targetMember = workspaceMemberRepository
                .findByWorkspaceIdAndUserId(workspaceId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace member not found"));

        if (targetMember.getRole() == WorkspaceRole.OWNER) {
            throw new IllegalArgumentException("Cannot remove the sole workspace OWNER. Transfer ownership first.");
        }

        // Clean up project memberships for this user in this workspace
        projectRepository.findByWorkspaceId(workspaceId, Pageable.unpaged()).forEach(project -> {
            projectMemberRepository.deleteByProjectIdAndUserId(project.getId(), targetUserId);
        });

        workspaceMemberRepository.delete(targetMember);
    }

    public Workspace resolveWorkspace(String idOrSlug) {
        try {
            UUID id = UUID.fromString(idOrSlug);
            return workspaceRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        } catch (IllegalArgumentException e) {
            return workspaceRepository.findBySlug(idOrSlug)
                    .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        }
    }

    private String generateUniqueSlug(String requestedSlug, String name) {
        String base = (requestedSlug != null && !requestedSlug.isBlank())
                ? requestedSlug
                : name;
        String slug = base.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (slug.isBlank()) {
            slug = "workspace";
        }
        if (slug.length() > 100) {
            slug = slug.substring(0, 100);
        }
        String candidate = slug;
        int counter = 1;
        while (workspaceRepository.existsBySlug(candidate)) {
            candidate = slug + "-" + counter++;
        }
        return candidate;
    }
}
