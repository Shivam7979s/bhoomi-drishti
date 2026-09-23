package com.bhoomidrishti.collaboration.repository;

import com.bhoomidrishti.collaboration.entity.ProjectSharedDataset;
import com.bhoomidrishti.collaboration.entity.ProjectSharedDatasetId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectSharedDatasetRepository extends JpaRepository<ProjectSharedDataset, ProjectSharedDatasetId> {

    List<ProjectSharedDataset> findByProjectId(UUID projectId);

    Page<ProjectSharedDataset> findByProjectId(UUID projectId, Pageable pageable);

    Optional<ProjectSharedDataset> findByProjectIdAndSharedDatasetId(UUID projectId, UUID sharedDatasetId);

    boolean existsByProjectIdAndSharedDatasetId(UUID projectId, UUID sharedDatasetId);

    void deleteByProjectIdAndSharedDatasetId(UUID projectId, UUID sharedDatasetId);

    long countByProjectId(UUID projectId);
}
