package com.bhoomidrishti.collaboration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.collaboration.dto.AddProjectMemberRequest;
import com.bhoomidrishti.collaboration.dto.CreateProjectRequest;
import com.bhoomidrishti.collaboration.dto.ProjectMemberResponse;
import com.bhoomidrishti.collaboration.dto.ProjectResponse;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.entity.ProjectMember;
import com.bhoomidrishti.collaboration.entity.ProjectRole;
import com.bhoomidrishti.collaboration.entity.ProjectStatus;
import com.bhoomidrishti.collaboration.entity.ProjectVisibility;
import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
import com.bhoomidrishti.collaboration.repository.ProjectCommentRepository;
import com.bhoomidrishti.collaboration.repository.ProjectLandRecordRepository;
import com.bhoomidrishti.collaboration.repository.ProjectMemberRepository;
import com.bhoomidrishti.collaboration.repository.ProjectRepository;
import com.bhoomidrishti.collaboration.repository.ProjectResearchDocumentRepository;
import com.bhoomidrishti.collaboration.repository.ProjectSharedDatasetRepository;
import com.bhoomidrishti.collaboration.repository.WorkspaceMemberRepository;
import com.bhoomidrishti.collaboration.repository.WorkspaceRepository;
import com.bhoomidrishti.collaboration.service.CollaborationSecurityService;
import com.bhoomidrishti.collaboration.service.ProjectService;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectMemberRepository projectMemberRepository;
    @Mock
    private WorkspaceRepository workspaceRepository;
    @Mock
    private WorkspaceMemberRepository workspaceMemberRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProjectLandRecordRepository projectLandRecordRepository;
    @Mock
    private ProjectResearchDocumentRepository projectResearchDocumentRepository;
    @Mock
    private ProjectSharedDatasetRepository projectSharedDatasetRepository;
    @Mock
    private ProjectCommentRepository projectCommentRepository;
    @Mock
    private CollaborationSecurityService securityService;

    private ProjectService projectService;

    private User leadUser;
    private User collaboratorUser;
    private Authentication leadAuth;
    private Workspace workspace;
    private UUID workspaceId;

    @BeforeEach
    void setUp() {
        projectService = new ProjectService(
                projectRepository,
                projectMemberRepository,
                workspaceRepository,
                workspaceMemberRepository,
                userRepository,
                projectLandRecordRepository,
                projectResearchDocumentRepository,
                projectSharedDatasetRepository,
                projectCommentRepository,
                securityService
        );

        leadUser = User.registerLocal("Dr. Sharma", "sharma@gov.in", "hash");
        ReflectionTestUtils.setField(leadUser, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(leadUser, "role", Role.RESEARCHER);

        collaboratorUser = User.registerLocal("Dr. Ananya", "ananya@univ.edu", "hash");
        ReflectionTestUtils.setField(collaboratorUser, "id", UUID.randomUUID());

        leadAuth = new UsernamePasswordAuthenticationToken(leadUser, null);

        workspaceId = UUID.randomUUID();
        workspace = new Workspace("Gov Land Lab", "gov-land-lab", "Desc", "MoHUA", WorkspaceVisibility.PRIVATE, leadUser);
        ReflectionTestUtils.setField(workspace, "id", workspaceId);
    }

    @Test
    void createProject_creatorBecomesLead() {
        when(securityService.requireAuthenticatedUser(leadAuth)).thenReturn(leadUser);
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(workspace));
        when(projectRepository.existsByWorkspaceIdAndSlug(any(), any())).thenReturn(false);

        CreateProjectRequest request = new CreateProjectRequest(
                "Urban Encroachment Study", "urban-encroachment", "Desc", ProjectVisibility.WORKSPACE_INHERITED);

        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> {
            Project p = inv.getArgument(0);
            ReflectionTestUtils.setField(p, "id", UUID.randomUUID());
            return p;
        });

        ProjectResponse response = projectService.createProject(workspaceId, request, leadAuth);

        assertThat(response).isNotNull();
        assertThat(response.name()).isEqualTo("Urban Encroachment Study");
        assertThat(response.currentUserRole()).isEqualTo(ProjectRole.LEAD);
        verify(projectMemberRepository).save(any(ProjectMember.class));
    }

    @Test
    void addMember_enforcesWorkspaceMemberPrerequisite() {
        UUID projectId = UUID.randomUUID();
        Project project = new Project(workspace, "Study", "study", "Desc", ProjectVisibility.WORKSPACE_INHERITED, leadUser);
        ReflectionTestUtils.setField(project, "id", projectId);

        when(securityService.requireAuthenticatedUser(leadAuth)).thenReturn(leadUser);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        // collaborator is NOT in workspace_members
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, collaboratorUser.getId()))
                .thenReturn(false);

        AddProjectMemberRequest request = new AddProjectMemberRequest(collaboratorUser.getId(), ProjectRole.CONTRIBUTOR);

        assertThatThrownBy(() -> projectService.addMember(projectId, request, leadAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User must be a member of the workspace before being added to a project");
    }

    @Test
    void addMember_successWhenUserIsWorkspaceMember() {
        UUID projectId = UUID.randomUUID();
        Project project = new Project(workspace, "Study", "study", "Desc", ProjectVisibility.WORKSPACE_INHERITED, leadUser);
        ReflectionTestUtils.setField(project, "id", projectId);

        when(securityService.requireAuthenticatedUser(leadAuth)).thenReturn(leadUser);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, collaboratorUser.getId()))
                .thenReturn(true);
        when(projectMemberRepository.existsByProjectIdAndUserId(projectId, collaboratorUser.getId()))
                .thenReturn(false);
        when(userRepository.findById(collaboratorUser.getId()))
                .thenReturn(Optional.of(collaboratorUser));

        when(projectMemberRepository.save(any(ProjectMember.class))).thenAnswer(inv -> {
            ProjectMember pm = inv.getArgument(0);
            ReflectionTestUtils.setField(pm, "id", UUID.randomUUID());
            return pm;
        });

        AddProjectMemberRequest request = new AddProjectMemberRequest(collaboratorUser.getId(), ProjectRole.CONTRIBUTOR);
        ProjectMemberResponse response = projectService.addMember(projectId, request, leadAuth);

        assertThat(response).isNotNull();
        assertThat(response.role()).isEqualTo(ProjectRole.CONTRIBUTOR);
        verify(projectMemberRepository).save(any(ProjectMember.class));
    }

    @Test
    void archiveProject_softArchiveSetsStatus() {
        UUID projectId = UUID.randomUUID();
        Project project = new Project(workspace, "Study", "study", "Desc", ProjectVisibility.WORKSPACE_INHERITED, leadUser);
        ReflectionTestUtils.setField(project, "id", projectId);

        when(securityService.requireAuthenticatedUser(leadAuth)).thenReturn(leadUser);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        projectService.archiveProject(projectId, leadAuth);

        assertThat(project.getStatus()).isEqualTo(ProjectStatus.ARCHIVED);
        verify(projectRepository).save(project);
    }
}
