package com.bhoomidrishti.collaboration.service;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.common.EmailNormalizer;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.entity.ProjectComment;
import com.bhoomidrishti.collaboration.entity.ProjectMember;
import com.bhoomidrishti.collaboration.entity.ProjectRole;
import com.bhoomidrishti.collaboration.entity.ProjectVisibility;
import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.entity.WorkspaceMember;
import com.bhoomidrishti.collaboration.entity.WorkspaceRole;
import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
import com.bhoomidrishti.collaboration.repository.ProjectMemberRepository;
import com.bhoomidrishti.collaboration.repository.WorkspaceMemberRepository;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class CollaborationSecurityService {

    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final ProjectMemberRepository projectMemberRepository;

    public CollaborationSecurityService(
            UserRepository userRepository,
            WorkspaceMemberRepository workspaceMemberRepository,
            ProjectMemberRepository projectMemberRepository) {
        this.userRepository = userRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
        this.projectMemberRepository = projectMemberRepository;
    }

    public Optional<User> resolveCurrentUser(Authentication auth) {
        if (auth == null) {
            auth = SecurityContextHolder.getContext().getAuthentication();
        }
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        if (auth.getPrincipal() instanceof User user) {
            return Optional.of(user);
        }
        if (auth.getPrincipal() instanceof UserDetails userDetails) {
            return userRepository.findByEmail(EmailNormalizer.normalize(userDetails.getUsername()));
        }
        if (auth.getName() != null && !auth.getName().equalsIgnoreCase("anonymousUser")) {
            return userRepository.findByEmail(EmailNormalizer.normalize(auth.getName()));
        }
        return Optional.empty();
    }

    public User requireAuthenticatedUser(Authentication auth) {
        return resolveCurrentUser(auth)
                .orElseThrow(() -> new AccessDeniedException("Authentication required"));
    }

    public boolean isPlatformAdmin(User user) {
        return user != null && user.getRole() == Role.ADMIN;
    }

    public Optional<WorkspaceMember> findWorkspaceMember(Workspace workspace, User user) {
        if (user == null || workspace == null) {
            return Optional.empty();
        }
        return workspaceMemberRepository.findByWorkspaceIdAndUserId(workspace.getId(), user.getId());
    }

    public Optional<ProjectMember> findProjectMember(Project project, User user) {
        if (user == null || project == null) {
            return Optional.empty();
        }
        return projectMemberRepository.findByProjectIdAndUserId(project.getId(), user.getId());
    }

    public boolean canViewWorkspace(Workspace workspace, User user) {
        if (workspace == null) {
            return false;
        }
        if (workspace.getVisibility() == WorkspaceVisibility.PUBLIC) {
            return true;
        }
        if (user == null) {
            return false;
        }
        if (isPlatformAdmin(user)) {
            return true;
        }
        return findWorkspaceMember(workspace, user).isPresent();
    }

    public void checkCanViewWorkspace(Workspace workspace, User user) {
        if (!canViewWorkspace(workspace, user)) {
            throw new ResourceNotFoundException("Workspace not found");
        }
    }

    public WorkspaceMember requireWorkspaceMember(Workspace workspace, User user) {
        if (user == null) {
            throw new ResourceNotFoundException("Workspace not found");
        }
        if (isPlatformAdmin(user)) {
            return findWorkspaceMember(workspace, user)
                    .orElseGet(() -> new WorkspaceMember(workspace, user, WorkspaceRole.ADMIN));
        }
        return findWorkspaceMember(workspace, user)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
    }

    public void checkCanManageWorkspace(Workspace workspace, User user) {
        if (user == null) {
            throw new ResourceNotFoundException("Workspace not found");
        }
        if (isPlatformAdmin(user)) {
            return;
        }
        WorkspaceMember member = findWorkspaceMember(workspace, user)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        if (member.getRole() != WorkspaceRole.OWNER && member.getRole() != WorkspaceRole.ADMIN) {
            throw new AccessDeniedException("Only workspace OWNER or ADMIN can perform this operation");
        }
    }

    public void checkIsWorkspaceOwner(Workspace workspace, User user) {
        if (user == null) {
            throw new ResourceNotFoundException("Workspace not found");
        }
        if (isPlatformAdmin(user)) {
            return;
        }
        WorkspaceMember member = findWorkspaceMember(workspace, user)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        if (member.getRole() != WorkspaceRole.OWNER) {
            throw new AccessDeniedException("Only workspace OWNER can perform this operation");
        }
    }

    public boolean canViewProject(Project project, User user) {
        if (project == null) {
            return false;
        }
        if (project.getVisibility() == ProjectVisibility.PUBLIC) {
            return true;
        }
        if (project.getVisibility() == ProjectVisibility.WORKSPACE_INHERITED) {
            return canViewWorkspace(project.getWorkspace(), user);
        }
        // PRIVATE_TO_PROJECT_MEMBERS
        if (user == null) {
            return false;
        }
        if (isPlatformAdmin(user)) {
            return true;
        }
        Optional<WorkspaceMember> wsMember = findWorkspaceMember(project.getWorkspace(), user);
        if (wsMember.isPresent() && (wsMember.get().getRole() == WorkspaceRole.OWNER
                || wsMember.get().getRole() == WorkspaceRole.ADMIN)) {
            return true;
        }
        return findProjectMember(project, user).isPresent();
    }

    public void checkCanViewProject(Project project, User user) {
        if (!canViewProject(project, user)) {
            throw new ResourceNotFoundException("Project not found");
        }
    }

    public void checkCanManageProject(Project project, User user) {
        if (user == null) {
            throw new ResourceNotFoundException("Project not found");
        }
        if (isPlatformAdmin(user)) {
            return;
        }
        // Workspace OWNER/ADMIN has management over all projects
        Optional<WorkspaceMember> wsMember = findWorkspaceMember(project.getWorkspace(), user);
        if (wsMember.isPresent() && (wsMember.get().getRole() == WorkspaceRole.OWNER
                || wsMember.get().getRole() == WorkspaceRole.ADMIN)) {
            return;
        }
        // Project LEAD
        Optional<ProjectMember> pm = findProjectMember(project, user);
        if (pm.isPresent() && pm.get().getRole() == ProjectRole.LEAD) {
            return;
        }
        throw new AccessDeniedException("Project LEAD or Workspace ADMIN/OWNER permissions required");
    }

    public void checkCanContributeToProject(Project project, User user) {
        if (user == null) {
            throw new ResourceNotFoundException("Project not found");
        }
        if (isPlatformAdmin(user)) {
            return;
        }
        Optional<WorkspaceMember> wsMember = findWorkspaceMember(project.getWorkspace(), user);
        if (wsMember.isPresent() && (wsMember.get().getRole() == WorkspaceRole.OWNER
                || wsMember.get().getRole() == WorkspaceRole.ADMIN)) {
            return;
        }
        Optional<ProjectMember> pm = findProjectMember(project, user);
        if (pm.isPresent()
                && (pm.get().getRole() == ProjectRole.LEAD || pm.get().getRole() == ProjectRole.CONTRIBUTOR)) {
            return;
        }
        // If workspace member and project is workspace inherited:
        if (project.getVisibility() == ProjectVisibility.WORKSPACE_INHERITED && wsMember.isPresent()
                && wsMember.get().getRole() == WorkspaceRole.MEMBER) {
            return;
        }
        throw new AccessDeniedException("Contributor or Lead permissions required for this project");
    }

    public void checkCanCommentOnProject(Project project, User user) {
        // Any member of the project or workspace member (for inherited) or workspace
        // admin/owner can comment
        checkCanContributeToProject(project, user);
    }

    public void checkCanEditComment(ProjectComment comment, User user) {
        if (user == null) {
            throw new AccessDeniedException("Authentication required");
        }
        if (!comment.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You can only edit your own comments");
        }
    }

    public void checkCanModerateComment(ProjectComment comment, User user) {
        if (user == null) {
            throw new AccessDeniedException("Authentication required");
        }
        if (comment.getUser().getId().equals(user.getId())) {
            return; // Can delete own comment
        }
        if (isPlatformAdmin(user)) {
            return;
        }
        Optional<WorkspaceMember> wsMember = findWorkspaceMember(comment.getProject().getWorkspace(), user);
        if (wsMember.isPresent() && (wsMember.get().getRole() == WorkspaceRole.OWNER
                || wsMember.get().getRole() == WorkspaceRole.ADMIN)) {
            return;
        }
        Optional<ProjectMember> pm = findProjectMember(comment.getProject(), user);
        if (pm.isPresent() && pm.get().getRole() == ProjectRole.LEAD) {
            return;
        }
        throw new AccessDeniedException("You do not have permission to moderate or delete this comment");
    }
}
