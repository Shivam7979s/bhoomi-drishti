package com.bhoomidrishti.collaboration.controller;

import com.bhoomidrishti.collaboration.dto.AddProjectMemberRequest;
import com.bhoomidrishti.collaboration.dto.CreateProjectRequest;
import com.bhoomidrishti.collaboration.dto.ProjectMemberResponse;
import com.bhoomidrishti.collaboration.dto.ProjectResponse;
import com.bhoomidrishti.collaboration.dto.UpdateProjectMemberRequest;
import com.bhoomidrishti.collaboration.dto.UpdateProjectRequest;
import com.bhoomidrishti.collaboration.service.ProjectService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping("/api/workspaces/{workspaceId}/projects")
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse create(
            @PathVariable UUID workspaceId,
            @Valid @RequestBody CreateProjectRequest request,
            Authentication auth) {
        return projectService.createProject(workspaceId, request, auth);
    }

    @GetMapping("/api/workspaces/{workspaceId}/projects")
    public PageResponse<ProjectResponse> listWorkspaceProjects(
            @PathVariable UUID workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        return projectService.listWorkspaceProjects(workspaceId, page, size, auth);
    }

    @GetMapping("/api/projects/{projectId}")
    public ProjectResponse getById(
            @PathVariable UUID projectId,
            Authentication auth) {
        return projectService.getProject(projectId, auth);
    }

    @PutMapping("/api/projects/{projectId}")
    public ProjectResponse update(
            @PathVariable UUID projectId,
            @Valid @RequestBody UpdateProjectRequest request,
            Authentication auth) {
        return projectService.updateProject(projectId, request, auth);
    }

    @DeleteMapping("/api/projects/{projectId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(
            @PathVariable UUID projectId,
            Authentication auth) {
        projectService.archiveProject(projectId, auth);
    }

    @GetMapping("/api/projects/{projectId}/members")
    public List<ProjectMemberResponse> listMembers(
            @PathVariable UUID projectId,
            Authentication auth) {
        return projectService.listMembers(projectId, auth);
    }

    @PostMapping("/api/projects/{projectId}/members")
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectMemberResponse addMember(
            @PathVariable UUID projectId,
            @Valid @RequestBody AddProjectMemberRequest request,
            Authentication auth) {
        return projectService.addMember(projectId, request, auth);
    }

    @PutMapping("/api/projects/{projectId}/members/{userId}")
    public ProjectMemberResponse updateMemberRole(
            @PathVariable UUID projectId,
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateProjectMemberRequest request,
            Authentication auth) {
        return projectService.updateMemberRole(projectId, userId, request, auth);
    }

    @DeleteMapping("/api/projects/{projectId}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(
            @PathVariable UUID projectId,
            @PathVariable UUID userId,
            Authentication auth) {
        projectService.removeMember(projectId, userId, auth);
    }
}
