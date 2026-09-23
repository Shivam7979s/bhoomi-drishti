package com.bhoomidrishti.collaboration.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class ProjectSharedDatasetId implements Serializable {

    private UUID project;
    private UUID sharedDataset;

    public ProjectSharedDatasetId() {}

    public ProjectSharedDatasetId(UUID project, UUID sharedDataset) {
        this.project = project;
        this.sharedDataset = sharedDataset;
    }

    public UUID getProject() {
        return project;
    }

    public void setProject(UUID project) {
        this.project = project;
    }

    public UUID getSharedDataset() {
        return sharedDataset;
    }

    public void setSharedDataset(UUID sharedDataset) {
        this.sharedDataset = sharedDataset;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ProjectSharedDatasetId that = (ProjectSharedDatasetId) o;
        return Objects.equals(project, that.project) && Objects.equals(sharedDataset, that.sharedDataset);
    }

    @Override
    public int hashCode() {
        return Objects.hash(project, sharedDataset);
    }
}
