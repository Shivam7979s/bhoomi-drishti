package com.bhoomidrishti.policy.dto;

import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.policy.entity.ScenarioAffectedParcel;
import java.math.BigDecimal;
import java.util.UUID;

public record ScenarioAffectedParcelResponse(
        UUID scenarioResultId,
        UUID landRecordId,
        String parcelNumber,
        String state,
        String district,
        String tehsil,
        String village,
        LandUseType baselineLandUse,
        LandUseType simulatedLandUse,
        BigDecimal parcelAreaSqm,
        LandRecordStatus status
) {
    public static ScenarioAffectedParcelResponse from(ScenarioAffectedParcel p) {
        if (p == null) return null;
        UUID lrId = p.getLandRecord() != null ? p.getLandRecord().getId() : null;
        String pNum = p.getLandRecord() != null ? p.getLandRecord().getParcelNumber() : null;
        String st = p.getLandRecord() != null ? p.getLandRecord().getState() : null;
        String dist = p.getLandRecord() != null ? p.getLandRecord().getDistrict() : null;
        String teh = p.getLandRecord() != null ? p.getLandRecord().getTehsil() : null;
        String vil = p.getLandRecord() != null ? p.getLandRecord().getVillage() : null;

        return new ScenarioAffectedParcelResponse(
                p.getScenarioResult() != null ? p.getScenarioResult().getId() : null,
                lrId,
                pNum,
                st,
                dist,
                teh,
                vil,
                p.getBaselineLandUse(),
                p.getSimulatedLandUse(),
                p.getParcelAreaSqm(),
                p.getStatus()
        );
    }
}
