package com.bhoomidrishti.collaboration.repository;

import com.bhoomidrishti.collaboration.entity.Project;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    Optional<Project> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

    Optional<Project> findByWorkspaceIdAndSlug(UUID workspaceId, String slug);

    boolean existsByWorkspaceIdAndSlug(UUID workspaceId, String slug);

    Page<Project> findByWorkspaceId(UUID workspaceId, Pageable pageable);

    long countByWorkspaceId(UUID workspaceId);

    @Query("SELECT p FROM Project p WHERE p.workspace.id = :workspaceId AND "
            + "(p.visibility = 'PUBLIC' OR EXISTS "
            + "(SELECT pm FROM ProjectMember pm WHERE pm.project = p AND pm.user.id = :userId) OR "
            + "(p.visibility = 'WORKSPACE_INHERITED' AND EXISTS "
            + "(SELECT wm FROM WorkspaceMember wm WHERE wm.workspace.id = :workspaceId AND wm.user.id = :userId)))")
    Page<Project> findAccessibleProjects(
            @Param("workspaceId") UUID workspaceId,
            @Param("userId") UUID userId,
            Pageable pageable);

    @Query("SELECT p FROM Project p WHERE p.workspace.id = :workspaceId AND p.visibility = 'PUBLIC'")
    Page<Project> findPublicProjects(@Param("workspaceId") UUID workspaceId, Pageable pageable);
}
