package com.bhoomidrishti.governance.dto;

import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * Encapsulates geographic or project scope parameters for governance queries.
 *
 * <p>String values are normalized automatically upon creation (trimmed, blank values converted to null).
 */
public record GovernanceScopeQuery(
        @NotNull(message = "Scope type is required")
        GovernanceScopeType scopeType,
        String state,
        String district,
        String tehsil,
        String village,
        UUID projectId
) {
    public GovernanceScopeQuery {
        state = normalize(state);
        district = normalize(district);
        tehsil = normalize(tehsil);
        village = normalize(village);
    }

    private static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    public static GovernanceScopeQuery ofState(String state) {
        return new GovernanceScopeQuery(GovernanceScopeType.STATE, state, null, null, null, null);
    }

    public static GovernanceScopeQuery ofDistrict(String state, String district) {
        return new GovernanceScopeQuery(GovernanceScopeType.DISTRICT, state, district, null, null, null);
    }

    public static GovernanceScopeQuery ofTehsil(String state, String district, String tehsil) {
        return new GovernanceScopeQuery(GovernanceScopeType.TEHSIL, state, district, tehsil, null, null);
    }

    public static GovernanceScopeQuery ofVillage(String state, String district, String tehsil, String village) {
        return new GovernanceScopeQuery(GovernanceScopeType.VILLAGE, state, district, tehsil, village, null);
    }

    public static GovernanceScopeQuery ofProject(UUID projectId) {
        return new GovernanceScopeQuery(GovernanceScopeType.PROJECT, null, null, null, null, projectId);
    }
}
