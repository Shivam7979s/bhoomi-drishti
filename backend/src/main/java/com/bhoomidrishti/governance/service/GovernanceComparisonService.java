package com.bhoomidrishti.governance.service;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.service.CollaborationSecurityService;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.governance.dto.BreakdownVarianceItemDTO;
import com.bhoomidrishti.governance.dto.CurrentIndicatorQueryResult;
import com.bhoomidrishti.governance.dto.GovernanceComparisonRequest;
import com.bhoomidrishti.governance.dto.GovernanceComparisonResponse;
import com.bhoomidrishti.governance.dto.GovernanceEvidenceDeltaDTO;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorEvidenceResponse;
import com.bhoomidrishti.governance.dto.GovernanceMetricDeltaDTO;
import com.bhoomidrishti.governance.dto.GovernanceMilestoneDTO;
import com.bhoomidrishti.governance.dto.GovernanceScopeQuery;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorDefinition;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorSnapshot;
import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import com.bhoomidrishti.governance.entity.SnapshotVisibility;
import com.bhoomidrishti.governance.repository.GovernanceIndicatorSnapshotRepository;
import tools.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Deterministic, purely descriptive governance comparison engine.
 *
 * <p>Supports:
 * <ul>
 *   <li>Mode A: Snapshot vs Snapshot (historical milestone comparison).</li>
 *   <li>Mode B: Snapshot vs Live (historical baseline vs real-time cadastral query).</li>
 * </ul>
 *
 * <p>Guarantees:
 * <ul>
 *   <li>Read-only: creates no snapshots, modifies no snapshots, writes zero audit/evidence records.</li>
 *   <li>Deterministic math: exact absolute delta and percentage change with zero-denominator safety.</li>
 *   <li>Neutral directionality: preserves objectivity without assigning arbitrary governance value judgments.</li>
 *   <li>Strict scope compatibility: prevents invalid comparisons across mismatched administrative scopes or projects.</li>
 *   <li>IDOR protection: conceals unauthorized project/snapshot existence with HTTP 404.</li>
 *   <li>Calculates chronological ordering and flags version drift factual notices.</li>
 * </ul>
 */
@Service
@Transactional(readOnly = true)
public class GovernanceComparisonService {

    public static final String TREND_DIRECTION_NOT_DEFINED = "NOT_DEFINED";

    private final GovernanceIndicatorSnapshotRepository snapshotRepository;
    private final GovernanceIndicatorService governanceIndicatorService;
    private final GovernanceQueryService governanceQueryService;
    private final CollaborationSecurityService collaborationSecurityService;
    private final ObjectMapper objectMapper;

    public GovernanceComparisonService(
            GovernanceIndicatorSnapshotRepository snapshotRepository,
            GovernanceIndicatorService governanceIndicatorService,
            GovernanceQueryService governanceQueryService,
            CollaborationSecurityService collaborationSecurityService,
            ObjectMapper objectMapper) {
        this.snapshotRepository = snapshotRepository;
        this.governanceIndicatorService = governanceIndicatorService;
        this.governanceQueryService = governanceQueryService;
        this.collaborationSecurityService = collaborationSecurityService;
        this.objectMapper = objectMapper;
    }

    /**
     * Executes a deterministic comparison between two snapshots or between a snapshot and current live data.
     *
     * @param request the comparison request containing baselineSnapshotId and targetSnapshotId or compareToLive
     * @param auth current user authentication context
     * @return deterministic comparison response
     */
    public GovernanceComparisonResponse compareGovernanceSnapshots(
            GovernanceComparisonRequest request, Authentication auth) {
        if (request == null) {
            throw new IllegalArgumentException("Comparison request cannot be null");
        }
        if (request.baselineSnapshotId() == null) {
            throw new IllegalArgumentException("baselineSnapshotId is required");
        }

        boolean compareToLive = request.isCompareToLive();
        if (!compareToLive && request.targetSnapshotId() == null) {
            throw new IllegalArgumentException("targetSnapshotId is required when compareToLive is false");
        }
        if (!compareToLive && request.baselineSnapshotId().equals(request.targetSnapshotId())) {
            throw new IllegalArgumentException("Cannot compare a snapshot with itself");
        }

        // 1. Resolve requested baseline snapshot
        GovernanceIndicatorSnapshot snapshotA = snapshotRepository.findById(request.baselineSnapshotId())
                .orElseThrow(() -> new ResourceNotFoundException("Governance snapshot not found: " + request.baselineSnapshotId()));
        checkSnapshotAccess(snapshotA, auth);

        GovernanceIndicatorDefinition def = snapshotA.getIndicatorDefinition();

        if (compareToLive) {
            return compareSnapshotWithLive(snapshotA, def, auth);
        } else {
            // 2. Resolve requested target snapshot
            GovernanceIndicatorSnapshot snapshotB = snapshotRepository.findById(request.targetSnapshotId())
                    .orElseThrow(() -> new ResourceNotFoundException("Governance snapshot not found: " + request.targetSnapshotId()));
            checkSnapshotAccess(snapshotB, auth);

            return compareTwoSnapshots(snapshotA, snapshotB, def, auth);
        }
    }

    // -------------------------------------------------------------------------
    // Mode A: Snapshot vs Snapshot
    // -------------------------------------------------------------------------

    private GovernanceComparisonResponse compareTwoSnapshots(
            GovernanceIndicatorSnapshot snapshotA,
            GovernanceIndicatorSnapshot snapshotB,
            GovernanceIndicatorDefinition def,
            Authentication auth) {

        // Validate indicator compatibility
        if (!Objects.equals(def.getCode(), snapshotB.getIndicatorDefinition().getCode())) {
            throw new IllegalArgumentException(String.format(
                    "Cannot compare snapshots of different indicators: %s vs %s",
                    def.getCode(),
                    snapshotB.getIndicatorDefinition().getCode()));
        }

        // Validate scope compatibility
        validateScopeCompatibility(snapshotA, snapshotB);

        // Establish chronology (earlier = baseline, later = target)
        GovernanceIndicatorSnapshot baseline;
        GovernanceIndicatorSnapshot target;
        boolean chronologicalReversal = false;

        Instant timeA = snapshotA.getAsOf() != null ? snapshotA.getAsOf() : snapshotA.getGeneratedAt();
        Instant timeB = snapshotB.getAsOf() != null ? snapshotB.getAsOf() : snapshotB.getGeneratedAt();

        if (timeA != null && timeB != null && timeA.isAfter(timeB)) {
            baseline = snapshotB;
            target = snapshotA;
            chronologicalReversal = true;
        } else {
            baseline = snapshotA;
            target = snapshotB;
        }

        // Fetch statutory evidence for both snapshots
        List<GovernanceIndicatorEvidenceResponse> baselineEvidence =
                governanceIndicatorService.getSnapshotEvidence(baseline.getId(), auth);
        List<GovernanceIndicatorEvidenceResponse> targetEvidence =
                governanceIndicatorService.getSnapshotEvidence(target.getId(), auth);

        GovernanceMilestoneDTO baselineMilestone = toMilestoneDTO(baseline, baselineEvidence.size(), false);
        GovernanceMilestoneDTO targetMilestone = toMilestoneDTO(target, targetEvidence.size(), false);

        GovernanceMetricDeltaDTO quantitativeVariance = calculateMetricDelta(
                baseline.getNumericValue(), target.getNumericValue(),
                baseline.getDenominator(), target.getDenominator());

        List<BreakdownVarianceItemDTO> breakdownVariances = calculateBreakdownVariances(
                baseline.getBreakdownJson(), target.getBreakdownJson());

        GovernanceEvidenceDeltaDTO evidenceDelta = calculateEvidenceDelta(baselineEvidence, targetEvidence);

        boolean calculationVersionMismatch = !Objects.equals(
                baseline.getCalculationVersion(), target.getCalculationVersion());

        Long elapsedDays = null;
        if (timeA != null && timeB != null) {
            elapsedDays = Math.abs(Duration.between(timeA, timeB).toDays());
        }

        return new GovernanceComparisonResponse(
                def.getCode(),
                def.getName(),
                def.getCategory(),
                def.getUnit(),
                baseline.getScopeType(),
                baseline.getState(),
                baseline.getDistrict(),
                baseline.getTehsil(),
                baseline.getVillage(),
                baseline.getProject() != null ? baseline.getProject().getId() : null,
                baselineMilestone,
                targetMilestone,
                quantitativeVariance,
                breakdownVariances,
                evidenceDelta,
                calculationVersionMismatch,
                elapsedDays,
                chronologicalReversal
        );
    }

    // -------------------------------------------------------------------------
    // Mode B: Snapshot vs Live
    // -------------------------------------------------------------------------

    private GovernanceComparisonResponse compareSnapshotWithLive(
            GovernanceIndicatorSnapshot baseline,
            GovernanceIndicatorDefinition def,
            Authentication auth) {

        GovernanceScopeQuery scopeQuery = new GovernanceScopeQuery(
                baseline.getScopeType(),
                baseline.getState(),
                baseline.getDistrict(),
                baseline.getTehsil(),
                baseline.getVillage(),
                baseline.getProject() != null ? baseline.getProject().getId() : null
        );

        CurrentIndicatorQueryResult liveResult = governanceQueryService.calculateCurrentIndicator(
                def.getCode(), scopeQuery, auth);

        List<GovernanceIndicatorEvidenceResponse> baselineEvidence =
                governanceIndicatorService.getSnapshotEvidence(baseline.getId(), auth);

        GovernanceMilestoneDTO baselineMilestone = toMilestoneDTO(baseline, baselineEvidence.size(), false);

        Instant liveTime = liveResult.sourceDataTimestamp() != null
                ? liveResult.sourceDataTimestamp()
                : Instant.now();

        GovernanceMilestoneDTO targetMilestone = new GovernanceMilestoneDTO(
                null,
                liveTime,
                liveResult.numericValue(),
                liveResult.denominator(),
                liveResult.calculationVersion(),
                true,
                0
        );

        GovernanceMetricDeltaDTO quantitativeVariance = calculateMetricDelta(
                baseline.getNumericValue(), liveResult.numericValue(),
                baseline.getDenominator(), liveResult.denominator());

        List<BreakdownVarianceItemDTO> breakdownVariances = calculateBreakdownVariances(
                baseline.getBreakdownJson(), liveResult.breakdownJson());

        GovernanceEvidenceDeltaDTO evidenceDelta = new GovernanceEvidenceDeltaDTO(
                0, 0, 0,
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList()
        );

        boolean calculationVersionMismatch = !Objects.equals(
                baseline.getCalculationVersion(), liveResult.calculationVersion());

        Long elapsedDays = null;
        if (baseline.getAsOf() != null) {
            elapsedDays = Math.abs(Duration.between(baseline.getAsOf(), liveTime).toDays());
        }

        return new GovernanceComparisonResponse(
                def.getCode(),
                def.getName(),
                def.getCategory(),
                def.getUnit(),
                baseline.getScopeType(),
                baseline.getState(),
                baseline.getDistrict(),
                baseline.getTehsil(),
                baseline.getVillage(),
                baseline.getProject() != null ? baseline.getProject().getId() : null,
                baselineMilestone,
                targetMilestone,
                quantitativeVariance,
                breakdownVariances,
                evidenceDelta,
                calculationVersionMismatch,
                elapsedDays,
                false
        );
    }

    // -------------------------------------------------------------------------
    // Quantitative and Breakdown Math
    // -------------------------------------------------------------------------

    private GovernanceMetricDeltaDTO calculateMetricDelta(
            BigDecimal baseVal, BigDecimal targetVal,
            BigDecimal baseDenom, BigDecimal targetDenom) {
        if (baseVal == null || targetVal == null) {
            return new GovernanceMetricDeltaDTO(
                    null, null, false, TREND_DIRECTION_NOT_DEFINED, null);
        }

        BigDecimal delta = targetVal.subtract(baseVal);
        BigDecimal pctChange = null;
        boolean pctDefined = false;

        if (baseVal.compareTo(BigDecimal.ZERO) != 0) {
            pctChange = delta.multiply(BigDecimal.valueOf(100))
                    .divide(baseVal.abs(), 4, RoundingMode.HALF_UP);
            pctDefined = true;
        }

        BigDecimal denomDelta = null;
        if (baseDenom != null && targetDenom != null) {
            denomDelta = targetDenom.subtract(baseDenom);
        }

        return new GovernanceMetricDeltaDTO(
                delta,
                pctChange,
                pctDefined,
                TREND_DIRECTION_NOT_DEFINED,
                denomDelta
        );
    }

    private List<BreakdownVarianceItemDTO> calculateBreakdownVariances(String baselineJson, String targetJson) {
        Map<String, Object> baselineMap = parseBreakdown(baselineJson);
        Map<String, Object> targetMap = parseBreakdown(targetJson);

        Set<String> allKeys = new TreeSet<>();
        allKeys.addAll(baselineMap.keySet());
        allKeys.addAll(targetMap.keySet());

        List<BreakdownVarianceItemDTO> items = new ArrayList<>();
        for (String key : allKeys) {
            Object rawBase = baselineMap.get(key);
            Object rawTarget = targetMap.get(key);

            BigDecimal baseNum = parseNumeric(rawBase);
            BigDecimal targetNum = parseNumeric(rawTarget);

            String baseRawStr = rawBase != null ? rawBase.toString() : null;
            String targetRawStr = rawTarget != null ? rawTarget.toString() : null;

            BigDecimal delta = null;
            BigDecimal pctChange = null;
            boolean pctDefined = false;

            if (baseNum != null && targetNum != null) {
                delta = targetNum.subtract(baseNum);
                if (baseNum.compareTo(BigDecimal.ZERO) != 0) {
                    pctChange = delta.multiply(BigDecimal.valueOf(100))
                            .divide(baseNum.abs(), 4, RoundingMode.HALF_UP);
                    pctDefined = true;
                }
            }

            items.add(new BreakdownVarianceItemDTO(
                    key,
                    baseNum,
                    targetNum,
                    delta,
                    pctChange,
                    pctDefined,
                    baseRawStr,
                    targetRawStr
            ));
        }
        return items;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseBreakdown(String json) {
        if (json == null || json.isBlank() || json.equals("{}")) {
            return Collections.emptyMap();
        }
        try {
            Map<String, Object> map = objectMapper.readValue(json, Map.class);
            return map != null ? map : Collections.emptyMap();
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    private BigDecimal parseNumeric(Object obj) {
        if (obj == null) {
            return null;
        }
        if (obj instanceof Number n) {
            return new BigDecimal(n.toString());
        }
        if (obj instanceof String s) {
            try {
                return new BigDecimal(s.trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    // -------------------------------------------------------------------------
    // Statutory Evidence Provenance Diff
    // -------------------------------------------------------------------------

    private GovernanceEvidenceDeltaDTO calculateEvidenceDelta(
            List<GovernanceIndicatorEvidenceResponse> baselineEvidence,
            List<GovernanceIndicatorEvidenceResponse> targetEvidence) {
        if (baselineEvidence == null) baselineEvidence = Collections.emptyList();
        if (targetEvidence == null) targetEvidence = Collections.emptyList();

        Map<String, GovernanceIndicatorEvidenceResponse> baseMap = new LinkedHashMap<>();
        for (GovernanceIndicatorEvidenceResponse ev : baselineEvidence) {
            baseMap.put(buildEvidenceProvenanceKey(ev), ev);
        }

        Map<String, GovernanceIndicatorEvidenceResponse> targetMap = new LinkedHashMap<>();
        for (GovernanceIndicatorEvidenceResponse ev : targetEvidence) {
            targetMap.put(buildEvidenceProvenanceKey(ev), ev);
        }

        List<GovernanceIndicatorEvidenceResponse> common = new ArrayList<>();
        List<GovernanceIndicatorEvidenceResponse> added = new ArrayList<>();
        List<GovernanceIndicatorEvidenceResponse> removed = new ArrayList<>();

        for (Map.Entry<String, GovernanceIndicatorEvidenceResponse> entry : targetMap.entrySet()) {
            if (baseMap.containsKey(entry.getKey())) {
                common.add(entry.getValue());
            } else {
                added.add(entry.getValue());
            }
        }

        for (Map.Entry<String, GovernanceIndicatorEvidenceResponse> entry : baseMap.entrySet()) {
            if (!targetMap.containsKey(entry.getKey())) {
                removed.add(entry.getValue());
            }
        }

        return new GovernanceEvidenceDeltaDTO(
                common.size(),
                added.size(),
                removed.size(),
                common,
                added,
                removed
        );
    }

    private String buildEvidenceProvenanceKey(GovernanceIndicatorEvidenceResponse ev) {
        if (ev == null) return "";
        if (ev.id() != null && ev.researchDocumentId() == null && ev.documentChunkId() == null) {
            return "id:" + ev.id();
        }
        String docId = ev.researchDocumentId() != null ? ev.researchDocumentId().toString() : "nodoc";
        String chunkId = ev.documentChunkId() != null ? ev.documentChunkId().toString() : "nochunk";
        String type = ev.evidenceType() != null ? ev.evidenceType().name() : "notype";
        return docId + ":" + chunkId + ":" + type;
    }

    // -------------------------------------------------------------------------
    // Helpers & Security
    // -------------------------------------------------------------------------

    private GovernanceMilestoneDTO toMilestoneDTO(
            GovernanceIndicatorSnapshot s, int evidenceCount, boolean isLive) {
        return new GovernanceMilestoneDTO(
                s.getId(),
                s.getAsOf(),
                s.getNumericValue(),
                s.getDenominator(),
                s.getCalculationVersion(),
                isLive,
                evidenceCount
        );
    }

    private void validateScopeCompatibility(GovernanceIndicatorSnapshot a, GovernanceIndicatorSnapshot b) {
        if (a.getScopeType() != b.getScopeType()) {
            throw new IllegalArgumentException(String.format(
                    "Cannot compare snapshots with different scope types: %s vs %s",
                    a.getScopeType(), b.getScopeType()));
        }

        if (a.getScopeType() == GovernanceScopeType.PROJECT) {
            UUID projA = a.getProject() != null ? a.getProject().getId() : null;
            UUID projB = b.getProject() != null ? b.getProject().getId() : null;
            if (!Objects.equals(projA, projB)) {
                throw new IllegalArgumentException(String.format(
                        "Cannot compare snapshots from different projects: %s vs %s", projA, projB));
            }
            return;
        }

        checkScopeStringMatch("state", a.getState(), b.getState());
        if (a.getScopeType() == GovernanceScopeType.DISTRICT
                || a.getScopeType() == GovernanceScopeType.TEHSIL
                || a.getScopeType() == GovernanceScopeType.VILLAGE) {
            checkScopeStringMatch("district", a.getDistrict(), b.getDistrict());
        }
        if (a.getScopeType() == GovernanceScopeType.TEHSIL
                || a.getScopeType() == GovernanceScopeType.VILLAGE) {
            checkScopeStringMatch("tehsil", a.getTehsil(), b.getTehsil());
        }
        if (a.getScopeType() == GovernanceScopeType.VILLAGE) {
            checkScopeStringMatch("village", a.getVillage(), b.getVillage());
        }
    }

    private void checkScopeStringMatch(String fieldName, String valA, String valB) {
        String normA = valA != null ? valA.trim().toLowerCase() : "";
        String normB = valB != null ? valB.trim().toLowerCase() : "";
        if (!normA.equals(normB)) {
            throw new IllegalArgumentException(String.format(
                    "Cannot compare snapshots with mismatched %s: '%s' vs '%s'", fieldName, valA, valB));
        }
    }

    private void checkSnapshotAccess(GovernanceIndicatorSnapshot snapshot, Authentication auth) {
        User user = collaborationSecurityService.resolveCurrentUser(auth).orElse(null);
        if (snapshot.getProject() != null) {
            collaborationSecurityService.checkCanViewProject(snapshot.getProject(), user);
        } else {
            if (snapshot.getVisibility() != SnapshotVisibility.PUBLISHED) {
                boolean isOfficialOrAdmin = user != null
                        && (user.getRole() == Role.GOVERNMENT_OFFICIAL || user.getRole() == Role.ADMIN);
                if (!isOfficialOrAdmin) {
                    throw new ResourceNotFoundException("Governance snapshot not found: " + snapshot.getId());
                }
            }
        }
    }
}
