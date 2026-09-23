package com.bhoomidrishti.collaboration.service;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.dto.CommentResponse;
import com.bhoomidrishti.collaboration.dto.CreateCommentRequest;
import com.bhoomidrishti.collaboration.dto.UpdateCommentRequest;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.entity.ProjectComment;
import com.bhoomidrishti.collaboration.repository.ProjectCommentRepository;
import com.bhoomidrishti.collaboration.repository.ProjectRepository;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CommentService {

    private final ProjectCommentRepository commentRepository;
    private final ProjectRepository projectRepository;
    private final CollaborationSecurityService securityService;

    public CommentService(
            ProjectCommentRepository commentRepository,
            ProjectRepository projectRepository,
            CollaborationSecurityService securityService) {
        this.commentRepository = commentRepository;
        this.projectRepository = projectRepository;
        this.securityService = securityService;
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> listProjectComments(UUID projectId, Authentication auth) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        Optional<User> currentUser = securityService.resolveCurrentUser(auth);
        securityService.checkCanViewProject(project, currentUser.orElse(null));

        List<ProjectComment> topLevelComments =
                commentRepository.findByProjectIdAndParentCommentIsNullOrderByCreatedAtAsc(projectId);

        return topLevelComments.stream().map(top -> {
            List<ProjectComment> replies = commentRepository.findByParentCommentIdOrderByCreatedAtAsc(top.getId());
            List<CommentResponse> replyResponses = replies.stream()
                    .map(CommentResponse::from)
                    .toList();
            return CommentResponse.from(top, replyResponses);
        }).toList();
    }

    public CommentResponse createComment(UUID projectId, CreateCommentRequest request, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        securityService.checkCanCommentOnProject(project, user);

        ProjectComment parent = null;
        if (request.parentCommentId() != null) {
            parent = commentRepository.findById(request.parentCommentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found"));

            // Parent must belong to the same project
            if (!parent.getProject().getId().equals(projectId)) {
                throw new IllegalArgumentException("Parent comment does not belong to this project");
            }

            // Exactly 1 level of nesting: parent itself cannot be a reply
            if (parent.getParentComment() != null) {
                throw new IllegalArgumentException("Cannot reply to a reply. Only one level of nesting is allowed.");
            }
        }

        ProjectComment comment = new ProjectComment(project, user, parent, request.content().trim());
        comment = commentRepository.save(comment);

        return CommentResponse.from(comment);
    }

    public CommentResponse updateComment(UUID commentId, UpdateCommentRequest request, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        ProjectComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        securityService.checkCanEditComment(comment, user);

        comment.setContent(request.content().trim());
        comment.setEdited(true);
        comment = commentRepository.save(comment);

        // Fetch replies if this is a top-level comment
        List<CommentResponse> replyResponses = null;
        if (comment.getParentComment() == null) {
            replyResponses = commentRepository.findByParentCommentIdOrderByCreatedAtAsc(comment.getId()).stream()
                    .map(CommentResponse::from)
                    .toList();
        }

        return CommentResponse.from(comment, replyResponses);
    }

    public void deleteComment(UUID commentId, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        ProjectComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        securityService.checkCanModerateComment(comment, user);

        commentRepository.delete(comment);
    }
}
