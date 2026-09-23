package com.bhoomidrishti.collaboration.service;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.collaboration.dto.AddProjectMemberRequest;
import com.bhoomidrishti.collaboration.dto.CreateProjectRequest;
import com.bhoomidrishti.collaboration.dto.ProjectMemberResponse;
import com.bhoomidrishti.collaboration.dto.ProjectResponse;
import com.bhoomidrishti.collaboration.dto.UpdateProjectMemberRequest;
import com.bhoomidrishti.collaboration.dto.UpdateProjectRequest;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.entity.ProjectMember;
import com.bhoomidrishti.collaboration.entity.ProjectRole;
import com.bhoomidrishti.collaboration.entity.ProjectStatus;
import com.bhoomidrishti.collaboration.entity.ProjectVisibility;
import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.repository.ProjectCommentRepository;
import com.bhoomidrishti.collaboration.repository.ProjectLandRecordRepository;
import com.bhoomidrishti.collaboration.repository.ProjectMemberRepository;
import com.bhoomidrishti.collaboration.repository.ProjectRepository;
import com.bhoomidrishti.collaboration.repository.ProjectResearchDocumentRepository;
import com.bhoomidrishti.collaboration.repository.ProjectSharedDatasetRepository;
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
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;
    private final ProjectLandRecordRepository projectLandRecordRepository;
    private final ProjectResearchDocumentRepository projectResearchDocumentRepository;
    private final ProjectSharedDatasetRepository projectSharedDatasetRepository;
    private final ProjectCommentRepository projectCommentRepository;
    private final CollaborationSecurityService securityService;

    public ProjectService(
            ProjectRepository projectRepository,
            ProjectMemberRepository projectMemberRepository,
            WorkspaceRepository workspaceRepository,
            WorkspaceMemberRepository workspaceMemberRepository,
            UserRepository userRepository,
            ProjectLandRecordRepository projectLandRecordRepository,
            ProjectResearchDocumentRepository projectResearchDocumentRepository,
            ProjectSharedDatasetRepository projectSharedDatasetRepository,
            ProjectCommentRepository projectCommentRepository,
            CollaborationSecurityService securityService) {
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.workspaceRepository = workspaceRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
        this.userRepository = userRepository;
        this.projectLandRecordRepository = projectLandRecordRepository;
        this.projectResearchDocumentRepository = projectResearchDocumentRepository;
        this.projectSharedDatasetRepository = projectSharedDatasetRepository;
        this.projectCommentRepository = projectCommentRepository;
        this.securityService = securityService;
    }

    public ProjectResponse createProject(UUID workspaceId, CreateProjectRequest request, Authentication auth) {
        User creator = securityService.requireAuthenticatedUser(auth);
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        // Must be a workspace member or platform admin
        securityService.requireWorkspaceMember(workspace, creator);

        String slug = generateUniqueSlug(workspaceId, request.slug(), request.name());
        ProjectVisibility visibility = request.visibility() != null
                ? request.visibility()
                : ProjectVisibility.WORKSPACE_INHERITED;

        Project project = new Project(
                workspace,
                request.name(),
                slug,
                request.description(),
                visibility,
                creator
        );

        project = projectRepository.save(project);

        // Creator becomes LEAD
        ProjectMember leadMember = new ProjectMember(project, creator, ProjectRole.LEAD);
        projectMemberRepository.save(leadMember);

        return toResponse(project, creator, ProjectRole.LEAD, true);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProjectResponse> listWorkspaceProjects(
            UUID workspaceId, int page, int size, Authentication auth) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        Optional<User> currentUser = securityService.resolveCurrentUser(auth);
        securityService.checkCanViewWorkspace(workspace, currentUser.orElse(null));

        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Project> projectPage;
        if (currentUser.isEmpty()) {
            projectPage = projectRepository.findPublicProjects(workspaceId, pageable);
        } else if (securityService.isPlatformAdmin(currentUser.get())) {
            projectPage = projectRepository.findByWorkspaceId(workspaceId, pageable);
        } else {
            projectPage = projectRepository.findAccessibleProjects(workspaceId, currentUser.get().getId(), pageable);
        }

        List<ProjectResponse> content = projectPage.getContent().stream()
                .map(p -> toResponse(p, currentUser.orElse(null), null, currentUser.isPresent()))
                .toList();

        return new PageResponse<>(
                content,
                projectPage.getNumber(),
                projectPage.getSize(),
                projectPage.getTotalElements(),
                projectPage.getTotalPages(),
                projectPage.isFirst(),
                projectPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(UUID projectId, Authentication auth) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        Optional<User> currentUser = securityService.resolveCurrentUser(auth);
        securityService.checkCanViewProject(project, currentUser.orElse(null));

        return toResponse(project, currentUser.orElse(null), null, currentUser.isPresent());
    }

    public ProjectResponse updateProject(UUID projectId, UpdateProjectRequest request, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        securityService.checkCanManageProject(project, user);

        if (request.name() != null && !request.name().isBlank()) {
            project.setName(request.name().trim());
        }
        if (request.description() != null) {
            project.setDescription(request.description());
        }
        if (request.status() != null) {
            project.setStatus(request.status());
        }
        if (request.visibility() != null) {
            project.setVisibility(request.visibility());
        }

        project = projectRepository.save(project);
        return toResponse(project, user, null, true);
    }

    public void archiveProject(UUID projectId, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        securityService.checkCanManageProject(project, user);

        project.setStatus(ProjectStatus.ARCHIVED);
        projectRepository.save(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> listMembers(UUID projectId, Authentication auth) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        Optional<User> currentUser = securityService.resolveCurrentUser(auth);
        securityService.checkCanViewProject(project, currentUser.orElse(null));

        boolean includeEmail = currentUser.isPresent();
        return projectMemberRepository.findByProjectId(projectId).stream()
                .map(m -> ProjectMemberResponse.from(m, includeEmail))
                .toList();
    }

    public ProjectMemberResponse addMember(UUID projectId, AddProjectMemberRequest request, Authentication auth) {
        User currentUser = securityService.requireAuthenticatedUser(auth);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        securityService.checkCanManageProject(project, currentUser);

        // A project member MUST already be an active member of its parent workspace
        UUID workspaceId = project.getWorkspace().getId();
        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, request.userId())) {
            throw new IllegalArgumentException("User must be a member of the workspace before being added to a project");
        }

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, request.userId())) {
            throw new IllegalArgumentException("User is already a member of this project");
        }

        User targetUser = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ProjectMember member = new ProjectMember(project, targetUser, request.role());
        member = projectMemberRepository.save(member);

        return ProjectMemberResponse.from(member, true);
    }

    public ProjectMemberResponse updateMemberRole(
            UUID projectId, UUID targetUserId, UpdateProjectMemberRequest request, Authentication auth) {
        User currentUser = securityService.requireAuthenticatedUser(auth);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        securityService.checkCanManageProject(project, currentUser);

        ProjectMember targetMember = projectMemberRepository
                .findByProjectIdAndUserId(projectId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Project member not found"));

        targetMember.setRole(request.role());
        targetMember = projectMemberRepository.save(targetMember);

        return ProjectMemberResponse.from(targetMember, true);
    }

    public void removeMember(UUID projectId, UUID targetUserId, Authentication auth) {
        User currentUser = securityService.requireAuthenticatedUser(auth);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        boolean isSelf = currentUser.getId().equals(targetUserId);
        if (!isSelf) {
            securityService.checkCanManageProject(project, currentUser);
        }

        ProjectMember targetMember = projectMemberRepository
                .findByProjectIdAndUserId(projectId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Project member not found"));

        projectMemberRepository.delete(targetMember);
    }

    private ProjectResponse toResponse(
            Project project, User currentUser, ProjectRole explicitRole, boolean isCallerAuthenticated) {
        long memberCount = projectMemberRepository.findByProjectId(project.getId()).size();
        long landRecordCount = projectLandRecordRepository.countByProjectId(project.getId());
        long researchDocCount = projectResearchDocumentRepository.countByProjectId(project.getId());
        long datasetCount = projectSharedDatasetRepository.countByProjectId(project.getId());
        long commentCount = projectCommentRepository.countByProjectId(project.getId());

        ProjectRole role = explicitRole;
        if (role == null && currentUser != null) {
            role = projectMemberRepository.findByProjectIdAndUserId(project.getId(), currentUser.getId())
                    .map(ProjectMember::getRole)
                    .orElse(null);
        }

        return ProjectResponse.from(
                project,
                memberCount,
                landRecordCount,
                researchDocCount,
                datasetCount,
                commentCount,
                role,
                isCallerAuthenticated
        );
    }

    private String generateUniqueSlug(UUID workspaceId, String requestedSlug, String name) {
        String base = (requestedSlug != null && !requestedSlug.isBlank())
                ? requestedSlug
                : name;
        String slug = base.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (slug.isBlank()) {
            slug = "project";
        }
        if (slug.length() > 100) {
            slug = slug.substring(0, 100);
        }
        String candidate = slug;
        int counter = 1;
        while (projectRepository.existsByWorkspaceIdAndSlug(workspaceId, candidate)) {
            candidate = slug + "-" + counter++;
        }
        return candidate;
    }
}
