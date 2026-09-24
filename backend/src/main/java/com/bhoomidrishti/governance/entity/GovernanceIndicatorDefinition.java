package com.bhoomidrishti.governance.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "governance_indicator_definitions")
public class GovernanceIndicatorDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 64)
    private IndicatorCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private IndicatorUnit unit;

    @Enumerated(EnumType.STRING)
    @Column(name = "aggregation_method", nullable = false, length = 32)
    private AggregationMethod aggregationMethod;

    @Column(name = "source_domain", nullable = false, length = 64)
    private String sourceDomain;

    @Column(name = "calculation_version", nullable = false, length = 32)
    private String calculationVersion = "1.0";

    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public GovernanceIndicatorDefinition() {}

    public GovernanceIndicatorDefinition(
            String code,
            String name,
            String description,
            IndicatorCategory category,
            IndicatorUnit unit,
            AggregationMethod aggregationMethod,
            String sourceDomain,
            String calculationVersion) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.category = category;
        this.unit = unit;
        this.aggregationMethod = aggregationMethod;
        this.sourceDomain = sourceDomain;
        this.calculationVersion = calculationVersion != null ? calculationVersion : "1.0";
        this.active = true;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public IndicatorCategory getCategory() {
        return category;
    }

    public void setCategory(IndicatorCategory category) {
        this.category = category;
    }

    public IndicatorUnit getUnit() {
        return unit;
    }

    public void setUnit(IndicatorUnit unit) {
        this.unit = unit;
    }

    public AggregationMethod getAggregationMethod() {
        return aggregationMethod;
    }

    public void setAggregationMethod(AggregationMethod aggregationMethod) {
        this.aggregationMethod = aggregationMethod;
    }

    public String getSourceDomain() {
        return sourceDomain;
    }

    public void setSourceDomain(String sourceDomain) {
        this.sourceDomain = sourceDomain;
    }

    public String getCalculationVersion() {
        return calculationVersion;
    }

    public void setCalculationVersion(String calculationVersion) {
        this.calculationVersion = calculationVersion;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
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
