package com.bhoomidrishti.collaboration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.collaboration.dto.AddWorkspaceMemberRequest;
import com.bhoomidrishti.collaboration.dto.CreateWorkspaceRequest;
import com.bhoomidrishti.collaboration.dto.TransferOwnershipRequest;
import com.bhoomidrishti.collaboration.dto.UpdateWorkspaceMemberRequest;
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
import com.bhoomidrishti.collaboration.service.CollaborationSecurityService;
import com.bhoomidrishti.collaboration.service.WorkspaceService;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class WorkspaceServiceTest {

    @Mock
    private WorkspaceRepository workspaceRepository;
    @Mock
    private WorkspaceMemberRepository workspaceMemberRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectMemberRepository projectMemberRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CollaborationSecurityService securityService;

    private WorkspaceService workspaceService;

    private User ownerUser;
    private User memberUser;
    private Authentication ownerAuth;
    private Authentication memberAuth;

    @BeforeEach
    void setUp() {
        workspaceService = new WorkspaceService(
                workspaceRepository,
                workspaceMemberRepository,
                projectRepository,
                projectMemberRepository,
                userRepository,
                securityService
        );

        ownerUser = User.registerLocal("Dr. Rao", "rao@gov.in", "hash");
        ReflectionTestUtils.setField(ownerUser, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(ownerUser, "role", Role.RESEARCHER);

        memberUser = User.registerLocal("Researcher Meena", "meena@univ.edu", "hash");
        ReflectionTestUtils.setField(memberUser, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(memberUser, "role", Role.ACADEMIA);

        ownerAuth = new UsernamePasswordAuthenticationToken(ownerUser, null);
        memberAuth = new UsernamePasswordAuthenticationToken(memberUser, null);
    }

    @Test
    void createWorkspace_creatorBecomesOwner() {
        when(securityService.requireAuthenticatedUser(ownerAuth)).thenReturn(ownerUser);
        when(workspaceRepository.existsBySlug(any())).thenReturn(false);

        CreateWorkspaceRequest request = new CreateWorkspaceRequest(
                "Geospatial Land Research", "geospatial-land", "Desc", "IIT Delhi", WorkspaceVisibility.PRIVATE);

        when(workspaceRepository.save(any(Workspace.class))).thenAnswer(inv -> {
            Workspace w = inv.getArgument(0);
            ReflectionTestUtils.setField(w, "id", UUID.randomUUID());
            return w;
        });

        WorkspaceResponse response = workspaceService.createWorkspace(request, ownerAuth);

        assertThat(response).isNotNull();
        assertThat(response.name()).isEqualTo("Geospatial Land Research");
        assertThat(response.currentUserRole()).isEqualTo(WorkspaceRole.OWNER);
        verify(workspaceMemberRepository).save(any(WorkspaceMember.class));
    }

    @Test
    void transferOwnership_success_oldOwnerBecomesAdmin_targetBecomesOwner() {
        UUID wsId = UUID.randomUUID();
        Workspace workspace = new Workspace("Test", "test", "desc", "inst", WorkspaceVisibility.PRIVATE, ownerUser);
        ReflectionTestUtils.setField(workspace, "id", wsId);

        when(securityService.requireAuthenticatedUser(ownerAuth)).thenReturn(ownerUser);
        when(workspaceRepository.findById(wsId)).thenReturn(Optional.of(workspace));

        WorkspaceMember oldOwnerMember = new WorkspaceMember(workspace, ownerUser, WorkspaceRole.OWNER);
        WorkspaceMember targetMember = new WorkspaceMember(workspace, memberUser, WorkspaceRole.MEMBER);

        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(wsId, memberUser.getId()))
                .thenReturn(Optional.of(targetMember));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(wsId, ownerUser.getId()))
                .thenReturn(Optional.of(oldOwnerMember));
        when(workspaceMemberRepository.findByWorkspaceId(wsId))
                .thenReturn(List.of(oldOwnerMember, targetMember));

        TransferOwnershipRequest request = new TransferOwnershipRequest(memberUser.getId());
        WorkspaceResponse response = workspaceService.transferOwnership(wsId, request, ownerAuth);

        assertThat(response).isNotNull();
        assertThat(oldOwnerMember.getRole()).isEqualTo(WorkspaceRole.ADMIN);
        assertThat(targetMember.getRole()).isEqualTo(WorkspaceRole.OWNER);
        verify(workspaceMemberRepository).save(oldOwnerMember);
        verify(workspaceMemberRepository).save(targetMember);
    }

    @Test
    void transferOwnership_rejectWhenTargetNotMember() {
        UUID wsId = UUID.randomUUID();
        Workspace workspace = new Workspace("Test", "test", "desc", "inst", WorkspaceVisibility.PRIVATE, ownerUser);
        ReflectionTestUtils.setField(workspace, "id", wsId);

        when(securityService.requireAuthenticatedUser(ownerAuth)).thenReturn(ownerUser);
        when(workspaceRepository.findById(wsId)).thenReturn(Optional.of(workspace));
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(wsId, memberUser.getId()))
                .thenReturn(Optional.empty());

        TransferOwnershipRequest request = new TransferOwnershipRequest(memberUser.getId());

        assertThatThrownBy(() -> workspaceService.transferOwnership(wsId, request, ownerAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Target user must already be a member");
    }

    @Test
    void removeMember_rejectRemovingSoleOwner() {
        UUID wsId = UUID.randomUUID();
        Workspace workspace = new Workspace("Test", "test", "desc", "inst", WorkspaceVisibility.PRIVATE, ownerUser);
        ReflectionTestUtils.setField(workspace, "id", wsId);

        when(securityService.requireAuthenticatedUser(ownerAuth)).thenReturn(ownerUser);
        when(workspaceRepository.findById(wsId)).thenReturn(Optional.of(workspace));

        WorkspaceMember ownerMember = new WorkspaceMember(workspace, ownerUser, WorkspaceRole.OWNER);
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(wsId, ownerUser.getId()))
                .thenReturn(Optional.of(ownerMember));

        assertThatThrownBy(() -> workspaceService.removeMember(wsId, ownerUser.getId(), ownerAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot remove the sole workspace OWNER");
    }

    @Test
    void updateMemberRole_rejectDemotingOwnerDirectly() {
        UUID wsId = UUID.randomUUID();
        Workspace workspace = new Workspace("Test", "test", "desc", "inst", WorkspaceVisibility.PRIVATE, ownerUser);
        ReflectionTestUtils.setField(workspace, "id", wsId);

        when(securityService.requireAuthenticatedUser(ownerAuth)).thenReturn(ownerUser);
        when(workspaceRepository.findById(wsId)).thenReturn(Optional.of(workspace));

        WorkspaceMember ownerMember = new WorkspaceMember(workspace, ownerUser, WorkspaceRole.OWNER);
        when(workspaceMemberRepository.findByWorkspaceIdAndUserId(wsId, ownerUser.getId()))
                .thenReturn(Optional.of(ownerMember));

        UpdateWorkspaceMemberRequest request = new UpdateWorkspaceMemberRequest(WorkspaceRole.MEMBER);

        assertThatThrownBy(() -> workspaceService.updateMemberRole(wsId, ownerUser.getId(), request, ownerAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot demote the sole workspace OWNER");
    }

    @Test
    void addMember_rejectAssigningOwnerRoleDirectly() {
        UUID wsId = UUID.randomUUID();
        Workspace workspace = new Workspace("Test", "test", "desc", "inst", WorkspaceVisibility.PRIVATE, ownerUser);
        ReflectionTestUtils.setField(workspace, "id", wsId);

        when(securityService.requireAuthenticatedUser(ownerAuth)).thenReturn(ownerUser);
        when(workspaceRepository.findById(wsId)).thenReturn(Optional.of(workspace));

        AddWorkspaceMemberRequest request = new AddWorkspaceMemberRequest(memberUser.getId(), WorkspaceRole.OWNER);

        assertThatThrownBy(() -> workspaceService.addMember(wsId, request, ownerAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot assign OWNER role via addMember");
    }

    @Test
    void archiveWorkspace_softArchiveSetsStatusArchived() {
        UUID wsId = UUID.randomUUID();
        Workspace workspace = new Workspace("Test", "test", "desc", "inst", WorkspaceVisibility.PRIVATE, ownerUser);
        ReflectionTestUtils.setField(workspace, "id", wsId);

        when(securityService.requireAuthenticatedUser(ownerAuth)).thenReturn(ownerUser);
        when(workspaceRepository.findById(wsId)).thenReturn(Optional.of(workspace));

        workspaceService.archiveWorkspace(wsId, ownerAuth);

        assertThat(workspace.getStatus()).isEqualTo(WorkspaceStatus.ARCHIVED);
        verify(workspaceRepository).save(workspace);
    }
}
