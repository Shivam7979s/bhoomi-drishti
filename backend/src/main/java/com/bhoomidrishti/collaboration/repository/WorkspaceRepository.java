package com.bhoomidrishti.collaboration.repository;

import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.entity.WorkspaceStatus;
import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {

    Optional<Workspace> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Workspace> findByVisibilityAndStatus(
            WorkspaceVisibility visibility, WorkspaceStatus status, Pageable pageable);

    Page<Workspace> findAllByStatus(WorkspaceStatus status, Pageable pageable);

    @Query("SELECT w FROM Workspace w WHERE w.status = :status AND "
            + "(w.visibility = 'PUBLIC' OR EXISTS "
            + "(SELECT wm FROM WorkspaceMember wm WHERE wm.workspace = w AND wm.user.id = :userId))")
    Page<Workspace> findAccessibleWorkspaces(
            @Param("userId") UUID userId,
            @Param("status") WorkspaceStatus status,
            Pageable pageable);

    @Query("SELECT w FROM Workspace w WHERE w.status = :status AND EXISTS "
            + "(SELECT wm FROM WorkspaceMember wm WHERE wm.workspace = w AND wm.user.id = :userId)")
    Page<Workspace> findMemberWorkspaces(
            @Param("userId") UUID userId,
            @Param("status") WorkspaceStatus status,
            Pageable pageable);
}
