package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.collaboration.entity.ProjectLandRecord;
import com.bhoomidrishti.landrecord.entity.LandRecord;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProjectLandRecordResponse(
        UUID projectId,
        UUID landRecordId,
        String parcelNumber,
        String state,
        String district,
        String tehsil,
        String village,
        BigDecimal areaAcres,
        String landUseType,
        String status,
        String contextNotes,
        UserSummaryDto addedBy,
        Instant addedAt
) {
    public static ProjectLandRecordResponse from(ProjectLandRecord plr, boolean isCallerAuthenticated) {
        LandRecord lr = plr.getLandRecord();
        return new ProjectLandRecordResponse(
                plr.getProject().getId(),
                lr.getId(),
                lr.getParcelNumber(),
                lr.getState(),
                lr.getDistrict(),
                lr.getTehsil(),
                lr.getVillage(),
                lr.getLandAreaSqMeters(),
                lr.getLandUseType() != null ? lr.getLandUseType().name() : null,
                lr.getStatus() != null ? lr.getStatus().name() : null,
                plr.getContextNotes(),
                UserSummaryDto.from(plr.getAddedBy(), isCallerAuthenticated),
                plr.getAddedAt()
        );
    }
}
