package com.bhoomidrishti.policy.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class ScenarioAffectedParcelId implements Serializable {

    private UUID scenarioResult;
    private UUID landRecord;

    public ScenarioAffectedParcelId() {}

    public ScenarioAffectedParcelId(UUID scenarioResult, UUID landRecord) {
        this.scenarioResult = scenarioResult;
        this.landRecord = landRecord;
    }

    public UUID getScenarioResult() {
        return scenarioResult;
    }

    public void setScenarioResult(UUID scenarioResult) {
        this.scenarioResult = scenarioResult;
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
        ScenarioAffectedParcelId that = (ScenarioAffectedParcelId) o;
        return Objects.equals(scenarioResult, that.scenarioResult) && Objects.equals(landRecord, that.landRecord);
    }

    @Override
    public int hashCode() {
        return Objects.hash(scenarioResult, landRecord);
    }
}
