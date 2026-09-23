package com.bhoomidrishti.policy.entity;

import com.bhoomidrishti.auth.entity.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "scenario_results")
public class ScenarioResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scenario_id", nullable = false)
    private PolicyScenario scenario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "executed_by", nullable = false)
    private User executedBy;

    @CreationTimestamp
    @Column(name = "executed_at", nullable = false, updatable = false)
    private Instant executedAt;

    @Column(name = "total_parcels_evaluated", nullable = false)
    private Long totalParcelsEvaluated = 0L;

    @Column(name = "total_parcels_affected", nullable = false)
    private Long totalParcelsAffected = 0L;

    @Column(name = "total_area_affected_sqm", nullable = false, precision = 16, scale = 2)
    private BigDecimal totalAreaAffectedSqm = BigDecimal.ZERO;

    @Column(name = "baseline_area_sqm", nullable = false, precision = 16, scale = 2)
    private BigDecimal baselineAreaSqm = BigDecimal.ZERO;

    @Column(name = "simulated_area_sqm", nullable = false, precision = 16, scale = 2)
    private BigDecimal simulatedAreaSqm = BigDecimal.ZERO;

    @Column(name = "disputed_parcels_count", nullable = false)
    private Long disputedParcelsCount = 0L;

    @Column(name = "disputed_area_sqm", nullable = false, precision = 16, scale = 2)
    private BigDecimal disputedAreaSqm = BigDecimal.ZERO;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "land_use_distribution_json", columnDefinition = "jsonb")
    private String landUseDistributionJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ownership_distribution_json", columnDefinition = "jsonb")
    private String ownershipDistributionJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "spatial_summary_json", columnDefinition = "jsonb")
    private String spatialSummaryJson;

    @OneToMany(mappedBy = "scenarioResult", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<ScenarioAffectedParcel> affectedParcels = new ArrayList<>();

    public ScenarioResult() {}

    public ScenarioResult(PolicyScenario scenario, User executedBy) {
        this.scenario = scenario;
        this.executedBy = executedBy;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public PolicyScenario getScenario() {
        return scenario;
    }

    public void setScenario(PolicyScenario scenario) {
        this.scenario = scenario;
    }

    public User getExecutedBy() {
        return executedBy;
    }

    public void setExecutedBy(User executedBy) {
        this.executedBy = executedBy;
    }

    public Instant getExecutedAt() {
        return executedAt;
    }

    public void setExecutedAt(Instant executedAt) {
        this.executedAt = executedAt;
    }

    public Long getTotalParcelsEvaluated() {
        return totalParcelsEvaluated;
    }

    public void setTotalParcelsEvaluated(Long totalParcelsEvaluated) {
        this.totalParcelsEvaluated = totalParcelsEvaluated;
    }

    public Long getTotalParcelsAffected() {
        return totalParcelsAffected;
    }

    public void setTotalParcelsAffected(Long totalParcelsAffected) {
        this.totalParcelsAffected = totalParcelsAffected;
    }

    public BigDecimal getTotalAreaAffectedSqm() {
        return totalAreaAffectedSqm;
    }

    public void setTotalAreaAffectedSqm(BigDecimal totalAreaAffectedSqm) {
        this.totalAreaAffectedSqm = totalAreaAffectedSqm;
    }

    public BigDecimal getBaselineAreaSqm() {
        return baselineAreaSqm;
    }

    public void setBaselineAreaSqm(BigDecimal baselineAreaSqm) {
        this.baselineAreaSqm = baselineAreaSqm;
    }

    public BigDecimal getSimulatedAreaSqm() {
        return simulatedAreaSqm;
    }

    public void setSimulatedAreaSqm(BigDecimal simulatedAreaSqm) {
        this.simulatedAreaSqm = simulatedAreaSqm;
    }

    public Long getDisputedParcelsCount() {
        return disputedParcelsCount;
    }

    public void setDisputedParcelsCount(Long disputedParcelsCount) {
        this.disputedParcelsCount = disputedParcelsCount;
    }

    public BigDecimal getDisputedAreaSqm() {
        return disputedAreaSqm;
    }

    public void setDisputedAreaSqm(BigDecimal disputedAreaSqm) {
        this.disputedAreaSqm = disputedAreaSqm;
    }

    public String getLandUseDistributionJson() {
        return landUseDistributionJson;
    }

    public void setLandUseDistributionJson(String landUseDistributionJson) {
        this.landUseDistributionJson = landUseDistributionJson;
    }

    public String getOwnershipDistributionJson() {
        return ownershipDistributionJson;
    }

    public void setOwnershipDistributionJson(String ownershipDistributionJson) {
        this.ownershipDistributionJson = ownershipDistributionJson;
    }

    public String getSpatialSummaryJson() {
        return spatialSummaryJson;
    }

    public void setSpatialSummaryJson(String spatialSummaryJson) {
        this.spatialSummaryJson = spatialSummaryJson;
    }

    public List<ScenarioAffectedParcel> getAffectedParcels() {
        return affectedParcels;
    }

    public void setAffectedParcels(List<ScenarioAffectedParcel> affectedParcels) {
        this.affectedParcels = affectedParcels;
    }
}
