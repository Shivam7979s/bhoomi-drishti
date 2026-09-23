package com.bhoomidrishti.policy.entity;

import com.bhoomidrishti.landrecord.entity.LandRecord;
import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "scenario_affected_parcels")
@IdClass(ScenarioAffectedParcelId.class)
public class ScenarioAffectedParcel {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scenario_result_id", nullable = false)
    private ScenarioResult scenarioResult;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "land_record_id", nullable = false)
    private LandRecord landRecord;

    @Enumerated(EnumType.STRING)
    @Column(name = "baseline_land_use", nullable = false, length = 32)
    private LandUseType baselineLandUse;

    @Enumerated(EnumType.STRING)
    @Column(name = "simulated_land_use", nullable = false, length = 32)
    private LandUseType simulatedLandUse;

    @Column(name = "parcel_area_sqm", nullable = false, precision = 14, scale = 2)
    private BigDecimal parcelAreaSqm;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private LandRecordStatus status;

    public ScenarioAffectedParcel() {}

    public ScenarioAffectedParcel(
            ScenarioResult scenarioResult,
            LandRecord landRecord,
            LandUseType baselineLandUse,
            LandUseType simulatedLandUse,
            BigDecimal parcelAreaSqm,
            LandRecordStatus status) {
        this.scenarioResult = scenarioResult;
        this.landRecord = landRecord;
        this.baselineLandUse = baselineLandUse;
        this.simulatedLandUse = simulatedLandUse;
        this.parcelAreaSqm = parcelAreaSqm;
        this.status = status;
    }

    public ScenarioResult getScenarioResult() {
        return scenarioResult;
    }

    public void setScenarioResult(ScenarioResult scenarioResult) {
        this.scenarioResult = scenarioResult;
    }

    public LandRecord getLandRecord() {
        return landRecord;
    }

    public void setLandRecord(LandRecord landRecord) {
        this.landRecord = landRecord;
    }

    public LandUseType getBaselineLandUse() {
        return baselineLandUse;
    }

    public void setBaselineLandUse(LandUseType baselineLandUse) {
        this.baselineLandUse = baselineLandUse;
    }

    public LandUseType getSimulatedLandUse() {
        return simulatedLandUse;
    }

    public void setSimulatedLandUse(LandUseType simulatedLandUse) {
        this.simulatedLandUse = simulatedLandUse;
    }

    public BigDecimal getParcelAreaSqm() {
        return parcelAreaSqm;
    }

    public void setParcelAreaSqm(BigDecimal parcelAreaSqm) {
        this.parcelAreaSqm = parcelAreaSqm;
    }

    public LandRecordStatus getStatus() {
        return status;
    }

    public void setStatus(LandRecordStatus status) {
        this.status = status;
    }
}
