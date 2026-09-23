package com.bhoomidrishti.policy.service;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.collaboration.service.CollaborationSecurityService;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.landrecord.entity.OwnershipType;
import com.bhoomidrishti.policy.dto.ScenarioResultResponse;
import com.bhoomidrishti.policy.entity.PolicyScenario;
import com.bhoomidrishti.policy.entity.ScenarioParameter;
import com.bhoomidrishti.policy.entity.ScenarioResult;
import com.bhoomidrishti.policy.entity.ScenarioStatus;
import com.bhoomidrishti.policy.entity.ScenarioType;
import com.bhoomidrishti.policy.repository.PolicyScenarioRepository;
import com.bhoomidrishti.policy.repository.PolicySimulationQueryRepository;
import com.bhoomidrishti.policy.repository.PolicySimulationQueryRepository.AffectedParcelRecord;
import com.bhoomidrishti.policy.repository.PolicySimulationQueryRepository.CandidateParcel;
import com.bhoomidrishti.policy.repository.PolicySimulationQueryRepository.SpatialBoundingBox;
import com.bhoomidrishti.policy.repository.ScenarioParameterRepository;
import com.bhoomidrishti.policy.repository.ScenarioResultRepository;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Deterministic PostGIS Policy Simulation Engine.
 *
 * <p>Executes spatial and attribute analysis against existing land records according
 * to explicitly configured scenario parameters.
 *
 * <p><strong>Architectural Boundaries:</strong>
 * <ul>
 *   <li>This engine performs deterministic analysis over available land-record data.
 *       It does not predict future outcomes or recommend policy decisions.</li>
 *   <li>Never mutates actual {@code land_records} data.</li>
 *   <li>Never exposes or persists owner names or personal identifiers in simulation outputs.</li>
 *   <li>All spatial operations execute in PostgreSQL/PostGIS (SRID 4326, ST_DWithin geography for meters).</li>
 * </ul>
 */
@Service
@Transactional
public class PolicySimulationService {

    private final PolicyScenarioRepository scenarioRepository;
    private final ScenarioParameterRepository parameterRepository;
    private final ScenarioResultRepository resultRepository;
    private final PolicySimulationQueryRepository simulationQueryRepository;
    private final CollaborationSecurityService collaborationSecurityService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public PolicySimulationService(
            PolicyScenarioRepository scenarioRepository,
            ScenarioParameterRepository parameterRepository,
            ScenarioResultRepository resultRepository,
            PolicySimulationQueryRepository simulationQueryRepository,
            CollaborationSecurityService collaborationSecurityService,
            UserRepository userRepository,
            ObjectMapper objectMapper
    ) {
        this.scenarioRepository = scenarioRepository;
        this.parameterRepository = parameterRepository;
        this.resultRepository = resultRepository;
        this.simulationQueryRepository = simulationQueryRepository;
        this.collaborationSecurityService = collaborationSecurityService;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Executes the simulation for a scenario by authenticated context.
     */
    public ScenarioResultResponse executeScenario(UUID scenarioId, Authentication auth) {
        User user = collaborationSecurityService.resolveCurrentUser(auth)
                .orElseThrow(() -> new AccessDeniedException("Authentication required"));
        return executeScenario(scenarioId, user);
    }

    /**
     * Executes the simulation for a scenario by user UUID.
     */
    public ScenarioResultResponse executeScenario(UUID scenarioId, UUID executedById) {
        User user = userRepository.findById(executedById)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + executedById));
        return executeScenario(scenarioId, user);
    }

    /**
     * Main execution pipeline:
     * <ol>
     *   <li>Validate scenario and authorization</li>
     *   <li>Validate parameters</li>
     *   <li>Transition to RUNNING</li>
     *   <li>Resolve candidate parcels via PostGIS</li>
     *   <li>Calculate baseline and simulated metrics</li>
     *   <li>Persist ScenarioResult</li>
     *   <li>Persist ScenarioAffectedParcel records</li>
     *   <li>Transition to COMPLETED</li>
     * </ol>
     */
    public ScenarioResultResponse executeScenario(UUID scenarioId, User executedBy) {
        if (executedBy == null) {
            throw new AccessDeniedException("Authentication required");
        }

        PolicyScenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found: " + scenarioId));

        // 1. Authorization check
        collaborationSecurityService.checkCanContributeToProject(scenario.getProject(), executedBy);

        // 2. Lifecycle check
        if (scenario.getStatus() == ScenarioStatus.ARCHIVED) {
            throw new IllegalStateException("Cannot execute an archived scenario");
        }

        // 3. Parameter validation
        ScenarioParameter param = parameterRepository.findByScenarioId(scenarioId)
                .orElseThrow(() -> new IllegalStateException("Scenario has no parameters configured"));

        validateScenarioParameters(scenario.getScenarioType(), param);

        // 4. Mark status RUNNING (transactional, reverts on exception)
        scenario.setStatus(ScenarioStatus.RUNNING);
        scenarioRepository.save(scenario);

        // 5. Execute deterministic simulation computation
        SimulationOutput output = computeSimulation(scenario, param);

        // 6. Persist ScenarioResult
        ScenarioResult result = new ScenarioResult(scenario, executedBy);
        result.setExecutedAt(Instant.now());
        result.setTotalParcelsEvaluated(output.totalParcelsEvaluated());
        result.setTotalParcelsAffected(output.totalParcelsAffected());
        result.setTotalAreaAffectedSqm(output.totalAreaAffectedSqm());
        result.setBaselineAreaSqm(output.baselineAreaSqm());
        result.setSimulatedAreaSqm(output.simulatedAreaSqm());
        result.setDisputedParcelsCount(output.disputedParcelsCount());
        result.setDisputedAreaSqm(output.disputedAreaSqm());
        result.setLandUseDistributionJson(output.landUseDistributionJson());
        result.setOwnershipDistributionJson(output.ownershipDistributionJson());
        result.setSpatialSummaryJson(output.spatialSummaryJson());

        ScenarioResult savedResult = resultRepository.saveAndFlush(result);

        // 7. Persist affected parcels
        if (!output.affectedRecords().isEmpty()) {
            List<AffectedParcelRecord> recordsWithResultId = output.affectedRecords().stream()
                    .map(r -> new AffectedParcelRecord(
                            savedResult.getId(),
                            r.landRecordId(),
                            r.baselineLandUse(),
                            r.simulatedLandUse(),
                            r.parcelAreaSqm(),
                            r.status()
                    ))
                    .toList();
            simulationQueryRepository.batchInsertAffectedParcels(recordsWithResultId);
        }

        // 8. Mark scenario COMPLETED
        scenario.setStatus(ScenarioStatus.COMPLETED);
        scenarioRepository.save(scenario);

        return ScenarioResultResponse.from(savedResult);
    }

    private void validateScenarioParameters(ScenarioType type, ScenarioParameter param) {
        switch (type) {
            case LAND_USE_CONVERSION -> {
                if (param.getSourceLandUse() == null) {
                    throw new IllegalArgumentException("Source land use is required for land use conversion");
                }
                if (param.getTargetLandUse() == null) {
                    throw new IllegalArgumentException("Target land use is required for land use conversion");
                }
                if (param.getSourceLandUse() == param.getTargetLandUse()) {
                    throw new IllegalArgumentException("Target land use must differ from source land use");
                }
                if (param.getConversionPercentage() == null) {
                    throw new IllegalArgumentException("Conversion percentage is required for land use conversion");
                }
                if (param.getConversionPercentage().compareTo(BigDecimal.ZERO) < 0
                        || param.getConversionPercentage().compareTo(new BigDecimal("100.00")) > 0) {
                    throw new IllegalArgumentException("Conversion percentage must be between 0 and 100");
                }
            }
            case LAND_CEILING_REDISTRIBUTION -> {
                if (param.getMaxOwnershipArea() == null) {
                    throw new IllegalArgumentException("Max ownership area is required for land ceiling redistribution");
                }
                if (param.getMaxOwnershipArea().compareTo(BigDecimal.ZERO) < 0) {
                    throw new IllegalArgumentException("Max ownership area cannot be negative");
                }
            }
            case CORRIDOR_BUFFER_INTERVENTION -> {
                if (param.getInterventionGeometry() == null) {
                    throw new IllegalArgumentException("Intervention geometry is required for corridor buffer intervention");
                }
                if (param.getBufferDistanceMeters() == null) {
                    throw new IllegalArgumentException("Buffer distance is required for corridor buffer intervention");
                }
                if (param.getBufferDistanceMeters().compareTo(BigDecimal.ZERO) < 0) {
                    throw new IllegalArgumentException("Buffer distance cannot be negative");
                }
            }
            case DISPUTE_RISK_ASSESSMENT, PROJECT_PARCEL_EVALUATION -> {
                // Fully valid with default geographic scope or project context
            }
        }
    }

    private SimulationOutput computeSimulation(PolicyScenario scenario, ScenarioParameter param) {
        String geomWkt = param.getInterventionGeometry() != null ? param.getInterventionGeometry().toText() : null;
        UUID projectId = scenario.getScenarioType() == ScenarioType.PROJECT_PARCEL_EVALUATION
                ? scenario.getProject().getId()
                : null;

        // Resolve candidate parcels from PostGIS
        List<CandidateParcel> candidates = simulationQueryRepository.findCandidates(
                param.getTargetState(),
                param.getTargetDistrict(),
                param.getTargetTehsil(),
                param.getTargetVillage(),
                param.getSourceLandUse(),
                param.getTargetOwnershipType(),
                geomWkt,
                scenario.getScenarioType() == ScenarioType.CORRIDOR_BUFFER_INTERVENTION ? param.getBufferDistanceMeters() : null,
                projectId
        );

        if (candidates.isEmpty()) {
            return buildEmptySimulationOutput(scenario.getScenarioType(), param);
        }

        return switch (scenario.getScenarioType()) {
            case LAND_USE_CONVERSION -> computeLandUseConversion(scenario, param, candidates);
            case LAND_CEILING_REDISTRIBUTION -> computeLandCeilingRedistribution(scenario, param, candidates);
            case DISPUTE_RISK_ASSESSMENT -> computeDisputeRiskAssessment(scenario, param, candidates);
            case CORRIDOR_BUFFER_INTERVENTION -> computeCorridorBufferIntervention(scenario, param, candidates);
            case PROJECT_PARCEL_EVALUATION -> computeProjectParcelEvaluation(scenario, param, candidates);
        };
    }

    private SimulationOutput computeLandUseConversion(
            PolicyScenario scenario, ScenarioParameter param, List<CandidateParcel> candidates) {
        long totalEvaluated = candidates.size();
        BigDecimal baselineArea = sumArea(candidates);

        // Deterministic count calculation: floor(candidateCount * conversionPercentage / 100)
        long affectedCount = BigDecimal.valueOf(totalEvaluated)
                .multiply(param.getConversionPercentage())
                .divide(new BigDecimal("100"), 0, RoundingMode.FLOOR)
                .longValue();

        List<CandidateParcel> affectedSubset = candidates.subList(0, (int) affectedCount);
        BigDecimal affectedArea = sumArea(affectedSubset);

        List<AffectedParcelRecord> affectedRecords = new ArrayList<>();
        for (CandidateParcel cp : affectedSubset) {
            affectedRecords.add(new AffectedParcelRecord(
                    null,
                    cp.id(),
                    param.getSourceLandUse(),
                    param.getTargetLandUse(),
                    cp.landAreaSqMeters(),
                    cp.status()
            ));
        }

        // Disputed metrics among evaluated candidates
        long disputedCount = countDisputed(candidates);
        BigDecimal disputedArea = sumDisputedArea(candidates);

        // Distributions: simulated land use
        Map<String, Map<String, Object>> landUseDist = new TreeMap<>();
        long remainingSourceCount = totalEvaluated - affectedCount;
        BigDecimal remainingSourceArea = baselineArea.subtract(affectedArea);
        if (remainingSourceCount > 0) {
            landUseDist.put(param.getSourceLandUse().name(), createStat(remainingSourceCount, remainingSourceArea));
        }
        if (affectedCount > 0) {
            landUseDist.put(param.getTargetLandUse().name(), createStat(affectedCount, affectedArea));
        }

        Map<String, Map<String, Object>> ownershipDist = buildOwnershipDistribution(candidates);

        // Spatial summary
        List<UUID> affectedIds = affectedSubset.stream().map(CandidateParcel::id).toList();
        SpatialBoundingBox bbox = simulationQueryRepository.computeBoundingBox(
                affectedIds.isEmpty() ? candidates.stream().map(CandidateParcel::id).toList() : affectedIds
        );

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("scenarioType", scenario.getScenarioType().name());
        summary.put("conversionPercentage", param.getConversionPercentage());
        summary.put("sourceLandUse", param.getSourceLandUse().name());
        summary.put("targetLandUse", param.getTargetLandUse().name());
        summary.put("totalParcelsEvaluated", totalEvaluated);
        summary.put("totalParcelsAffected", affectedCount);
        summary.put("totalAreaAffectedSqm", affectedArea);
        summary.put("boundingBox", bbox);

        return new SimulationOutput(
                totalEvaluated,
                affectedCount,
                affectedArea,
                baselineArea,
                baselineArea,
                disputedCount,
                disputedArea,
                toJson(landUseDist),
                toJson(ownershipDist),
                toJson(summary),
                affectedRecords
        );
    }

    private SimulationOutput computeLandCeilingRedistribution(
            PolicyScenario scenario, ScenarioParameter param, List<CandidateParcel> candidates) {
        long totalEvaluated = candidates.size();
        BigDecimal baselineArea = sumArea(candidates);
        BigDecimal maxCeiling = param.getMaxOwnershipArea();

        // Identify parcels exceeding threshold
        List<CandidateParcel> affectedSubset = candidates.stream()
                .filter(cp -> cp.landAreaSqMeters().compareTo(maxCeiling) > 0)
                .toList();

        long affectedCount = affectedSubset.size();
        BigDecimal affectedArea = sumArea(affectedSubset);

        List<AffectedParcelRecord> affectedRecords = new ArrayList<>();
        for (CandidateParcel cp : affectedSubset) {
            LandUseType simulatedType = param.getTargetLandUse() != null ? param.getTargetLandUse() : cp.landUseType();
            affectedRecords.add(new AffectedParcelRecord(
                    null,
                    cp.id(),
                    cp.landUseType(),
                    simulatedType,
                    cp.landAreaSqMeters(),
                    cp.status()
            ));
        }

        long disputedCount = countDisputed(candidates);
        BigDecimal disputedArea = sumDisputedArea(candidates);

        Map<String, Map<String, Object>> landUseDist = buildLandUseDistribution(candidates);
        Map<String, Map<String, Object>> ownershipDist = buildOwnershipDistribution(candidates);

        List<UUID> affectedIds = affectedSubset.stream().map(CandidateParcel::id).toList();
        SpatialBoundingBox bbox = simulationQueryRepository.computeBoundingBox(
                affectedIds.isEmpty() ? candidates.stream().map(CandidateParcel::id).toList() : affectedIds
        );

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("scenarioType", scenario.getScenarioType().name());
        summary.put("maxOwnershipAreaThreshold", maxCeiling);
        summary.put("totalParcelsEvaluated", totalEvaluated);
        summary.put("totalParcelsAffected", affectedCount);
        summary.put("totalAreaAffectedSqm", affectedArea);
        summary.put("boundingBox", bbox);

        return new SimulationOutput(
                totalEvaluated,
                affectedCount,
                affectedArea,
                baselineArea,
                baselineArea,
                disputedCount,
                disputedArea,
                toJson(landUseDist),
                toJson(ownershipDist),
                toJson(summary),
                affectedRecords
        );
    }

    private SimulationOutput computeDisputeRiskAssessment(
            PolicyScenario scenario, ScenarioParameter param, List<CandidateParcel> candidates) {
        long totalEvaluated = candidates.size();
        BigDecimal baselineArea = sumArea(candidates);

        // Identify parcels already marked DISPUTED
        List<CandidateParcel> disputedParcels = candidates.stream()
                .filter(cp -> cp.status() == LandRecordStatus.DISPUTED)
                .toList();

        long disputedCount = disputedParcels.size();
        BigDecimal disputedArea = sumArea(disputedParcels);

        List<AffectedParcelRecord> affectedRecords = new ArrayList<>();
        for (CandidateParcel cp : disputedParcels) {
            affectedRecords.add(new AffectedParcelRecord(
                    null,
                    cp.id(),
                    cp.landUseType(),
                    cp.landUseType(),
                    cp.landAreaSqMeters(),
                    LandRecordStatus.DISPUTED
            ));
        }

        Map<String, Map<String, Object>> landUseDist = buildLandUseDistribution(disputedParcels.isEmpty() ? candidates : disputedParcels);
        Map<String, Map<String, Object>> ownershipDist = buildOwnershipDistribution(disputedParcels.isEmpty() ? candidates : disputedParcels);

        List<UUID> disputedIds = disputedParcels.stream().map(CandidateParcel::id).toList();
        SpatialBoundingBox bbox = simulationQueryRepository.computeBoundingBox(
                disputedIds.isEmpty() ? candidates.stream().map(CandidateParcel::id).toList() : disputedIds
        );

        BigDecimal disputeRate = totalEvaluated > 0
                ? BigDecimal.valueOf(disputedCount).multiply(new BigDecimal("100")).divide(BigDecimal.valueOf(totalEvaluated), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("scenarioType", scenario.getScenarioType().name());
        summary.put("assessmentType", "EXISTING_DISPUTED_RECORD_EXPOSURE");
        summary.put("totalParcelsEvaluated", totalEvaluated);
        summary.put("disputedParcelsCount", disputedCount);
        summary.put("disputedAreaSqm", disputedArea);
        summary.put("disputeExposurePercentage", disputeRate);
        summary.put("boundingBox", bbox);

        return new SimulationOutput(
                totalEvaluated,
                disputedCount,
                disputedArea,
                baselineArea,
                baselineArea,
                disputedCount,
                disputedArea,
                toJson(landUseDist),
                toJson(ownershipDist),
                toJson(summary),
                affectedRecords
        );
    }

    private SimulationOutput computeCorridorBufferIntervention(
            PolicyScenario scenario, ScenarioParameter param, List<CandidateParcel> candidates) {
        long affectedCount = candidates.size();
        BigDecimal affectedArea = sumArea(candidates);

        List<AffectedParcelRecord> affectedRecords = new ArrayList<>();
        for (CandidateParcel cp : candidates) {
            LandUseType simulatedType = param.getTargetLandUse() != null ? param.getTargetLandUse() : cp.landUseType();
            affectedRecords.add(new AffectedParcelRecord(
                    null,
                    cp.id(),
                    cp.landUseType(),
                    simulatedType,
                    cp.landAreaSqMeters(),
                    cp.status()
            ));
        }

        long disputedCount = countDisputed(candidates);
        BigDecimal disputedArea = sumDisputedArea(candidates);

        Map<String, Map<String, Object>> landUseDist = buildLandUseDistribution(candidates);
        Map<String, Map<String, Object>> ownershipDist = buildOwnershipDistribution(candidates);

        SpatialBoundingBox bbox = simulationQueryRepository.computeBoundingBox(
                candidates.stream().map(CandidateParcel::id).toList()
        );

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("scenarioType", scenario.getScenarioType().name());
        summary.put("bufferDistanceMeters", param.getBufferDistanceMeters());
        summary.put("totalParcelsEvaluated", affectedCount);
        summary.put("totalParcelsAffected", affectedCount);
        summary.put("totalAreaAffectedSqm", affectedArea);
        summary.put("boundingBox", bbox);

        return new SimulationOutput(
                affectedCount,
                affectedCount,
                affectedArea,
                affectedArea,
                affectedArea,
                disputedCount,
                disputedArea,
                toJson(landUseDist),
                toJson(ownershipDist),
                toJson(summary),
                affectedRecords
        );
    }

    private SimulationOutput computeProjectParcelEvaluation(
            PolicyScenario scenario, ScenarioParameter param, List<CandidateParcel> candidates) {
        long totalEvaluated = candidates.size();
        BigDecimal baselineArea = sumArea(candidates);

        List<AffectedParcelRecord> affectedRecords = new ArrayList<>();
        for (CandidateParcel cp : candidates) {
            LandUseType simulatedType = param.getTargetLandUse() != null ? param.getTargetLandUse() : cp.landUseType();
            affectedRecords.add(new AffectedParcelRecord(
                    null,
                    cp.id(),
                    cp.landUseType(),
                    simulatedType,
                    cp.landAreaSqMeters(),
                    cp.status()
            ));
        }

        long disputedCount = countDisputed(candidates);
        BigDecimal disputedArea = sumDisputedArea(candidates);

        Map<String, Map<String, Object>> landUseDist = buildLandUseDistribution(candidates);
        Map<String, Map<String, Object>> ownershipDist = buildOwnershipDistribution(candidates);

        SpatialBoundingBox bbox = simulationQueryRepository.computeBoundingBox(
                candidates.stream().map(CandidateParcel::id).toList()
        );

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("scenarioType", scenario.getScenarioType().name());
        summary.put("projectId", scenario.getProject().getId());
        summary.put("projectName", scenario.getProject().getName());
        summary.put("totalParcelsEvaluated", totalEvaluated);
        summary.put("totalParcelsAffected", totalEvaluated);
        summary.put("totalAreaAffectedSqm", baselineArea);
        summary.put("boundingBox", bbox);

        return new SimulationOutput(
                totalEvaluated,
                totalEvaluated,
                baselineArea,
                baselineArea,
                baselineArea,
                disputedCount,
                disputedArea,
                toJson(landUseDist),
                toJson(ownershipDist),
                toJson(summary),
                affectedRecords
        );
    }

    private SimulationOutput buildEmptySimulationOutput(ScenarioType type, ScenarioParameter param) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("scenarioType", type.name());
        summary.put("totalParcelsEvaluated", 0L);
        summary.put("totalParcelsAffected", 0L);
        summary.put("totalAreaAffectedSqm", BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        summary.put("boundingBox", null);
        summary.put("message", "No parcels matched scenario criteria");

        return new SimulationOutput(
                0L,
                0L,
                BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                0L,
                BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                "{}",
                "{}",
                toJson(summary),
                Collections.emptyList()
        );
    }

    private BigDecimal sumArea(List<CandidateParcel> parcels) {
        BigDecimal total = BigDecimal.ZERO;
        for (CandidateParcel cp : parcels) {
            if (cp.landAreaSqMeters() != null) {
                total = total.add(cp.landAreaSqMeters());
            }
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private long countDisputed(List<CandidateParcel> parcels) {
        return parcels.stream()
                .filter(cp -> cp.status() == LandRecordStatus.DISPUTED)
                .count();
    }

    private BigDecimal sumDisputedArea(List<CandidateParcel> parcels) {
        BigDecimal total = BigDecimal.ZERO;
        for (CandidateParcel cp : parcels) {
            if (cp.status() == LandRecordStatus.DISPUTED && cp.landAreaSqMeters() != null) {
                total = total.add(cp.landAreaSqMeters());
            }
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private Map<String, Map<String, Object>> buildLandUseDistribution(List<CandidateParcel> parcels) {
        Map<String, Map<String, Object>> dist = new TreeMap<>();
        Map<LandUseType, Long> counts = new TreeMap<>();
        Map<LandUseType, BigDecimal> areas = new TreeMap<>();

        for (CandidateParcel cp : parcels) {
            counts.put(cp.landUseType(), counts.getOrDefault(cp.landUseType(), 0L) + 1);
            BigDecimal currentArea = areas.getOrDefault(cp.landUseType(), BigDecimal.ZERO);
            areas.put(cp.landUseType(), currentArea.add(cp.landAreaSqMeters() != null ? cp.landAreaSqMeters() : BigDecimal.ZERO));
        }

        for (Map.Entry<LandUseType, Long> e : counts.entrySet()) {
            dist.put(e.getKey().name(), createStat(e.getValue(), areas.get(e.getKey()).setScale(2, RoundingMode.HALF_UP)));
        }
        return dist;
    }

    private Map<String, Map<String, Object>> buildOwnershipDistribution(List<CandidateParcel> parcels) {
        Map<String, Map<String, Object>> dist = new TreeMap<>();
        Map<OwnershipType, Long> counts = new TreeMap<>();
        Map<OwnershipType, BigDecimal> areas = new TreeMap<>();

        for (CandidateParcel cp : parcels) {
            counts.put(cp.ownershipType(), counts.getOrDefault(cp.ownershipType(), 0L) + 1);
            BigDecimal currentArea = areas.getOrDefault(cp.ownershipType(), BigDecimal.ZERO);
            areas.put(cp.ownershipType(), currentArea.add(cp.landAreaSqMeters() != null ? cp.landAreaSqMeters() : BigDecimal.ZERO));
        }

        for (Map.Entry<OwnershipType, Long> e : counts.entrySet()) {
            dist.put(e.getKey().name(), createStat(e.getValue(), areas.get(e.getKey()).setScale(2, RoundingMode.HALF_UP)));
        }
        return dist;
    }

    private Map<String, Object> createStat(long count, BigDecimal area) {
        Map<String, Object> stat = new LinkedHashMap<>();
        stat.put("parcelCount", count);
        stat.put("areaSqMeters", area.setScale(2, RoundingMode.HALF_UP));
        return stat;
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JacksonException e) {
            return "{}";
        }
    }

    private record SimulationOutput(
            Long totalParcelsEvaluated,
            Long totalParcelsAffected,
            BigDecimal totalAreaAffectedSqm,
            BigDecimal baselineAreaSqm,
            BigDecimal simulatedAreaSqm,
            Long disputedParcelsCount,
            BigDecimal disputedAreaSqm,
            String landUseDistributionJson,
            String ownershipDistributionJson,
            String spatialSummaryJson,
            List<AffectedParcelRecord> affectedRecords
    ) {}
}
