package com.bhoomidrishti.collaboration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.dto.CommentResponse;
import com.bhoomidrishti.collaboration.dto.CreateCommentRequest;
import com.bhoomidrishti.collaboration.dto.UpdateCommentRequest;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.entity.ProjectComment;
import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
import com.bhoomidrishti.collaboration.repository.ProjectCommentRepository;
import com.bhoomidrishti.collaboration.repository.ProjectRepository;
import com.bhoomidrishti.collaboration.service.CollaborationSecurityService;
import com.bhoomidrishti.collaboration.service.CommentService;
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
class CommentServiceTest {

    @Mock
    private ProjectCommentRepository commentRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private CollaborationSecurityService securityService;

    private CommentService commentService;

    private User author;
    private User otherUser;
    private Authentication authorAuth;
    private Project project;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        commentService = new CommentService(commentRepository, projectRepository, securityService);

        author = User.registerLocal("Dr. Ananya", "ananya@gov.in", "hash");
        ReflectionTestUtils.setField(author, "id", UUID.randomUUID());

        otherUser = User.registerLocal("Other User", "other@gov.in", "hash");
        ReflectionTestUtils.setField(otherUser, "id", UUID.randomUUID());

        authorAuth = new UsernamePasswordAuthenticationToken(author, null);

        Workspace ws = new Workspace("WS", "ws", "desc", "inst", WorkspaceVisibility.PRIVATE, author);
        ReflectionTestUtils.setField(ws, "id", UUID.randomUUID());

        projectId = UUID.randomUUID();
        project = new Project(ws, "Project", "project", "desc", null, author);
        ReflectionTestUtils.setField(project, "id", projectId);
    }

    @Test
    void createComment_topLevelSuccess() {
        when(securityService.requireAuthenticatedUser(authorAuth)).thenReturn(author);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        CreateCommentRequest request = new CreateCommentRequest("Initial project findings", null);
        when(commentRepository.save(any(ProjectComment.class))).thenAnswer(inv -> {
            ProjectComment c = inv.getArgument(0);
            ReflectionTestUtils.setField(c, "id", UUID.randomUUID());
            return c;
        });

        CommentResponse response = commentService.createComment(projectId, request, authorAuth);

        assertThat(response).isNotNull();
        assertThat(response.content()).isEqualTo("Initial project findings");
        assertThat(response.parentCommentId()).isNull();
    }

    @Test
    void createComment_validOneLevelReplySuccess() {
        when(securityService.requireAuthenticatedUser(authorAuth)).thenReturn(author);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        UUID topCommentId = UUID.randomUUID();
        ProjectComment topComment = new ProjectComment(project, author, null, "Top comment");
        ReflectionTestUtils.setField(topComment, "id", topCommentId);

        when(commentRepository.findById(topCommentId)).thenReturn(Optional.of(topComment));
        when(commentRepository.save(any(ProjectComment.class))).thenAnswer(inv -> {
            ProjectComment c = inv.getArgument(0);
            ReflectionTestUtils.setField(c, "id", UUID.randomUUID());
            return c;
        });

        CreateCommentRequest replyRequest = new CreateCommentRequest("First reply", topCommentId);
        CommentResponse response = commentService.createComment(projectId, replyRequest, authorAuth);

        assertThat(response).isNotNull();
        assertThat(response.parentCommentId()).isEqualTo(topCommentId);
    }

    @Test
    void createComment_rejectTwoLevelReply() {
        when(securityService.requireAuthenticatedUser(authorAuth)).thenReturn(author);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        UUID topCommentId = UUID.randomUUID();
        ProjectComment topComment = new ProjectComment(project, author, null, "Top comment");
        ReflectionTestUtils.setField(topComment, "id", topCommentId);

        UUID reply1Id = UUID.randomUUID();
        ProjectComment reply1 = new ProjectComment(project, otherUser, topComment, "First reply");
        ReflectionTestUtils.setField(reply1, "id", reply1Id);

        when(commentRepository.findById(reply1Id)).thenReturn(Optional.of(reply1));

        CreateCommentRequest nestedReplyRequest = new CreateCommentRequest("Nested reply", reply1Id);

        assertThatThrownBy(() -> commentService.createComment(projectId, nestedReplyRequest, authorAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot reply to a reply");
    }

    @Test
    void updateComment_authorOnly() {
        UUID commentId = UUID.randomUUID();
        ProjectComment comment = new ProjectComment(project, author, null, "Original text");
        ReflectionTestUtils.setField(comment, "id", commentId);

        when(securityService.requireAuthenticatedUser(authorAuth)).thenReturn(author);
        when(commentRepository.findById(commentId)).thenReturn(Optional.of(comment));
        when(commentRepository.save(any(ProjectComment.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateCommentRequest request = new UpdateCommentRequest("Updated text");
        CommentResponse response = commentService.updateComment(commentId, request, authorAuth);

        assertThat(response).isNotNull();
        assertThat(response.content()).isEqualTo("Updated text");
        assertThat(response.isEdited()).isTrue();
    }
}
