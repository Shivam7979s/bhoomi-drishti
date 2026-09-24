package com.bhoomidrishti.governance.dto;

import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import java.util.UUID;

/**
 * Normalized scope descriptor within an administrative governance summary response.
 */
public record GovernanceScopeSummaryResponse(
        GovernanceScopeType scopeType,
        String state,
        String district,
        String tehsil,
        String village,
        UUID projectId,
        String projectName
) {}
