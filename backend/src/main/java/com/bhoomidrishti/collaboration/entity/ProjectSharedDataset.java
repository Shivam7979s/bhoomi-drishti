package com.bhoomidrishti.collaboration.entity;

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
@Table(name = "project_shared_datasets")
@IdClass(ProjectSharedDatasetId.class)
public class ProjectSharedDataset {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shared_dataset_id", nullable = false)
    private SharedDataset sharedDataset;

    @CreationTimestamp
    @Column(name = "added_at", nullable = false, updatable = false)
    private Instant addedAt;

    public ProjectSharedDataset() {}

    public ProjectSharedDataset(Project project, SharedDataset sharedDataset) {
        this.project = project;
        this.sharedDataset = sharedDataset;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public SharedDataset getSharedDataset() {
        return sharedDataset;
    }

    public void setSharedDataset(SharedDataset sharedDataset) {
        this.sharedDataset = sharedDataset;
    }

    public Instant getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(Instant addedAt) {
        this.addedAt = addedAt;
    }
}
