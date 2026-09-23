package com.bhoomidrishti.collaboration.entity;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.landrecord.entity.LandRecord;
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
@Table(name = "project_land_records")
@IdClass(ProjectLandRecordId.class)
public class ProjectLandRecord {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "land_record_id", nullable = false)
    private LandRecord landRecord;

    @Column(name = "context_notes", columnDefinition = "TEXT")
    private String contextNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "added_by")
    private User addedBy;

    @CreationTimestamp
    @Column(name = "added_at", nullable = false, updatable = false)
    private Instant addedAt;

    public ProjectLandRecord() {}

    public ProjectLandRecord(Project project, LandRecord landRecord, String contextNotes, User addedBy) {
        this.project = project;
        this.landRecord = landRecord;
        this.contextNotes = contextNotes;
        this.addedBy = addedBy;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public LandRecord getLandRecord() {
        return landRecord;
    }

    public void setLandRecord(LandRecord landRecord) {
        this.landRecord = landRecord;
    }

    public String getContextNotes() {
        return contextNotes;
    }

    public void setContextNotes(String contextNotes) {
        this.contextNotes = contextNotes;
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
