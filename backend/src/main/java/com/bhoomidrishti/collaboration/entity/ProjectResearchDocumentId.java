package com.bhoomidrishti.collaboration.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class ProjectResearchDocumentId implements Serializable {

    private UUID project;
    private UUID researchDocument;

    public ProjectResearchDocumentId() {}

    public ProjectResearchDocumentId(UUID project, UUID researchDocument) {
        this.project = project;
        this.researchDocument = researchDocument;
    }

    public UUID getProject() {
        return project;
    }

    public void setProject(UUID project) {
        this.project = project;
    }

    public UUID getResearchDocument() {
        return researchDocument;
    }

    public void setResearchDocument(UUID researchDocument) {
        this.researchDocument = researchDocument;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ProjectResearchDocumentId that = (ProjectResearchDocumentId) o;
        return Objects.equals(project, that.project) && Objects.equals(researchDocument, that.researchDocument);
    }

    @Override
    public int hashCode() {
        return Objects.hash(project, researchDocument);
    }
}
