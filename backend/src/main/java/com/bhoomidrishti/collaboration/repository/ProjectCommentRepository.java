package com.bhoomidrishti.collaboration.repository;

import com.bhoomidrishti.collaboration.entity.ProjectComment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectCommentRepository extends JpaRepository<ProjectComment, UUID> {

    List<ProjectComment> findByProjectIdAndParentCommentIsNullOrderByCreatedAtAsc(UUID projectId);

    Page<ProjectComment> findByProjectIdAndParentCommentIsNullOrderByCreatedAtAsc(UUID projectId, Pageable pageable);

    List<ProjectComment> findByParentCommentIdOrderByCreatedAtAsc(UUID parentCommentId);

    Optional<ProjectComment> findByIdAndProjectId(UUID id, UUID projectId);

    long countByProjectId(UUID projectId);
}
