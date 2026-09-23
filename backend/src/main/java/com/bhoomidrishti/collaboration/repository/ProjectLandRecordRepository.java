package com.bhoomidrishti.collaboration.repository;

import com.bhoomidrishti.collaboration.entity.ProjectLandRecord;
import com.bhoomidrishti.collaboration.entity.ProjectLandRecordId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectLandRecordRepository extends JpaRepository<ProjectLandRecord, ProjectLandRecordId> {

    List<ProjectLandRecord> findByProjectId(UUID projectId);

    Page<ProjectLandRecord> findByProjectId(UUID projectId, Pageable pageable);

    Optional<ProjectLandRecord> findByProjectIdAndLandRecordId(UUID projectId, UUID landRecordId);

    boolean existsByProjectIdAndLandRecordId(UUID projectId, UUID landRecordId);

    void deleteByProjectIdAndLandRecordId(UUID projectId, UUID landRecordId);

    long countByProjectId(UUID projectId);
}
