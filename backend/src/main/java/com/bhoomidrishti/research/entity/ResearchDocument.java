package com.bhoomidrishti.research.entity;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.landrecord.entity.LandRecord;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "research_documents")
public class ResearchDocument {

    @Id
    @Column(columnDefinition = "uuid", nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 32)
    private DocumentType documentType;

    @Column(nullable = false, length = 255)
    private String authors;

    @Column(length = 255)
    private String organization;

    @Column(name = "publication_date")
    private LocalDate publicationDate;

    @Column(name = "source_url", length = 1024)
    private String sourceUrl;

    @Column(name = "file_url", length = 1024)
    private String fileUrl;

    @Column(nullable = false, length = 32)
    private String language = "en";

    @Column(length = 512)
    private String keywords;

    @Column(name = "abstract_text", columnDefinition = "TEXT")
    private String abstractText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ResearchDocumentStatus status = ResearchDocumentStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "research_document_land_records",
            joinColumns = @JoinColumn(name = "research_document_id"),
            inverseJoinColumns = @JoinColumn(name = "land_record_id")
    )
    private Set<LandRecord> linkedLandRecords = new HashSet<>();

    protected ResearchDocument() {
    }

    public ResearchDocument(
            String title,
            String description,
            DocumentType documentType,
            String authors,
            String organization,
            LocalDate publicationDate,
            String sourceUrl,
            String fileUrl,
            String language,
            String keywords,
            String abstractText,
            ResearchDocumentStatus status,
            User createdBy) {
        this.title = title;
        this.description = description;
        this.documentType = documentType;
        this.authors = authors;
        this.organization = organization;
        this.publicationDate = publicationDate;
        this.sourceUrl = sourceUrl;
        this.fileUrl = fileUrl;
        this.language = (language == null || language.isBlank()) ? "en" : language;
        this.keywords = keywords;
        this.abstractText = abstractText;
        this.status = (status == null) ? ResearchDocumentStatus.DRAFT : status;
        this.createdBy = createdBy;
    }

    @PrePersist
    void onPrePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (language == null || language.isBlank()) {
            language = "en";
        }
        if (status == null) {
            status = ResearchDocumentStatus.DRAFT;
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public DocumentType getDocumentType() {
        return documentType;
    }

    public void setDocumentType(DocumentType documentType) {
        this.documentType = documentType;
    }

    public String getAuthors() {
        return authors;
    }

    public void setAuthors(String authors) {
        this.authors = authors;
    }

    public String getOrganization() {
        return organization;
    }

    public void setOrganization(String organization) {
        this.organization = organization;
    }

    public LocalDate getPublicationDate() {
        return publicationDate;
    }

    public void setPublicationDate(LocalDate publicationDate) {
        this.publicationDate = publicationDate;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getKeywords() {
        return keywords;
    }

    public void setKeywords(String keywords) {
        this.keywords = keywords;
    }

    public String getAbstractText() {
        return abstractText;
    }

    public void setAbstractText(String abstractText) {
        this.abstractText = abstractText;
    }

    public ResearchDocumentStatus getStatus() {
        return status;
    }

    public void setStatus(ResearchDocumentStatus status) {
        this.status = status;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Set<LandRecord> getLinkedLandRecords() {
        return linkedLandRecords;
    }

    public void setLinkedLandRecords(Set<LandRecord> linkedLandRecords) {
        this.linkedLandRecords = linkedLandRecords;
    }
}
