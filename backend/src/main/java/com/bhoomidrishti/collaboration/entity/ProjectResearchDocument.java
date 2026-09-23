package com.bhoomidrishti.collaboration.entity;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.research.entity.ResearchDocument;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "project_research_documents")
@IdClass(ProjectResearchDocumentId.class)
public class ProjectResearchDocument {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "research_document_id", nullable = false)
    private ResearchDocument researchDocument;

    @Column(name = "relevance_notes", columnDefinition = "TEXT")
    private String relevanceNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "added_by")
    private User addedBy;

    @CreationTimestamp
    @Column(name = "added_at", nullable = false, updatable = false)
    private Instant addedAt;

    public ProjectResearchDocument() {}

    public ProjectResearchDocument(Project project, ResearchDocument researchDocument, String relevanceNotes, User addedBy) {
        this.project = project;
        this.researchDocument = researchDocument;
        this.relevanceNotes = relevanceNotes;
        this.addedBy = addedBy;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public ResearchDocument getResearchDocument() {
        return researchDocument;
    }

    public void setResearchDocument(ResearchDocument researchDocument) {
        this.researchDocument = researchDocument;
    }

    public String getRelevanceNotes() {
        return relevanceNotes;
    }

    public void setRelevanceNotes(String relevanceNotes) {
        this.relevanceNotes = relevanceNotes;
    }

    public User getAddedBy() {
        return addedBy;
    }

    public void setAddedBy(User addedBy) {
        this.addedBy = addedBy;
    }

    public Instant getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(Instant addedAt) {
        this.addedAt = addedAt;
    }
}
