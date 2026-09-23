package com.bhoomidrishti.policy.service;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.service.CollaborationSecurityService;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.policy.dto.CompareScenariosRequest;
import com.bhoomidrishti.policy.dto.DistributionDelta;
import com.bhoomidrishti.policy.dto.DistributionItem;
import com.bhoomidrishti.policy.dto.MetricDeltas;
import com.bhoomidrishti.policy.dto.PairwiseComparison;
import com.bhoomidrishti.policy.dto.ScenarioComparisonItem;
import com.bhoomidrishti.policy.dto.ScenarioComparisonResponse;
import com.bhoomidrishti.policy.dto.ScenarioMetrics;
import com.bhoomidrishti.policy.dto.ScenarioResultTarget;
import com.bhoomidrishti.policy.entity.PolicyScenario;
import com.bhoomidrishti.policy.entity.ScenarioResult;
import com.bhoomidrishti.policy.repository.PolicyScenarioRepository;
import com.bhoomidrishti.policy.repository.ScenarioEvidenceRepository;
import com.bhoomidrishti.policy.repository.ScenarioResultRepository;
import tools.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Deterministic, purely descriptive scenario comparison engine.
 *
 * <p>Invariants:
 * <ul>
 *   <li>Purely descriptive: calculates mathematical differences between persisted ScenarioResult snapshots.</li>
 *   <li>Does NOT decide which policy is better.</li>
 *   <li>Does NOT recommend a preferred scenario.</li>
 *   <li>Does NOT rank scenarios or declare a winner.</li>
 *   <li>Does NOT predict future outcomes or use LLMs.</li>
 *   <li>Never re-executes simulations: operates strictly on persisted results (COMPARE != RE-RUN).</li>
 *   <li>Enforces project-level read authorization for every scenario involved.</li>
 *   <li>Missing distribution categories are treated as zero.</li>
 * </ul>
 */
@Service
@Transactional(readOnly = true)
public class PolicyComparisonService {

    public static final int MIN_SCENARIOS = 2;
    public static final int MAX_SCENARIOS = 10;

    private final PolicyScenarioRepository scenarioRepository;
    private final ScenarioResultRepository resultRepository;
    private final ScenarioEvidenceRepository evidenceRepository;
    private final CollaborationSecurityService securityService;
    private final ObjectMapper objectMapper;

    public PolicyComparisonService(
            PolicyScenarioRepository scenarioRepository,
            ScenarioResultRepository resultRepository,
            ScenarioEvidenceRepository evidenceRepository,
            CollaborationSecurityService securityService,
            ObjectMapper objectMapper
    ) {
        this.scenarioRepository = scenarioRepository;
        this.resultRepository = resultRepository;
        this.evidenceRepository = evidenceRepository;
        this.securityService = securityService;
        this.objectMapper = objectMapper;
    }

    /**
     * Compares 2 to 10 completed scenario results.
     */
    public ScenarioComparisonResponse compareScenarios(CompareScenariosRequest request, Authentication auth) {
        if (request == null) {
            throw new IllegalArgumentException("Comparison request cannot be null");
        }

        List<ScenarioResultTarget> targets = request.getEffectiveTargets();
        if (targets == null || targets.size() < MIN_SCENARIOS) {
            throw new IllegalArgumentException("Scenario comparison requires at least " + MIN_SCENARIOS + " scenarios");
        }
        if (targets.size() > MAX_SCENARIOS) {
            throw new IllegalArgumentException("Scenario comparison supports at most " + MAX_SCENARIOS + " scenarios");
        }

        // Validate uniqueness of scenario IDs
        Set<UUID> seenScenarioIds = new HashSet<>();
        for (ScenarioResultTarget target : targets) {
            if (target.scenarioId() == null) {
                throw new IllegalArgumentException("Scenario ID must not be null");
            }
            if (!seenScenarioIds.add(target.scenarioId())) {
                throw new IllegalArgumentException("Duplicate scenario ID in comparison request: " + target.scenarioId());
            }
        }

        User currentUser = securityService.resolveCurrentUser(auth).orElse(null);

        // Resolve each scenario and its designated result snapshot
        List<ScenarioComparisonItem> items = new ArrayList<>();
        for (ScenarioResultTarget target : targets) {
            PolicyScenario scenario = scenarioRepository.findById(target.scenarioId())
                    .orElseThrow(() -> new ResourceNotFoundException("Scenario not found: " + target.scenarioId()));

            // Authorization: user must have view access to the scenario's project.
            // If unauthorized, throw ResourceNotFoundException to avoid leaking existence of private projects/scenarios.
            if (!securityService.canViewProject(scenario.getProject(), currentUser)) {
                throw new ResourceNotFoundException("Scenario not found: " + target.scenarioId());
            }

            ScenarioResult result;
            if (target.resultId() != null) {
                result = resultRepository.findById(target.resultId())
                        .orElseThrow(() -> new ResourceNotFoundException("Scenario result not found: " + target.resultId()));
                // Cross-scenario check: verify result belongs to this scenario
                if (result.getScenario() == null || !result.getScenario().getId().equals(scenario.getId())) {
                    throw new IllegalArgumentException("Result " + target.resultId() + " does not belong to scenario " + scenario.getId());
                }
            } else {
                result = resultRepository.findFirstByScenarioIdOrderByExecutedAtDesc(scenario.getId())
                        .orElseThrow(() -> new IllegalStateException("Scenario has no completed simulation results: " + scenario.getId()));
            }

            long evidenceCount = evidenceRepository.countByScenarioId(scenario.getId());
            ScenarioMetrics metrics = buildMetrics(result);
            Map<String, DistributionItem> landUseDist = parseDistribution(
                    result.getLandUseDistributionJson(), result.getTotalAreaAffectedSqm());
            Map<String, DistributionItem> ownershipDist = parseDistribution(
                    result.getOwnershipDistributionJson(), result.getTotalAreaAffectedSqm());

            items.add(new ScenarioComparisonItem(
                    scenario.getId(),
                    scenario.getName(),
                    scenario.getScenarioType(),
                    result.getId(),
                    result.getExecutedAt(),
                    metrics,
                    landUseDist,
                    ownershipDist,
                    evidenceCount
            ));
        }

        // Generate pairwise comparisons for all pairs (i < j)
        List<PairwiseComparison> pairwise = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            for (int j = i + 1; j < items.size(); j++) {
                pairwise.add(comparePair(items.get(i), items.get(j)));
            }
        }

        return new ScenarioComparisonResponse(items, pairwise);
    }

    private ScenarioMetrics buildMetrics(ScenarioResult r) {
        return new ScenarioMetrics(
                r.getTotalParcelsEvaluated() != null ? r.getTotalParcelsEvaluated() : 0L,
                r.getTotalParcelsAffected() != null ? r.getTotalParcelsAffected() : 0L,
                r.getTotalAreaAffectedSqm() != null ? r.getTotalAreaAffectedSqm() : BigDecimal.ZERO,
                r.getBaselineAreaSqm() != null ? r.getBaselineAreaSqm() : BigDecimal.ZERO,
                r.getSimulatedAreaSqm() != null ? r.getSimulatedAreaSqm() : BigDecimal.ZERO,
                r.getDisputedParcelsCount() != null ? r.getDisputedParcelsCount() : 0L,
                r.getDisputedAreaSqm() != null ? r.getDisputedAreaSqm() : BigDecimal.ZERO
        );
    }

    private Map<String, DistributionItem> parseDistribution(String json, BigDecimal totalAreaSqm) {
        if (json == null || json.isBlank() || json.equals("{}")) {
            return Collections.emptyMap();
        }

        Map<String, DistributionItem> map = new TreeMap<>();
        try {
            Map<?, ?> rawMap = objectMapper.readValue(json, Map.class);
            if (rawMap != null) {
                for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
                    String category = entry.getKey().toString();
                    if (entry.getValue() instanceof Map<?, ?> valMap) {
                        long count = valMap.get("parcelCount") instanceof Number n ? n.longValue() : 0L;
                        BigDecimal area = BigDecimal.ZERO;
                        if (valMap.get("areaSqMeters") != null) {
                            area = new BigDecimal(valMap.get("areaSqMeters").toString());
                        }

                        BigDecimal pct = BigDecimal.ZERO;
                        if (totalAreaSqm != null && totalAreaSqm.compareTo(BigDecimal.ZERO) > 0) {
                            pct = area.multiply(BigDecimal.valueOf(100))
                                    .divide(totalAreaSqm, 4, RoundingMode.HALF_UP);
                        }

                        map.put(category, new DistributionItem(count, area, pct));
                    }
                }
            }
        } catch (Exception e) {
            // In case of malformed distribution json, return empty map
            return Collections.emptyMap();
        }
        return map;
    }

    private PairwiseComparison comparePair(ScenarioComparisonItem left, ScenarioComparisonItem right) {
        MetricDeltas metricDeltas = calculateMetricDeltas(left.metrics(), right.metrics());
        List<DistributionDelta> landUseDeltas = calculateDistributionDeltas(
                left.landUseDistribution(), right.landUseDistribution());
        List<DistributionDelta> ownershipDeltas = calculateDistributionDeltas(
                left.ownershipDistribution(), right.ownershipDistribution());

        return new PairwiseComparison(
                left.scenarioId(),
                left.scenarioName(),
                right.scenarioId(),
                right.scenarioName(),
                metricDeltas,
                landUseDeltas,
                ownershipDeltas
        );
    }

    private MetricDeltas calculateMetricDeltas(ScenarioMetrics left, ScenarioMetrics right) {
        long evalDelta = right.totalParcelsEvaluated() - left.totalParcelsEvaluated();
        long affectedDelta = right.totalParcelsAffected() - left.totalParcelsAffected();
        BigDecimal totalAreaDelta = right.totalAreaAffectedSqm().subtract(left.totalAreaAffectedSqm());
        BigDecimal baselineAreaDelta = right.baselineAreaSqm().subtract(left.baselineAreaSqm());
        BigDecimal simulatedAreaDelta = right.simulatedAreaSqm().subtract(left.simulatedAreaSqm());
        long disputedCountDelta = right.disputedParcelsCount() - left.disputedParcelsCount();
        BigDecimal disputedAreaDelta = right.disputedAreaSqm().subtract(left.disputedAreaSqm());

        // Percentage point difference for affected parcels ratio:
        // leftRate = (leftAffected / leftEvaluated) * 100
        // rightRate = (rightAffected / rightEvaluated) * 100
        // delta = rightRate - leftRate
        BigDecimal leftRate = BigDecimal.ZERO;
        if (left.totalParcelsEvaluated() > 0) {
            leftRate = BigDecimal.valueOf(left.totalParcelsAffected())
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(left.totalParcelsEvaluated()), 4, RoundingMode.HALF_UP);
        }

        BigDecimal rightRate = BigDecimal.ZERO;
        if (right.totalParcelsEvaluated() > 0) {
            rightRate = BigDecimal.valueOf(right.totalParcelsAffected())
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(right.totalParcelsEvaluated()), 4, RoundingMode.HALF_UP);
        }

        BigDecimal affectedRatePpDelta = rightRate.subtract(leftRate);

        return new MetricDeltas(
                evalDelta,
                affectedDelta,
                totalAreaDelta,
                baselineAreaDelta,
                simulatedAreaDelta,
                disputedCountDelta,
                disputedAreaDelta,
                affectedRatePpDelta
        );
    }

    private List<DistributionDelta> calculateDistributionDeltas(
            Map<String, DistributionItem> leftMap, Map<String, DistributionItem> rightMap) {
        Set<String> allCategories = new TreeSet<>();
        if (leftMap != null) allCategories.addAll(leftMap.keySet());
        if (rightMap != null) allCategories.addAll(rightMap.keySet());

        List<DistributionDelta> deltas = new ArrayList<>();
        for (String cat : allCategories) {
            DistributionItem leftItem = (leftMap != null) ? leftMap.get(cat) : null;
            DistributionItem rightItem = (rightMap != null) ? rightMap.get(cat) : null;

            long leftCount = leftItem != null ? leftItem.parcelCount() : 0L;
            BigDecimal leftArea = leftItem != null ? leftItem.areaSqMeters() : BigDecimal.ZERO;
            BigDecimal leftPct = leftItem != null ? leftItem.areaPercentage() : BigDecimal.ZERO;

            long rightCount = rightItem != null ? rightItem.parcelCount() : 0L;
            BigDecimal rightArea = rightItem != null ? rightItem.areaSqMeters() : BigDecimal.ZERO;
            BigDecimal rightPct = rightItem != null ? rightItem.areaPercentage() : BigDecimal.ZERO;

            long countDelta = rightCount - leftCount;
            BigDecimal areaDelta = rightArea.subtract(leftArea);
            BigDecimal pctPpDelta = rightPct.subtract(leftPct);

            deltas.add(new DistributionDelta(
                    cat,
                    leftCount,
                    rightCount,
                    countDelta,
                    leftArea,
                    rightArea,
                    areaDelta,
                    leftPct,
                    rightPct,
                    pctPpDelta
            ));
        }
        return deltas;
    }
}
