package com.bhoomidrishti.collaboration.repository;

import com.bhoomidrishti.collaboration.entity.SavedResearch;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SavedResearchRepository extends JpaRepository<SavedResearch, UUID> {

    Optional<SavedResearch> findByIdAndUserId(UUID id, UUID userId);

    Page<SavedResearch> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    List<SavedResearch> findByUserIdOrderByCreatedAtDesc(UUID userId);

    boolean existsByUserIdAndResearchDocumentId(UUID userId, UUID researchDocumentId);

    void deleteByIdAndUserId(UUID id, UUID userId);
}
