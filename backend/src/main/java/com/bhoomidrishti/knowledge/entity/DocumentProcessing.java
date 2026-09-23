package com.bhoomidrishti.knowledge.entity;

import com.bhoomidrishti.research.entity.ResearchDocument;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "document_processing")
public class DocumentProcessing {

    @Id
    @Column(columnDefinition = "uuid", nullable = false, updatable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "research_document_id", nullable = false, unique = true)
    private ResearchDocument researchDocument;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ProcessingStatus status = ProcessingStatus.NOT_INGESTED;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "chunk_count", nullable = false)
    private int chunkCount = 0;

    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Column(name = "processing_version", nullable = false, length = 32)
    private String processingVersion = "v1-bge-small";

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected DocumentProcessing() {
    }

    public DocumentProcessing(ResearchDocument researchDocument, ProcessingStatus status) {
        this.researchDocument = researchDocument;
        this.status = (status == null) ? ProcessingStatus.NOT_INGESTED : status;
    }

    @PrePersist
    void onPrePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (status == null) {
            status = ProcessingStatus.NOT_INGESTED;
        }
        if (processingVersion == null) {
            processingVersion = "v1-bge-small";
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public ResearchDocument getResearchDocument() {
        return researchDocument;
    }

    public void setResearchDocument(ResearchDocument researchDocument) {
        this.researchDocument = researchDocument;
    }

    public ProcessingStatus getStatus() {
        return status;
    }

    public void setStatus(ProcessingStatus status) {
        this.status = status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public int getChunkCount() {
        return chunkCount;
    }

    public void setChunkCount(int chunkCount) {
        this.chunkCount = chunkCount;
    }

    public String getContentHash() {
        return contentHash;
    }

    public void setContentHash(String contentHash) {
        this.contentHash = contentHash;
    }

    public String getProcessingVersion() {
        return processingVersion;
    }

    public void setProcessingVersion(String processingVersion) {
        this.processingVersion = processingVersion;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
