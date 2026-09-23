package com.bhoomidrishti.knowledge.repository;

import com.bhoomidrishti.knowledge.entity.DocumentProcessing;
import com.bhoomidrishti.knowledge.entity.ProcessingStatus;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentProcessingRepository extends JpaRepository<DocumentProcessing, UUID> {

    Optional<DocumentProcessing> findByResearchDocumentId(UUID researchDocumentId);

    boolean existsByResearchDocumentIdAndStatusIn(
            UUID researchDocumentId,
            Collection<ProcessingStatus> statuses
    );
}
