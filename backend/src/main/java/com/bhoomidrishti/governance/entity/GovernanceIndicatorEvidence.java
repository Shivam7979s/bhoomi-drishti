package com.bhoomidrishti.governance.entity;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.research.entity.ResearchDocument;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "governance_indicator_evidence")
public class GovernanceIndicatorEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "snapshot_id", nullable = false)
    private GovernanceIndicatorSnapshot snapshot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "research_document_id")
    private ResearchDocument researchDocument;

    @Column(name = "document_chunk_id", columnDefinition = "uuid")
    private UUID documentChunkId;

    @Enumerated(EnumType.STRING)
    @Column(name = "evidence_type", nullable = false, length = 64)
    private GovernanceEvidenceType evidenceType;

    @Column(columnDefinition = "TEXT")
    private String rationale;

    @Column(name = "similarity_score", precision = 5, scale = 4)
    private BigDecimal similarityScore;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_by", nullable = false)
    private User linkedBy;

    @CreationTimestamp
    @Column(name = "linked_at", nullable = false, updatable = false)
    private Instant linkedAt;

    public GovernanceIndicatorEvidence() {}

    public GovernanceIndicatorEvidence(
            GovernanceIndicatorSnapshot snapshot,
            ResearchDocument researchDocument,
            UUID documentChunkId,
            GovernanceEvidenceType evidenceType,
            String rationale,
            BigDecimal similarityScore,
            User linkedBy) {
        if (researchDocument == null && documentChunkId == null) {
            throw new IllegalArgumentException("At least one of researchDocument or documentChunkId must be provided");
        }
        this.snapshot = snapshot;
        this.researchDocument = researchDocument;
        this.documentChunkId = documentChunkId;
        this.evidenceType = evidenceType;
        this.rationale = rationale;
        this.similarityScore = similarityScore;
        this.linkedBy = linkedBy;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public GovernanceIndicatorSnapshot getSnapshot() {
        return snapshot;
    }

    public void setSnapshot(GovernanceIndicatorSnapshot snapshot) {
        this.snapshot = snapshot;
    }

    public ResearchDocument getResearchDocument() {
        return researchDocument;
    }

    public void setResearchDocument(ResearchDocument researchDocument) {
        this.researchDocument = researchDocument;
    }

    public UUID getDocumentChunkId() {
        return documentChunkId;
    }

    public void setDocumentChunkId(UUID documentChunkId) {
        this.documentChunkId = documentChunkId;
    }

    public GovernanceEvidenceType getEvidenceType() {
        return evidenceType;
    }

    public void setEvidenceType(GovernanceEvidenceType evidenceType) {
        this.evidenceType = evidenceType;
    }

    public String getRationale() {
        return rationale;
    }

    public void setRationale(String rationale) {
        this.rationale = rationale;
    }

    public BigDecimal getSimilarityScore() {
        return similarityScore;
    }

    public void setSimilarityScore(BigDecimal similarityScore) {
        this.similarityScore = similarityScore;
    }

    public User getLinkedBy() {
        return linkedBy;
    }

    public void setLinkedBy(User linkedBy) {
        this.linkedBy = linkedBy;
    }

    public Instant getLinkedAt() {
        return linkedAt;
    }

    public void setLinkedAt(Instant linkedAt) {
        this.linkedAt = linkedAt;
    }
}
