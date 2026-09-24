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

    public CalculationResult calculateIndicator(
            String indicatorCode,
            GovernanceScopeType scopeType,
            String state,
            String district,
            String tehsil,
            String village,
            UUID projectId) {

        StringBuilder whereClause = new StringBuilder();
        List<Object> params = new ArrayList<>();

        String fromClause;
        if (scopeType == GovernanceScopeType.PROJECT) {
            fromClause = "FROM project_land_records plr JOIN land_records lr ON plr.land_record_id = lr.id ";
            whereClause.append("WHERE plr.project_id = ? ");
            params.add(projectId);
        } else {
            fromClause = "FROM land_records lr ";
            whereClause.append("WHERE 1=1 ");
            if (state != null && !state.isBlank()) {
                whereClause.append("AND lr.state = ? ");
                params.add(state);
            }
            if (district != null && !district.isBlank()) {
                whereClause.append("AND lr.district = ? ");
                params.add(district);
            }
            if (tehsil != null && !tehsil.isBlank()) {
                whereClause.append("AND lr.tehsil = ? ");
                params.add(tehsil);
            }
            if (village != null && !village.isBlank()) {
                whereClause.append("AND lr.village = ? ");
                params.add(village);
            }
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
