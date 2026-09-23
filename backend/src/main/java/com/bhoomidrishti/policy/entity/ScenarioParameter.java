package com.bhoomidrishti.policy.entity;

import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.landrecord.entity.OwnershipType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Geometry;

@Entity
@Table(name = "scenario_parameters")
public class ScenarioParameter {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", nullable = false, updatable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scenario_id", nullable = false, unique = true)
    private PolicyScenario scenario;

    @Column(name = "target_state", length = 100)
    private String targetState;

    @Column(name = "target_district", length = 100)
    private String targetDistrict;

    @Column(name = "target_tehsil", length = 100)
    private String targetTehsil;

    @Column(name = "target_village", length = 100)
    private String targetVillage;

    @JdbcTypeCode(SqlTypes.GEOMETRY)
    @Column(name = "intervention_geometry", columnDefinition = "geometry(Geometry,4326)")
    private Geometry interventionGeometry;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_land_use", length = 32)
    private LandUseType sourceLandUse;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_land_use", length = 32)
    private LandUseType targetLandUse;

    @Column(name = "conversion_percentage", precision = 5, scale = 2)
    private BigDecimal conversionPercentage;

    @Column(name = "max_ownership_area", precision = 14, scale = 2)
    private BigDecimal maxOwnershipArea;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_ownership_type", length = 32)
    private OwnershipType targetOwnershipType;

    @Column(name = "buffer_distance_meters", precision = 12, scale = 2)
    private BigDecimal bufferDistanceMeters;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_parameters", columnDefinition = "jsonb")
    private String customParameters;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public ScenarioParameter() {}

    public ScenarioParameter(PolicyScenario scenario) {
        this.scenario = scenario;
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

    public String getTargetState() {
        return targetState;
    }

    public void setTargetState(String targetState) {
        this.targetState = targetState;
    }

    public String getTargetDistrict() {
        return targetDistrict;
    }

    public void setTargetDistrict(String targetDistrict) {
        this.targetDistrict = targetDistrict;
    }

    public String getTargetTehsil() {
        return targetTehsil;
    }

    public void setTargetTehsil(String targetTehsil) {
        this.targetTehsil = targetTehsil;
    }

    public String getTargetVillage() {
        return targetVillage;
    }

    public void setTargetVillage(String targetVillage) {
        this.targetVillage = targetVillage;
    }

    public Geometry getInterventionGeometry() {
        return interventionGeometry;
    }

    public void setInterventionGeometry(Geometry interventionGeometry) {
        this.interventionGeometry = interventionGeometry;
    }

    public LandUseType getSourceLandUse() {
        return sourceLandUse;
    }

    public void setSourceLandUse(LandUseType sourceLandUse) {
        this.sourceLandUse = sourceLandUse;
    }

    public LandUseType getTargetLandUse() {
        return targetLandUse;
    }

    public void setTargetLandUse(LandUseType targetLandUse) {
        this.targetLandUse = targetLandUse;
    }

    public BigDecimal getConversionPercentage() {
        return conversionPercentage;
    }

    public void setConversionPercentage(BigDecimal conversionPercentage) {
        this.conversionPercentage = conversionPercentage;
    }

    public BigDecimal getMaxOwnershipArea() {
        return maxOwnershipArea;
    }

    public void setMaxOwnershipArea(BigDecimal maxOwnershipArea) {
        this.maxOwnershipArea = maxOwnershipArea;
    }

    public OwnershipType getTargetOwnershipType() {
        return targetOwnershipType;
    }

    public void setTargetOwnershipType(OwnershipType targetOwnershipType) {
        this.targetOwnershipType = targetOwnershipType;
    }

    public BigDecimal getBufferDistanceMeters() {
        return bufferDistanceMeters;
    }

    public void setBufferDistanceMeters(BigDecimal bufferDistanceMeters) {
        this.bufferDistanceMeters = bufferDistanceMeters;
    }

    public String getCustomParameters() {
        return customParameters;
    }

    public void setCustomParameters(String customParameters) {
        this.customParameters = customParameters;
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
