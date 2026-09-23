package com.bhoomidrishti.collaboration.repository;

import com.bhoomidrishti.collaboration.entity.SharedDataset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SharedDatasetRepository extends JpaRepository<SharedDataset, UUID> {

    Optional<SharedDataset> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

    Page<SharedDataset> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId, Pageable pageable);

    List<SharedDataset> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);

    long countByWorkspaceId(UUID workspaceId);
}
