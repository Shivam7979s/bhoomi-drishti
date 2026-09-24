package com.bhoomidrishti.governance.repository;

import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class GovernanceCalculationRepository {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public GovernanceCalculationRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public record CalculationResult(
            BigDecimal numericValue,
            BigDecimal denominator,
            String breakdownJson,
            Instant sourceDataTimestamp
    ) {}

    public static final java.util.Set<String> SUPPORTED_INDICATOR_CODES = java.util.Set.of(
            "PARCEL_COUNT_BY_LAND_USE",
            "AREA_BY_LAND_USE",
            "LAND_USE_SHARE",
            "PARCEL_COUNT_BY_OWNERSHIP",
            "AREA_BY_OWNERSHIP",
            "OWNERSHIP_SHARE",
            "ACTIVE_PARCEL_COUNT",
            "DISPUTED_PARCEL_COUNT",
            "PENDING_VERIFICATION_COUNT",
            "INACTIVE_PARCEL_COUNT"
    );

    public boolean supportsIndicator(String indicatorCode) {
        return indicatorCode != null && SUPPORTED_INDICATOR_CODES.contains(indicatorCode.trim());
    }

    public CalculationResult calculateIndicator(
            String indicatorCode,
            GovernanceScopeType scopeType,
            String state,
            String district,
            String tehsil,
            String village,
            UUID projectId) {

        if (scopeType == null) {
            throw new IllegalArgumentException("scopeType is required");
        }

        if (indicatorCode == null || !supportsIndicator(indicatorCode)) {
            throw new IllegalArgumentException("Unsupported calculation for indicator code: " + indicatorCode);
        }

        StringBuilder whereClause = new StringBuilder();
        List<Object> params = new ArrayList<>();

        String fromClause;
        switch (scopeType) {
            case STATE -> {
                if (state == null || state.isBlank()) {
                    throw new IllegalArgumentException("state is required for STATE scope");
                }
                fromClause = "FROM land_records lr ";
                whereClause.append("WHERE lr.state = ? ");
                params.add(state.trim());
            }
            case DISTRICT -> {
                if (state == null || state.isBlank() || district == null || district.isBlank()) {
                    throw new IllegalArgumentException("state and district are required for DISTRICT scope");
                }
                fromClause = "FROM land_records lr ";
                whereClause.append("WHERE lr.state = ? AND lr.district = ? ");
                params.add(state.trim());
                params.add(district.trim());
            }
            case TEHSIL -> {
                if (state == null || state.isBlank() || district == null || district.isBlank()
                        || tehsil == null || tehsil.isBlank()) {
                    throw new IllegalArgumentException("state, district, and tehsil are required for TEHSIL scope");
                }
                fromClause = "FROM land_records lr ";
                whereClause.append("WHERE lr.state = ? AND lr.district = ? AND lr.tehsil = ? ");
                params.add(state.trim());
                params.add(district.trim());
                params.add(tehsil.trim());
            }
            case VILLAGE -> {
                if (state == null || state.isBlank() || district == null || district.isBlank()
                        || tehsil == null || tehsil.isBlank() || village == null || village.isBlank()) {
                    throw new IllegalArgumentException("state, district, tehsil, and village are required for VILLAGE scope");
                }
                fromClause = "FROM land_records lr ";
                whereClause.append("WHERE lr.state = ? AND lr.district = ? AND lr.tehsil = ? AND lr.village = ? ");
                params.add(state.trim());
                params.add(district.trim());
                params.add(tehsil.trim());
                params.add(village.trim());
            }
            case PROJECT -> {
                if (projectId == null) {
                    throw new IllegalArgumentException("projectId is required for PROJECT scope");
                }
                fromClause = "FROM project_land_records plr JOIN land_records lr ON plr.land_record_id = lr.id ";
                whereClause.append("WHERE plr.project_id = ? ");
                params.add(projectId);
            }
            default -> throw new IllegalArgumentException("Unsupported scope type: " + scopeType);
        }

        // Get source data timestamp
        String maxTsSql = "SELECT MAX(lr.updated_at) " + fromClause + whereClause;
        Timestamp maxTs = jdbcTemplate.queryForObject(maxTsSql, Timestamp.class, params.toArray());
        Instant sourceDataTimestamp = maxTs != null ? maxTs.toInstant() : Instant.now();

        return switch (indicatorCode) {
            case "PARCEL_COUNT_BY_LAND_USE" -> calculateCountByField(fromClause, whereClause.toString(), params, "lr.land_use_type", sourceDataTimestamp);
            case "AREA_BY_LAND_USE" -> calculateAreaByField(fromClause, whereClause.toString(), params, "lr.land_use_type", sourceDataTimestamp);
            case "LAND_USE_SHARE" -> calculateShareByField(fromClause, whereClause.toString(), params, "lr.land_use_type", sourceDataTimestamp);
            case "PARCEL_COUNT_BY_OWNERSHIP" -> calculateCountByField(fromClause, whereClause.toString(), params, "lr.ownership_type", sourceDataTimestamp);
            case "AREA_BY_OWNERSHIP" -> calculateAreaByField(fromClause, whereClause.toString(), params, "lr.ownership_type", sourceDataTimestamp);
            case "OWNERSHIP_SHARE" -> calculateShareByField(fromClause, whereClause.toString(), params, "lr.ownership_type", sourceDataTimestamp);
            case "ACTIVE_PARCEL_COUNT" -> calculateStatusCount(fromClause, whereClause.toString(), params, "ACTIVE", sourceDataTimestamp);
            case "DISPUTED_PARCEL_COUNT" -> calculateStatusCount(fromClause, whereClause.toString(), params, "DISPUTED", sourceDataTimestamp);
            case "PENDING_VERIFICATION_COUNT" -> calculateStatusCount(fromClause, whereClause.toString(), params, "PENDING_VERIFICATION", sourceDataTimestamp);
            case "INACTIVE_PARCEL_COUNT" -> calculateStatusCount(fromClause, whereClause.toString(), params, "INACTIVE", sourceDataTimestamp);
            default -> throw new IllegalArgumentException("Unsupported calculation for indicator code: " + indicatorCode);
        };
    }

    private CalculationResult calculateCountByField(
            String fromClause, String whereClause, List<Object> params, String field, Instant sourceDataTimestamp) {
        String sql = "SELECT " + field + " AS category, COUNT(*) AS cnt " + fromClause + whereClause + "GROUP BY " + field;
        Map<String, Long> breakdown = new LinkedHashMap<>();
        long total = 0;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, params.toArray());
        for (Map<String, Object> row : rows) {
            String cat = row.get("category") != null ? row.get("category").toString() : "OTHER";
            long count = ((Number) row.get("cnt")).longValue();
            breakdown.put(cat, count);
            total += count;
        }

        return new CalculationResult(
                BigDecimal.valueOf(total),
                null,
                toJson(breakdown),
                sourceDataTimestamp
        );
    }

    private CalculationResult calculateAreaByField(
            String fromClause, String whereClause, List<Object> params, String field, Instant sourceDataTimestamp) {
        String sql = "SELECT " + field + " AS category, COALESCE(SUM(lr.land_area_sq_meters), 0) AS total_area " + fromClause + whereClause + "GROUP BY " + field;
        Map<String, BigDecimal> breakdown = new LinkedHashMap<>();
        BigDecimal totalArea = BigDecimal.ZERO;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, params.toArray());
        for (Map<String, Object> row : rows) {
            String cat = row.get("category") != null ? row.get("category").toString() : "OTHER";
            BigDecimal area = (BigDecimal) row.get("total_area");
            if (area == null) {
                area = BigDecimal.ZERO;
            }
            breakdown.put(cat, area);
            totalArea = totalArea.add(area);
        }

        return new CalculationResult(
                totalArea.setScale(2, RoundingMode.HALF_UP),
                null,
                toJson(breakdown),
                sourceDataTimestamp
        );
    }

    private CalculationResult calculateShareByField(
            String fromClause, String whereClause, List<Object> params, String field, Instant sourceDataTimestamp) {
        String sql = "SELECT " + field + " AS category, COALESCE(SUM(lr.land_area_sq_meters), 0) AS total_area " + fromClause + whereClause + "GROUP BY " + field;
        Map<String, BigDecimal> areaMap = new LinkedHashMap<>();
        BigDecimal totalArea = BigDecimal.ZERO;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, params.toArray());
        for (Map<String, Object> row : rows) {
            String cat = row.get("category") != null ? row.get("category").toString() : "OTHER";
            BigDecimal area = (BigDecimal) row.get("total_area");
            if (area == null) {
                area = BigDecimal.ZERO;
            }
            areaMap.put(cat, area);
            totalArea = totalArea.add(area);
        }

        Map<String, BigDecimal> shareMap = new LinkedHashMap<>();
        BigDecimal dominantShare = BigDecimal.ZERO;
        if (totalArea.compareTo(BigDecimal.ZERO) > 0) {
            for (Map.Entry<String, BigDecimal> entry : areaMap.entrySet()) {
                BigDecimal share = entry.getValue()
                        .multiply(BigDecimal.valueOf(100))
                        .divide(totalArea, 4, RoundingMode.HALF_UP);
                shareMap.put(entry.getKey(), share);
                if (share.compareTo(dominantShare) > 0) {
                    dominantShare = share;
                }
            }
        }

        return new CalculationResult(
                dominantShare.setScale(2, RoundingMode.HALF_UP),
                totalArea.setScale(2, RoundingMode.HALF_UP),
                toJson(shareMap),
                sourceDataTimestamp
        );
    }

    private CalculationResult calculateStatusCount(
            String fromClause, String whereClause, List<Object> params, String targetStatus, Instant sourceDataTimestamp) {
        String totalSql = "SELECT COUNT(*) " + fromClause + whereClause;
        long totalParcels = jdbcTemplate.queryForObject(totalSql, Long.class, params.toArray());

        String targetSql = "SELECT COUNT(*) " + fromClause + whereClause + " AND lr.status = ?";
        List<Object> statusParams = new ArrayList<>(params);
        statusParams.add(targetStatus);
        long targetCount = jdbcTemplate.queryForObject(targetSql, Long.class, statusParams.toArray());

        Map<String, Object> breakdown = new LinkedHashMap<>();
        breakdown.put(targetStatus.toLowerCase() + "Parcels", targetCount);
        breakdown.put("totalParcels", totalParcels);

        return new CalculationResult(
                BigDecimal.valueOf(targetCount),
                BigDecimal.valueOf(totalParcels),
                toJson(breakdown),
                sourceDataTimestamp
        );
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JacksonException e) {
            return "{}";
        }
    }
}
