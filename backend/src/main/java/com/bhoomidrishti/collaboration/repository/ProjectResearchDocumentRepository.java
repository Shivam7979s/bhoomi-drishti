package com.bhoomidrishti.collaboration.repository;

import com.bhoomidrishti.collaboration.entity.ProjectResearchDocument;
import com.bhoomidrishti.collaboration.entity.ProjectResearchDocumentId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectResearchDocumentRepository extends JpaRepository<ProjectResearchDocument, ProjectResearchDocumentId> {

    List<ProjectResearchDocument> findByProjectId(UUID projectId);

    Page<ProjectResearchDocument> findByProjectId(UUID projectId, Pageable pageable);

    Optional<ProjectResearchDocument> findByProjectIdAndResearchDocumentId(UUID projectId, UUID researchDocumentId);

    boolean existsByProjectIdAndResearchDocumentId(UUID projectId, UUID researchDocumentId);

    void deleteByProjectIdAndResearchDocumentId(UUID projectId, UUID researchDocumentId);

    long countByProjectId(UUID projectId);
}
