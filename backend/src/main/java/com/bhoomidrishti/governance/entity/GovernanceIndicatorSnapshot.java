package com.bhoomidrishti.governance.entity;

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
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "governance_indicator_snapshots")
public class GovernanceIndicatorSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "indicator_definition_id", nullable = false, updatable = false)
    private GovernanceIndicatorDefinition indicatorDefinition;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", updatable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope_type", nullable = false, length = 32, updatable = false)
    private GovernanceScopeType scopeType;

    @Column(length = 100, updatable = false)
    private String state;

    @Column(length = 100, updatable = false)
    private String district;

    @Column(length = 100, updatable = false)
    private String tehsil;

    @Column(length = 100, updatable = false)
    private String village;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SnapshotVisibility visibility = SnapshotVisibility.INTERNAL;

    @Column(name = "as_of", nullable = false, updatable = false)
    private Instant asOf;

    @Column(name = "period_start", updatable = false)
    private Instant periodStart;

    @Column(name = "period_end", updatable = false)
    private Instant periodEnd;

    @Column(name = "numeric_value", nullable = false, precision = 18, scale = 4, updatable = false)
    private BigDecimal numericValue;

    @Column(name = "denominator", precision = 18, scale = 4, updatable = false)
    private BigDecimal denominator;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "breakdown", columnDefinition = "jsonb", updatable = false)
    private String breakdownJson;

    @Column(name = "calculation_version", nullable = false, length = 32, updatable = false)
    private String calculationVersion;

    @Column(name = "source_data_timestamp", nullable = false, updatable = false)
    private Instant sourceDataTimestamp;

    @Column(name = "source_data_version", length = 64, updatable = false)
    private String sourceDataVersion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by", nullable = false, updatable = false)
    private User generatedBy;

    @CreationTimestamp
    @Column(name = "generated_at", nullable = false, updatable = false)
    private Instant generatedAt;

    @OneToMany(mappedBy = "snapshot", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<GovernanceIndicatorEvidence> evidence = new ArrayList<>();

    public GovernanceIndicatorSnapshot() {}

    public GovernanceIndicatorSnapshot(
            GovernanceIndicatorDefinition indicatorDefinition,
            Project project,
            GovernanceScopeType scopeType,
            String state,
            String district,
            String tehsil,
            String village,
            SnapshotVisibility visibility,
            Instant asOf,
            Instant periodStart,
            Instant periodEnd,
            BigDecimal numericValue,
            BigDecimal denominator,
            String breakdownJson,
            String calculationVersion,
            Instant sourceDataTimestamp,
            String sourceDataVersion,
            User generatedBy) {
        this.indicatorDefinition = indicatorDefinition;
        this.project = project;
        this.scopeType = scopeType;
        this.state = state;
        this.district = district;
        this.tehsil = tehsil;
        this.village = village;
        this.visibility = visibility != null ? visibility : SnapshotVisibility.INTERNAL;
        this.asOf = asOf;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.numericValue = numericValue;
        this.denominator = denominator;
        this.breakdownJson = breakdownJson;
        this.calculationVersion = calculationVersion;
        this.sourceDataTimestamp = sourceDataTimestamp;
        this.sourceDataVersion = sourceDataVersion;
        this.generatedBy = generatedBy;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public GovernanceIndicatorDefinition getIndicatorDefinition() {
        return indicatorDefinition;
    }

    public void setIndicatorDefinition(GovernanceIndicatorDefinition indicatorDefinition) {
        this.indicatorDefinition = indicatorDefinition;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public GovernanceScopeType getScopeType() {
        return scopeType;
    }

    public void setScopeType(GovernanceScopeType scopeType) {
        this.scopeType = scopeType;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getTehsil() {
        return tehsil;
    }

    public void setTehsil(String tehsil) {
        this.tehsil = tehsil;
    }

    public String getVillage() {
        return village;
    }

    public void setVillage(String village) {
        this.village = village;
    }

    public SnapshotVisibility getVisibility() {
        return visibility;
    }

    public void setVisibility(SnapshotVisibility visibility) {
        this.visibility = visibility;
    }

    public Instant getAsOf() {
        return asOf;
    }

    public void setAsOf(Instant asOf) {
        this.asOf = asOf;
    }

    public Instant getPeriodStart() {
        return periodStart;
    }

    public void setPeriodStart(Instant periodStart) {
        this.periodStart = periodStart;
    }

    public Instant getPeriodEnd() {
        return periodEnd;
    }

    public void setPeriodEnd(Instant periodEnd) {
        this.periodEnd = periodEnd;
    }

    public BigDecimal getNumericValue() {
        return numericValue;
    }

    public void setNumericValue(BigDecimal numericValue) {
        this.numericValue = numericValue;
    }

    public BigDecimal getDenominator() {
        return denominator;
    }

    public void setDenominator(BigDecimal denominator) {
        this.denominator = denominator;
    }

    public String getBreakdownJson() {
        return breakdownJson;
    }

    public void setBreakdownJson(String breakdownJson) {
        this.breakdownJson = breakdownJson;
    }

    public String getCalculationVersion() {
        return calculationVersion;
    }

    public void setCalculationVersion(String calculationVersion) {
        this.calculationVersion = calculationVersion;
    }

    public Instant getSourceDataTimestamp() {
        return sourceDataTimestamp;
    }

    public void setSourceDataTimestamp(Instant sourceDataTimestamp) {
        this.sourceDataTimestamp = sourceDataTimestamp;
    }

    public String getSourceDataVersion() {
        return sourceDataVersion;
    }

    public void setSourceDataVersion(String sourceDataVersion) {
        this.sourceDataVersion = sourceDataVersion;
    }

    public User getGeneratedBy() {
        return generatedBy;
    }

    public void setGeneratedBy(User generatedBy) {
        this.generatedBy = generatedBy;
    }

    public Instant getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(Instant generatedAt) {
        this.generatedAt = generatedAt;
    }

    public List<GovernanceIndicatorEvidence> getEvidence() {
        return evidence;
    }

    public void setEvidence(List<GovernanceIndicatorEvidence> evidence) {
        this.evidence = evidence;
    }
}
