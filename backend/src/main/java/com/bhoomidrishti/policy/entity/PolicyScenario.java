package com.bhoomidrishti.policy.entity;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.entity.Project;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "policy_scenarios")
public class PolicyScenario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 220)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "scenario_type", nullable = false, length = 64)
    private ScenarioType scenarioType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ScenarioStatus status = ScenarioStatus.DRAFT;

    @OneToOne(mappedBy = "scenario", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private ScenarioParameter parameters;

    @OneToMany(mappedBy = "scenario", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<ScenarioResult> results = new ArrayList<>();

    @OneToMany(mappedBy = "scenario", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<ScenarioEvidence> evidenceList = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public PolicyScenario() {}

    public PolicyScenario(
            Project project,
            User createdBy,
            String name,
            String slug,
            String description,
            ScenarioType scenarioType) {
        this.project = project;
        this.createdBy = createdBy;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.scenarioType = scenarioType;
        this.status = ScenarioStatus.DRAFT;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ScenarioType getScenarioType() {
        return scenarioType;
    }

    public void setScenarioType(ScenarioType scenarioType) {
        this.scenarioType = scenarioType;
    }

    public ScenarioStatus getStatus() {
        return status;
    }

    public void setStatus(ScenarioStatus status) {
        this.status = status;
    }

    public ScenarioParameter getParameters() {
        return parameters;
    }

    public void setParameters(ScenarioParameter parameters) {
        this.parameters = parameters;
        if (parameters != null) {
            parameters.setScenario(this);
        }
    }

    public List<ScenarioResult> getResults() {
        return results;
    }

    public void setResults(List<ScenarioResult> results) {
        this.results = results;
    }

    public List<ScenarioEvidence> getEvidenceList() {
        return evidenceList;
    }

    public void setEvidenceList(List<ScenarioEvidence> evidenceList) {
        this.evidenceList = evidenceList;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
