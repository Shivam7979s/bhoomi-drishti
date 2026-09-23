package com.bhoomidrishti.collaboration.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class ProjectLandRecordId implements Serializable {

    private UUID project;
    private UUID landRecord;

    public ProjectLandRecordId() {}

    public ProjectLandRecordId(UUID project, UUID landRecord) {
        this.project = project;
        this.landRecord = landRecord;
    }

    public UUID getProject() {
        return project;
    }

    public void setProject(UUID project) {
        this.project = project;
    }

    public UUID getLandRecord() {
        return landRecord;
    }

    public void setLandRecord(UUID landRecord) {
        this.landRecord = landRecord;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ProjectLandRecordId that = (ProjectLandRecordId) o;
        return Objects.equals(project, that.project) && Objects.equals(landRecord, that.landRecord);
    }

    @Override
    public int hashCode() {
        return Objects.hash(project, landRecord);
    }
}
