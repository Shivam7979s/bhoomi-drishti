package com.bhoomidrishti.collaboration.entity;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.research.entity.ResearchDocument;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "saved_research")
public class SavedResearch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "research_document_id")
    private ResearchDocument researchDocument;

    @Column(name = "document_chunk_id", columnDefinition = "uuid")
    private UUID documentChunkId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(length = 255)
    private String tags;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public SavedResearch() {}

    public SavedResearch(
            User user,
            ResearchDocument researchDocument,
            UUID documentChunkId,
            String title,
            String notes,
            String tags) {
        this.user = user;
        this.researchDocument = researchDocument;
        this.documentChunkId = documentChunkId;
        this.title = title;
        this.notes = notes;
        this.tags = tags;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
