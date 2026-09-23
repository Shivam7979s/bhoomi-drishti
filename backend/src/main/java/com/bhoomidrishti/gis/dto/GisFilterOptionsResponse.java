package com.bhoomidrishti.gis.dto;

import java.util.List;

/**
 * Filter options for GIS query builder.
 */
public record GisFilterOptionsResponse(
        List<String> states,
        List<String> districts,
        List<String> tehsils,
        List<String> villages,
        List<String> landUseTypes,
        List<String> ownershipTypes,
        List<String> statuses
) {
}
