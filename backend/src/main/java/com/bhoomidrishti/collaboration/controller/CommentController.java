package com.bhoomidrishti.collaboration.controller;

import com.bhoomidrishti.collaboration.dto.CommentResponse;
import com.bhoomidrishti.collaboration.dto.CreateCommentRequest;
import com.bhoomidrishti.collaboration.dto.UpdateCommentRequest;
import com.bhoomidrishti.collaboration.service.CommentService;
import jakarta.validation.Valid;
import java.util.List;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/api/projects/{projectId}/comments")
    public List<CommentResponse> listComments(
            @PathVariable UUID projectId, Authentication auth) {
        return commentService.listProjectComments(projectId, auth);
    }

    @PostMapping("/api/projects/{projectId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse createComment(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication auth) {
        return commentService.createComment(projectId, request, auth);
    }

    @PutMapping("/api/projects/comments/{commentId}")
    public CommentResponse updateComment(
            @PathVariable UUID commentId,
            @Valid @RequestBody UpdateCommentRequest request,
            Authentication auth) {
        return commentService.updateComment(commentId, request, auth);
    }

    @DeleteMapping("/api/projects/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(
            @PathVariable UUID commentId, Authentication auth) {
        commentService.deleteComment(commentId, auth);
    }
}
