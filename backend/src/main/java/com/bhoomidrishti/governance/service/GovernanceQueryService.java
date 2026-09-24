package com.bhoomidrishti.governance.service;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.repository.ProjectRepository;
import com.bhoomidrishti.collaboration.service.CollaborationSecurityService;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.governance.dto.CurrentIndicatorQueryResult;
import com.bhoomidrishti.governance.dto.GovernanceAdministrativeSummaryResponse;
import com.bhoomidrishti.governance.dto.GovernanceScopeQuery;
import com.bhoomidrishti.governance.dto.GovernanceScopeSummaryResponse;
import com.bhoomidrishti.governance.dto.GovernanceSummaryIndicatorItemResponse;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorDefinition;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorSnapshot;
import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import com.bhoomidrishti.governance.entity.IndicatorCategory;
import com.bhoomidrishti.governance.entity.SnapshotVisibility;
import com.bhoomidrishti.governance.repository.GovernanceCalculationRepository;
import com.bhoomidrishti.governance.repository.GovernanceCalculationRepository.CalculationResult;
import com.bhoomidrishti.governance.repository.GovernanceIndicatorDefinitionRepository;
import com.bhoomidrishti.governance.repository.GovernanceIndicatorSnapshotRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reusable, deterministic, and secure query foundation for governance intelligence.
 *
 * <p>Separation of concerns:
 * <ul>
 *   <li>Coordinates strict scope hierarchy validation (STATE, DISTRICT, TEHSIL, VILLAGE, PROJECT).</li>
 *   <li>Validates indicator definitions and active status against the repository authority.</li>
 *   <li>Enforces project isolation and IDOR protection using {@link CollaborationSecurityService}.</li>
 *   <li>Invokes deterministic calculations via {@link GovernanceCalculationRepository}.</li>
 *   <li>Provides scope-filtered queries for persisted snapshots via {@link GovernanceIndicatorSnapshotRepository}.</li>
 * </ul>
 */
@Service
@Transactional(readOnly = true)
public class GovernanceQueryService {

    private final GovernanceCalculationRepository calculationRepository;
    private final GovernanceIndicatorDefinitionRepository definitionRepository;
    private final GovernanceIndicatorSnapshotRepository snapshotRepository;
    private final ProjectRepository projectRepository;
    private final CollaborationSecurityService collaborationSecurityService;

    public GovernanceQueryService(
            GovernanceCalculationRepository calculationRepository,
            GovernanceIndicatorDefinitionRepository definitionRepository,
            GovernanceIndicatorSnapshotRepository snapshotRepository,
            ProjectRepository projectRepository,
            CollaborationSecurityService collaborationSecurityService) {
        this.calculationRepository = calculationRepository;
        this.definitionRepository = definitionRepository;
        this.snapshotRepository = snapshotRepository;
        this.projectRepository = projectRepository;
        this.collaborationSecurityService = collaborationSecurityService;
    }

    /**
     * Validates and normalizes geographic and project scope parameters.
     *
     * <p>Hierarchy rules:
     * <ul>
     *   <li>STATE: state required; district, tehsil, village must be null.</li>
     *   <li>DISTRICT: state and district required; tehsil, village must be null.</li>
     *   <li>TEHSIL: state, district, and tehsil required; village must be null.</li>
     *   <li>VILLAGE: state, district, tehsil, and village required.</li>
     *   <li>PROJECT: projectId required; geographic fields must be null.</li>
     * </ul>
     *
     * @param query the scope query to validate
     * @return the normalized, validated scope query
     * @throws IllegalArgumentException if scopeType is null, invalid, or parameters violate hierarchy
     */
    public GovernanceScopeQuery validateScope(GovernanceScopeQuery query) {
        if (query == null || query.scopeType() == null) {
            throw new IllegalArgumentException("scopeType is required");
        }

        switch (query.scopeType()) {
            case STATE -> {
                if (query.projectId() != null) {
                    throw new IllegalArgumentException("projectId must not be provided for regional scope types");
                }
                if (query.state() == null) {
                    throw new IllegalArgumentException("state is required for STATE scope type");
                }
                if (query.district() != null || query.tehsil() != null || query.village() != null) {
                    throw new IllegalArgumentException("district, tehsil, and village must not be provided for STATE scope type");
                }
            }
            case DISTRICT -> {
                if (query.projectId() != null) {
                    throw new IllegalArgumentException("projectId must not be provided for regional scope types");
                }
                if (query.state() == null || query.district() == null) {
                    throw new IllegalArgumentException("state and district are required for DISTRICT scope type");
                }
                if (query.tehsil() != null || query.village() != null) {
                    throw new IllegalArgumentException("tehsil and village must not be provided for DISTRICT scope type");
                }
            }
            case TEHSIL -> {
                if (query.projectId() != null) {
                    throw new IllegalArgumentException("projectId must not be provided for regional scope types");
                }
                if (query.state() == null || query.district() == null || query.tehsil() == null) {
                    throw new IllegalArgumentException("state, district, and tehsil are required for TEHSIL scope type");
                }
                if (query.village() != null) {
                    throw new IllegalArgumentException("village must not be provided for TEHSIL scope type");
                }
            }
            case VILLAGE -> {
                if (query.projectId() != null) {
                    throw new IllegalArgumentException("projectId must not be provided for regional scope types");
                }
                if (query.state() == null || query.district() == null || query.tehsil() == null || query.village() == null) {
                    throw new IllegalArgumentException("state, district, tehsil, and village are required for VILLAGE scope type");
                }
            }
            case PROJECT -> {
                if (query.projectId() == null) {
                    throw new IllegalArgumentException("projectId is required for PROJECT scope type");
                }
                if (query.state() != null || query.district() != null || query.tehsil() != null || query.village() != null) {
                    throw new IllegalArgumentException("Geographic fields (state, district, tehsil, village) must not be provided for PROJECT scope type");
                }
            }
            default -> throw new IllegalArgumentException("Unsupported scope type: " + query.scopeType());
        }

        return query;
    }

    /**
     * Validates an indicator code against registered definitions and supported calculations.
     *
     * @param indicatorCode code of the indicator
     * @return the active indicator definition
     * @throws ResourceNotFoundException if definition does not exist
     * @throws IllegalArgumentException if definition is inactive or unsupported
     */
    public GovernanceIndicatorDefinition validateIndicator(String indicatorCode) {
        if (indicatorCode == null || indicatorCode.isBlank()) {
            throw new IllegalArgumentException("Indicator code is required");
        }

        String code = indicatorCode.trim();
        GovernanceIndicatorDefinition definition = definitionRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Indicator definition not found: " + code));

        if (!definition.isActive()) {
            throw new IllegalArgumentException("Indicator definition is inactive: " + code);
        }

        if (!GovernanceCalculationRepository.SUPPORTED_INDICATOR_CODES.contains(code)) {
            throw new IllegalArgumentException("Unsupported calculation for indicator code: " + code);
        }

        return definition;
    }

    /**
     * Enforces project view authorization with IDOR protection.
     *
     * @param projectId id of the project
     * @param auth current authentication
     * @return the authorized project
     * @throws ResourceNotFoundException if project does not exist or user lacks view permission
     */
    public Project authorizeProjectScope(UUID projectId, Authentication auth) {
        if (projectId == null) {
            throw new IllegalArgumentException("projectId is required for PROJECT scope type");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        User user = collaborationSecurityService.resolveCurrentUser(auth).orElse(null);
        collaborationSecurityService.checkCanViewProject(project, user);

        return project;
    }

    /**
     * Executes a deterministic calculation over current cadastral land records or project land records.
     *
     * <p>This computes current real-time analytics and does NOT persist a snapshot.
     *
     * @param indicatorCode code of the indicator to calculate
     * @param query geographic or project scope
     * @param auth authentication context for project authorization
     * @return real-time query calculation result
     */
    public CurrentIndicatorQueryResult calculateCurrentIndicator(
            String indicatorCode, GovernanceScopeQuery query, Authentication auth) {
        GovernanceScopeQuery validScope = validateScope(query);
        GovernanceIndicatorDefinition definition = validateIndicator(indicatorCode);

        Project project = null;
        if (validScope.scopeType() == GovernanceScopeType.PROJECT) {
            project = authorizeProjectScope(validScope.projectId(), auth);
        }

        CalculationResult calc = calculationRepository.calculateIndicator(
                definition.getCode(),
                validScope.scopeType(),
                validScope.state(),
                validScope.district(),
                validScope.tehsil(),
                validScope.village(),
                project != null ? project.getId() : null);

        return new CurrentIndicatorQueryResult(
                definition.getCode(),
                definition.getName(),
                definition.getCategory(),
                definition.getUnit(),
                definition.getAggregationMethod(),
                validScope.scopeType(),
                validScope.state(),
                validScope.district(),
                validScope.tehsil(),
                validScope.village(),
                validScope.projectId(),
                calc.numericValue(),
                calc.denominator(),
                calc.breakdownJson(),
                definition.getCalculationVersion(),
                calc.sourceDataTimestamp());
    }

    /**
     * Queries persisted historical snapshots with strict scope hierarchy filtering and visibility checks.
     *
     * @param query scope query
     * @param indicatorCode optional indicator code filter (validated if provided)
     * @param auth authentication context
     * @return list of matching persisted snapshots
     */
    public List<GovernanceIndicatorSnapshot> queryPersistedSnapshots(
            GovernanceScopeQuery query, String indicatorCode, Authentication auth) {
        GovernanceScopeQuery validScope = validateScope(query);

        String normalizedCode = null;
        if (indicatorCode != null && !indicatorCode.isBlank()) {
            validateIndicator(indicatorCode);
            normalizedCode = indicatorCode.trim();
        }

        if (validScope.scopeType() == GovernanceScopeType.PROJECT) {
            authorizeProjectScope(validScope.projectId(), auth);
            return snapshotRepository.findSnapshotsByScopeHierarchy(
                    validScope.scopeType(),
                    null,
                    null,
                    null,
                    null,
                    validScope.projectId(),
                    normalizedCode);
        }

        // Regional scope: enforce visibility
        User user = collaborationSecurityService.resolveCurrentUser(auth).orElse(null);
        boolean isOfficialOrAdmin = user != null
                && (user.getRole() == Role.GOVERNMENT_OFFICIAL || user.getRole() == Role.ADMIN);

        List<GovernanceIndicatorSnapshot> snapshots = snapshotRepository.findSnapshotsByScopeHierarchy(
                validScope.scopeType(),
                validScope.state(),
                validScope.district(),
                validScope.tehsil(),
                validScope.village(),
                null,
                normalizedCode);

        return snapshots.stream()
                .filter(s -> s.getVisibility() == SnapshotVisibility.PUBLISHED || isOfficialOrAdmin)
                .toList();
    }

    public static final List<String> DEFAULT_SUMMARY_INDICATORS = List.of(
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

    /**
     * Generates a deterministic, live administrative summary for a specified geographic or project scope.
     *
     * <p>Evaluates indicators on-the-fly directly against authoritative spatial land records.
     * Does NOT persist the calculation or create snapshots.
     *
     * @param scopeQuery geographic or project scope parameters
     * @param categoryFilter optional filter by indicator category
     * @param requestedIndicators optional list of explicit indicator codes
     * @param auth authentication context for project authorization
     * @return structured administrative summary response
     */
    public GovernanceAdministrativeSummaryResponse generateAdministrativeSummary(
            GovernanceScopeQuery scopeQuery,
            IndicatorCategory categoryFilter,
            List<String> requestedIndicators,
            Authentication auth) {

        GovernanceScopeQuery validScope = validateScope(scopeQuery);

        String projectName = null;
        if (validScope.scopeType() == GovernanceScopeType.PROJECT) {
            Project project = authorizeProjectScope(validScope.projectId(), auth);
            projectName = project.getName();
        }

        // Determine requested indicators
        List<String> cleanRequestedCodes = null;
        if (requestedIndicators != null) {
            cleanRequestedCodes = requestedIndicators.stream()
                    .filter(s -> s != null && !s.isBlank())
                    .map(String::trim)
                    .toList();
        }

        List<GovernanceIndicatorDefinition> targetDefinitions = new ArrayList<>();

        if (cleanRequestedCodes != null && !cleanRequestedCodes.isEmpty()) {
            for (String code : cleanRequestedCodes) {
                GovernanceIndicatorDefinition def = validateIndicator(code);
                if (categoryFilter == null || def.getCategory() == categoryFilter) {
                    targetDefinitions.add(def);
                }
            }
            if (targetDefinitions.isEmpty()) {
                throw new IllegalArgumentException("No requested indicators match the specified category filter: " + categoryFilter);
            }
        } else {
            for (String code : DEFAULT_SUMMARY_INDICATORS) {
                GovernanceIndicatorDefinition def = validateIndicator(code);
                if (categoryFilter == null || def.getCategory() == categoryFilter) {
                    targetDefinitions.add(def);
                }
            }
            if (targetDefinitions.isEmpty()) {
                throw new IllegalArgumentException("No supported indicators match the specified category filter: " + categoryFilter);
            }
        }

        Instant generatedAt = Instant.now();
        Instant maxSourceDataTimestamp = null;
        String calculationVersion = "1.0";

        List<GovernanceSummaryIndicatorItemResponse> indicatorItems = new ArrayList<>(targetDefinitions.size());

        for (GovernanceIndicatorDefinition def : targetDefinitions) {
            CalculationResult calc = calculationRepository.calculateIndicator(
                    def.getCode(),
                    validScope.scopeType(),
                    validScope.state(),
                    validScope.district(),
                    validScope.tehsil(),
                    validScope.village(),
                    validScope.projectId()
            );

            if (calc.sourceDataTimestamp() != null) {
                if (maxSourceDataTimestamp == null || calc.sourceDataTimestamp().isAfter(maxSourceDataTimestamp)) {
                    maxSourceDataTimestamp = calc.sourceDataTimestamp();
                }
            }

            if (def.getCalculationVersion() != null && !def.getCalculationVersion().isBlank()) {
                calculationVersion = def.getCalculationVersion();
            }

            indicatorItems.add(new GovernanceSummaryIndicatorItemResponse(
                    def.getCode(),
                    def.getName(),
                    def.getCategory(),
                    def.getUnit(),
                    def.getAggregationMethod(),
                    calc.numericValue(),
                    calc.denominator(),
                    calc.breakdownJson(),
                    calc.sourceDataTimestamp()
            ));
        }

        if (maxSourceDataTimestamp == null) {
            maxSourceDataTimestamp = generatedAt;
        }

        GovernanceScopeSummaryResponse scopeResponse = new GovernanceScopeSummaryResponse(
                validScope.scopeType(),
                validScope.state(),
                validScope.district(),
                validScope.tehsil(),
                validScope.village(),
                validScope.projectId(),
                projectName
        );

        return new GovernanceAdministrativeSummaryResponse(
                scopeResponse,
                "LIVE",
                generatedAt,
                maxSourceDataTimestamp,
                calculationVersion,
                indicatorItems.size(),
                indicatorItems
        );
    }
}
