package com.bhoomidrishti.collaboration.controller;

import com.bhoomidrishti.collaboration.dto.AddWorkspaceMemberRequest;
import com.bhoomidrishti.collaboration.dto.CreateWorkspaceRequest;
import com.bhoomidrishti.collaboration.dto.TransferOwnershipRequest;
import com.bhoomidrishti.collaboration.dto.UpdateWorkspaceMemberRequest;
import com.bhoomidrishti.collaboration.dto.UpdateWorkspaceRequest;
import com.bhoomidrishti.collaboration.dto.WorkspaceMemberResponse;
import com.bhoomidrishti.collaboration.dto.WorkspaceResponse;
import com.bhoomidrishti.collaboration.service.WorkspaceService;
import com.bhoomidrishti.common.PageResponse;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workspaces")
@Validated
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorkspaceResponse create(
            @Valid @RequestBody CreateWorkspaceRequest request, Authentication auth) {
        return workspaceService.createWorkspace(request, auth);
    }

    @GetMapping
    public PageResponse<WorkspaceResponse> list(
            @RequestParam(required = false) Boolean memberOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        return workspaceService.listWorkspaces(memberOnly, page, size, auth);
    }

    @GetMapping("/{idOrSlug}")
    public WorkspaceResponse getByIdOrSlug(
            @PathVariable String idOrSlug, Authentication auth) {
        return workspaceService.getWorkspace(idOrSlug, auth);
    }

    @PutMapping("/{id}")
    public WorkspaceResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWorkspaceRequest request,
            Authentication auth) {
        return workspaceService.updateWorkspace(id, request, auth);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(
            @PathVariable UUID id, Authentication auth) {
        workspaceService.archiveWorkspace(id, auth);
    }

    @PostMapping("/{id}/transfer-ownership")
    public WorkspaceResponse transferOwnership(
            @PathVariable UUID id,
            @Valid @RequestBody TransferOwnershipRequest request,
            Authentication auth) {
        return workspaceService.transferOwnership(id, request, auth);
    }

    @GetMapping("/{id}/members")
    public List<WorkspaceMemberResponse> listMembers(
            @PathVariable UUID id, Authentication auth) {
        return workspaceService.listMembers(id, auth);
    }

    @PostMapping("/{id}/members")
    @ResponseStatus(HttpStatus.CREATED)
    public WorkspaceMemberResponse addMember(
            @PathVariable UUID id,
            @Valid @RequestBody AddWorkspaceMemberRequest request,
            Authentication auth) {
        return workspaceService.addMember(id, request, auth);
    }

    @PutMapping("/{id}/members/{userId}")
    public WorkspaceMemberResponse updateMemberRole(
            @PathVariable UUID id,
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateWorkspaceMemberRequest request,
            Authentication auth) {
        return workspaceService.updateMemberRole(id, userId, request, auth);
    }

    @DeleteMapping("/{id}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(
            @PathVariable UUID id,
            @PathVariable UUID userId,
            Authentication auth) {
        workspaceService.removeMember(id, userId, auth);
    }
}
