package com.bhoomidrishti.research.repository;

import com.bhoomidrishti.research.entity.ResearchDocument;
import com.bhoomidrishti.research.entity.ResearchDocumentStatus;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ResearchDocumentRepository
        extends JpaRepository<ResearchDocument, UUID>, JpaSpecificationExecutor<ResearchDocument> {

    @Query("SELECT d FROM ResearchDocument d JOIN d.linkedLandRecords lr WHERE lr.id = :landRecordId")
    Page<ResearchDocument> findByLinkedLandRecordId(@Param("landRecordId") UUID landRecordId, Pageable pageable);

    @Query("SELECT d FROM ResearchDocument d JOIN d.linkedLandRecords lr WHERE lr.id = :landRecordId AND d.status = :status")
    Page<ResearchDocument> findByLinkedLandRecordIdAndStatus(
            @Param("landRecordId") UUID landRecordId,
            @Param("status") ResearchDocumentStatus status,
            Pageable pageable);
}
