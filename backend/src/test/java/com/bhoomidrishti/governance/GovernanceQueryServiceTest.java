package com.bhoomidrishti.governance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import com.bhoomidrishti.governance.entity.AggregationMethod;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorDefinition;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorSnapshot;
import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import com.bhoomidrishti.governance.entity.IndicatorCategory;
import com.bhoomidrishti.governance.entity.IndicatorUnit;
import com.bhoomidrishti.governance.entity.SnapshotVisibility;
import com.bhoomidrishti.governance.repository.GovernanceCalculationRepository;
import com.bhoomidrishti.governance.repository.GovernanceCalculationRepository.CalculationResult;
import com.bhoomidrishti.governance.repository.GovernanceIndicatorDefinitionRepository;
import com.bhoomidrishti.governance.repository.GovernanceIndicatorSnapshotRepository;
import com.bhoomidrishti.governance.service.GovernanceQueryService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class GovernanceQueryServiceTest {

    @Mock
    private GovernanceCalculationRepository calculationRepository;

    @Mock
    private GovernanceIndicatorDefinitionRepository definitionRepository;

    @Mock
    private GovernanceIndicatorSnapshotRepository snapshotRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private CollaborationSecurityService collaborationSecurityService;

    private GovernanceQueryService queryService;

    private GovernanceIndicatorDefinition activeDefinition;
    private GovernanceIndicatorDefinition inactiveDefinition;
    private User adminUser;
    private User researcherUser;
    private Authentication adminAuth;
    private Authentication researcherAuth;
    private Project testProject;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        queryService = new GovernanceQueryService(
                calculationRepository,
                definitionRepository,
                snapshotRepository,
                projectRepository,
                collaborationSecurityService);

        activeDefinition = new GovernanceIndicatorDefinition(
                "DISPUTED_PARCEL_COUNT",
                "Disputed Parcel Count",
                "Total number of disputed parcels",
                IndicatorCategory.STATUS_DISTRIBUTION,
                IndicatorUnit.COUNT,
                AggregationMethod.COUNT,
                "LAND_RECORD",
                "1.0");
        activeDefinition.setId(UUID.randomUUID());

        inactiveDefinition = new GovernanceIndicatorDefinition(
                "INACTIVE_DEF",
                "Inactive Definition",
                "Disabled definition",
                IndicatorCategory.STATUS_DISTRIBUTION,
                IndicatorUnit.COUNT,
                AggregationMethod.COUNT,
                "LAND_RECORD",
                "1.0");
        inactiveDefinition.setId(UUID.randomUUID());
        inactiveDefinition.setActive(false);

        adminUser = User.registerLocal("Admin Officer", "admin@bhoomi.gov.in", "hash");
        adminUser.changeRole(Role.ADMIN);
        ReflectionTestUtils.setField(adminUser, "id", UUID.randomUUID());

        researcherUser = User.registerLocal("Dr. Sharma", "researcher@univ.edu", "hash");
        researcherUser.changeRole(Role.RESEARCHER);
        ReflectionTestUtils.setField(researcherUser, "id", UUID.randomUUID());

        adminAuth = new UsernamePasswordAuthenticationToken(adminUser, null);
        researcherAuth = new UsernamePasswordAuthenticationToken(researcherUser, null);

        projectId = UUID.randomUUID();
        testProject = new Project();
        testProject.setId(projectId);
    }

    // =========================================================================
    // 1. SCOPE VALIDATION TESTS
    // =========================================================================

    @Test
    @DisplayName("Should validate valid STATE scope")
    void testValidateScopeValidState() {
        GovernanceScopeQuery query = GovernanceScopeQuery.ofState("Madhya Pradesh");
        GovernanceScopeQuery validated = queryService.validateScope(query);

        assertThat(validated.scopeType()).isEqualTo(GovernanceScopeType.STATE);
        assertThat(validated.state()).isEqualTo("Madhya Pradesh");
        assertThat(validated.district()).isNull();
        assertThat(validated.tehsil()).isNull();
        assertThat(validated.village()).isNull();
        assertThat(validated.projectId()).isNull();
    }

    @Test
    @DisplayName("Should fail STATE scope when state is missing")
    void testValidateScopeStateMissing() {
        GovernanceScopeQuery query = new GovernanceScopeQuery(GovernanceScopeType.STATE, null, null, null, null, null);
        assertThatThrownBy(() -> queryService.validateScope(query))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("state is required for STATE scope type");
    }

    @Test
    @DisplayName("Should fail STATE scope when child fields are provided")
    void testValidateScopeStateWithChildFields() {
        GovernanceScopeQuery query = new GovernanceScopeQuery(GovernanceScopeType.STATE, "MP", "Bhopal", null, null, null);
        assertThatThrownBy(() -> queryService.validateScope(query))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("district, tehsil, and village must not be provided for STATE scope type");
    }

    @Test
    @DisplayName("Should validate valid DISTRICT scope")
    void testValidateScopeValidDistrict() {
        GovernanceScopeQuery query = GovernanceScopeQuery.ofDistrict("Madhya Pradesh", "Bhopal");
        GovernanceScopeQuery validated = queryService.validateScope(query);

        assertThat(validated.scopeType()).isEqualTo(GovernanceScopeType.DISTRICT);
        assertThat(validated.state()).isEqualTo("Madhya Pradesh");
        assertThat(validated.district()).isEqualTo("Bhopal");
        assertThat(validated.tehsil()).isNull();
        assertThat(validated.village()).isNull();
    }

    @Test
    @DisplayName("Should fail DISTRICT scope when district is missing")
    void testValidateScopeDistrictMissingDistrict() {
        GovernanceScopeQuery query = new GovernanceScopeQuery(GovernanceScopeType.DISTRICT, "Madhya Pradesh", null, null, null, null);
        assertThatThrownBy(() -> queryService.validateScope(query))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("state and district are required for DISTRICT scope type");
    }

    @Test
    @DisplayName("Should fail DISTRICT scope when state is missing")
    void testValidateScopeDistrictMissingState() {
        GovernanceScopeQuery query = new GovernanceScopeQuery(GovernanceScopeType.DISTRICT, null, "Bhopal", null, null, null);
        assertThatThrownBy(() -> queryService.validateScope(query))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("state and district are required for DISTRICT scope type");
    }

    @Test
    @DisplayName("Should fail DISTRICT scope when tehsil or village is provided")
    void testValidateScopeDistrictWithChildFields() {
        GovernanceScopeQuery query = new GovernanceScopeQuery(GovernanceScopeType.DISTRICT, "MP", "Bhopal", "Huzur", null, null);
        assertThatThrownBy(() -> queryService.validateScope(query))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("tehsil and village must not be provided for DISTRICT scope type");
    }

    @Test
    @DisplayName("Should validate valid TEHSIL scope")
    void testValidateScopeValidTehsil() {
        GovernanceScopeQuery query = GovernanceScopeQuery.ofTehsil("Madhya Pradesh", "Bhopal", "Huzur");
        GovernanceScopeQuery validated = queryService.validateScope(query);

        assertThat(validated.scopeType()).isEqualTo(GovernanceScopeType.TEHSIL);
        assertThat(validated.state()).isEqualTo("Madhya Pradesh");
        assertThat(validated.district()).isEqualTo("Bhopal");
        assertThat(validated.tehsil()).isEqualTo("Huzur");
        assertThat(validated.village()).isNull();
    }

    @Test
    @DisplayName("Should fail TEHSIL scope when tehsil is missing")
    void testValidateScopeTehsilMissingTehsil() {
        GovernanceScopeQuery query = new GovernanceScopeQuery(GovernanceScopeType.TEHSIL, "Madhya Pradesh", "Bhopal", null, null, null);
        assertThatThrownBy(() -> queryService.validateScope(query))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("state, district, and tehsil are required for TEHSIL scope type");
    }

    @Test
    @DisplayName("Should fail TEHSIL scope when village is provided")
    void testValidateScopeTehsilWithVillage() {
        GovernanceScopeQuery query = new GovernanceScopeQuery(GovernanceScopeType.TEHSIL, "MP", "Bhopal", "Huzur", "Kolar", null);
        assertThatThrownBy(() -> queryService.validateScope(query))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("village must not be provided for TEHSIL scope type");
    }

    @Test
    @DisplayName("Should validate valid VILLAGE scope")
    void testValidateScopeValidVillage() {
        GovernanceScopeQuery query = GovernanceScopeQuery.ofVillage("Madhya Pradesh", "Bhopal", "Huzur", "Kolar");
        GovernanceScopeQuery validated = queryService.validateScope(query);

        assertThat(validated.scopeType()).isEqualTo(GovernanceScopeType.VILLAGE);
        assertThat(validated.state()).isEqualTo("Madhya Pradesh");
        assertThat(validated.district()).isEqualTo("Bhopal");
        assertThat(validated.tehsil()).isEqualTo("Huzur");
        assertThat(validated.village()).isEqualTo("Kolar");
    }

    @Test
    @DisplayName("Should fail VILLAGE scope when any hierarchy field is missing")
    void testValidateScopeVillageMissingHierarchy() {
        GovernanceScopeQuery query = new GovernanceScopeQuery(GovernanceScopeType.VILLAGE, "Madhya Pradesh", "Bhopal", null, "Kolar", null);
        assertThatThrownBy(() -> queryService.validateScope(query))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("state, district, tehsil, and village are required for VILLAGE scope type");
    }

    @Test
    @DisplayName("Should validate valid PROJECT scope")
    void testValidateScopeValidProject() {
        GovernanceScopeQuery query = GovernanceScopeQuery.ofProject(projectId);
        GovernanceScopeQuery validated = queryService.validateScope(query);

        assertThat(validated.scopeType()).isEqualTo(GovernanceScopeType.PROJECT);
        assertThat(validated.projectId()).isEqualTo(projectId);
        assertThat(validated.state()).isNull();
        assertThat(validated.district()).isNull();
    }

    @Test
    @DisplayName("Should fail PROJECT scope when projectId is missing")
    void testValidateScopeProjectMissingId() {
        GovernanceScopeQuery query = new GovernanceScopeQuery(GovernanceScopeType.PROJECT, null, null, null, null, null);
        assertThatThrownBy(() -> queryService.validateScope(query))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("projectId is required for PROJECT scope type");
    }

    @Test
    @DisplayName("Should fail PROJECT scope when geographic fields are specified")
    void testValidateScopeProjectWithGeographicFields() {
        GovernanceScopeQuery query = new GovernanceScopeQuery(GovernanceScopeType.PROJECT, "Madhya Pradesh", null, null, null, projectId);
        assertThatThrownBy(() -> queryService.validateScope(query))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Geographic fields (state, district, tehsil, village) must not be provided for PROJECT scope type");
    }

    @Test
    @DisplayName("Should fail regional scope when projectId is specified")
    void testValidateScopeRegionalWithProjectId() {
        GovernanceScopeQuery query = new GovernanceScopeQuery(GovernanceScopeType.STATE, "Madhya Pradesh", null, null, null, projectId);
        assertThatThrownBy(() -> queryService.validateScope(query))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("projectId must not be provided for regional scope types");
    }

    @Test
    @DisplayName("Should fail when query or scopeType is null")
    void testValidateScopeNull() {
        assertThatThrownBy(() -> queryService.validateScope(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("scopeType is required");

        GovernanceScopeQuery nullType = new GovernanceScopeQuery(null, "MP", null, null, null, null);
        assertThatThrownBy(() -> queryService.validateScope(nullType))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("scopeType is required");
    }

    // =========================================================================
    // 2. INDICATOR VALIDATION TESTS
    // =========================================================================

    @Test
    @DisplayName("Should validate registered and active indicator")
    void testValidateIndicatorSuccess() {
        when(definitionRepository.findByCode("DISPUTED_PARCEL_COUNT")).thenReturn(Optional.of(activeDefinition));

        GovernanceIndicatorDefinition def = queryService.validateIndicator("DISPUTED_PARCEL_COUNT");
        assertThat(def).isNotNull();
        assertThat(def.getCode()).isEqualTo("DISPUTED_PARCEL_COUNT");
    }

    @Test
    @DisplayName("Should fail when indicator is unknown")
    void testValidateIndicatorUnknown() {
        when(definitionRepository.findByCode("NON_EXISTENT")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> queryService.validateIndicator("NON_EXISTENT"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Indicator definition not found: NON_EXISTENT");
    }

    @Test
    @DisplayName("Should fail when indicator is inactive")
    void testValidateIndicatorInactive() {
        when(definitionRepository.findByCode("INACTIVE_DEF")).thenReturn(Optional.of(inactiveDefinition));

        assertThatThrownBy(() -> queryService.validateIndicator("INACTIVE_DEF"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Indicator definition is inactive: INACTIVE_DEF");
    }

    @Test
    @DisplayName("Should fail when indicator code is blank")
    void testValidateIndicatorBlank() {
        assertThatThrownBy(() -> queryService.validateIndicator("  "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Indicator code is required");
    }

    @Test
    @DisplayName("Should fail when indicator is registered and active but calculation is unsupported")
    void testValidateIndicatorUnsupportedCalculation() {
        GovernanceIndicatorDefinition defWithoutCalc = new GovernanceIndicatorDefinition(
                "FUTURE_UNSUPPORTED_KPI",
                "Future Unsupported KPI",
                "Description",
                IndicatorCategory.LAND_USE,
                IndicatorUnit.PERCENTAGE,
                AggregationMethod.PERCENTAGE_SHARE,
                "LAND_RECORD",
                "1.0");
        when(definitionRepository.findByCode("FUTURE_UNSUPPORTED_KPI")).thenReturn(Optional.of(defWithoutCalc));

        assertThatThrownBy(() -> queryService.validateIndicator("FUTURE_UNSUPPORTED_KPI"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported calculation for indicator code: FUTURE_UNSUPPORTED_KPI");
    }

    @Test
    @DisplayName("Should support all 10 established Phase 9A governance indicator codes")
    void testAllTenPhase9AIndicatorsSupported() {
        List<String> phase9AIndicators = List.of(
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

        for (String code : phase9AIndicators) {
            assertThat(GovernanceCalculationRepository.SUPPORTED_INDICATOR_CODES).contains(code);

            GovernanceIndicatorDefinition def = new GovernanceIndicatorDefinition(
                    code,
                    code,
                    "Desc",
                    IndicatorCategory.LAND_USE,
                    IndicatorUnit.COUNT,
                    AggregationMethod.COUNT,
                    "LAND_RECORD",
                    "1.0");
            when(definitionRepository.findByCode(code)).thenReturn(Optional.of(def));
            GovernanceIndicatorDefinition validated = queryService.validateIndicator(code);
            assertThat(validated.getCode()).isEqualTo(code);
        }
    }

    // =========================================================================
    // 3. PROJECT AUTHORIZATION & ISOLATION TESTS
    // =========================================================================

    @Test
    @DisplayName("Should authorize project access when user has permission")
    void testAuthorizeProjectScopeSuccess() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(collaborationSecurityService.resolveCurrentUser(adminAuth)).thenReturn(Optional.of(adminUser));

        Project project = queryService.authorizeProjectScope(projectId, adminAuth);
        assertThat(project).isEqualTo(testProject);
        verify(collaborationSecurityService).checkCanViewProject(testProject, adminUser);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when project does not exist")
    void testAuthorizeProjectScopeNotFound() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> queryService.authorizeProjectScope(projectId, adminAuth))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Project not found: " + projectId);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException for unauthorized project (IDOR protection)")
    void testAuthorizeProjectScopeIdorProtection() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(collaborationSecurityService.resolveCurrentUser(researcherAuth)).thenReturn(Optional.of(researcherUser));
        org.mockito.Mockito.doThrow(new ResourceNotFoundException("Project not found"))
                .when(collaborationSecurityService).checkCanViewProject(testProject, researcherUser);

        assertThatThrownBy(() -> queryService.authorizeProjectScope(projectId, researcherAuth))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Project not found");
    }

    // =========================================================================
    // 4. CURRENT REAL-TIME CALCULATION TESTS
    // =========================================================================

    @Test
    @DisplayName("Should calculate current real-time indicator for regional scope without persisting")
    void testCalculateCurrentIndicatorRegional() {
        when(definitionRepository.findByCode("DISPUTED_PARCEL_COUNT")).thenReturn(Optional.of(activeDefinition));

        CalculationResult calcResult = new CalculationResult(
                BigDecimal.valueOf(142),
                BigDecimal.valueOf(5000),
                "{\"disputedCount\":142,\"totalCount\":5000}",
                Instant.now());

        when(calculationRepository.calculateIndicator(
                eq("DISPUTED_PARCEL_COUNT"),
                eq(GovernanceScopeType.DISTRICT),
                eq("Madhya Pradesh"),
                eq("Bhopal"),
                eq(null),
                eq(null),
                eq(null)))
                .thenReturn(calcResult);

        GovernanceScopeQuery scope = GovernanceScopeQuery.ofDistrict("Madhya Pradesh", "Bhopal");
        CurrentIndicatorQueryResult result = queryService.calculateCurrentIndicator(
                "DISPUTED_PARCEL_COUNT", scope, null);

        assertThat(result).isNotNull();
        assertThat(result.indicatorCode()).isEqualTo("DISPUTED_PARCEL_COUNT");
        assertThat(result.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(142));
        assertThat(result.denominator()).isEqualByComparingTo(BigDecimal.valueOf(5000));
        assertThat(result.scopeType()).isEqualTo(GovernanceScopeType.DISTRICT);
        assertThat(result.state()).isEqualTo("Madhya Pradesh");
        assertThat(result.district()).isEqualTo("Bhopal");

        // Verify snapshotRepository was NEVER touched
        verify(snapshotRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should calculate current real-time indicator for project scope with authorization")
    void testCalculateCurrentIndicatorProject() {
        when(definitionRepository.findByCode("DISPUTED_PARCEL_COUNT")).thenReturn(Optional.of(activeDefinition));
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(collaborationSecurityService.resolveCurrentUser(adminAuth)).thenReturn(Optional.of(adminUser));

        CalculationResult calcResult = new CalculationResult(
                BigDecimal.valueOf(12),
                BigDecimal.valueOf(50),
                "{\"disputedCount\":12,\"totalCount\":50}",
                Instant.now());

        when(calculationRepository.calculateIndicator(
                eq("DISPUTED_PARCEL_COUNT"),
                eq(GovernanceScopeType.PROJECT),
                eq(null),
                eq(null),
                eq(null),
                eq(null),
                eq(projectId)))
                .thenReturn(calcResult);

        GovernanceScopeQuery scope = GovernanceScopeQuery.ofProject(projectId);
        CurrentIndicatorQueryResult result = queryService.calculateCurrentIndicator(
                "DISPUTED_PARCEL_COUNT", scope, adminAuth);

        assertThat(result).isNotNull();
        assertThat(result.indicatorCode()).isEqualTo("DISPUTED_PARCEL_COUNT");
        assertThat(result.projectId()).isEqualTo(projectId);
        assertThat(result.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(12));
    }

    // =========================================================================
    // 5. PERSISTED SNAPSHOT QUERY TESTS
    // =========================================================================

    @Test
    @DisplayName("Should query persisted snapshots for regional scope with visibility filtering")
    void testQueryPersistedSnapshotsRegional() {
        GovernanceIndicatorSnapshot pubSnapshot = new GovernanceIndicatorSnapshot();
        ReflectionTestUtils.setField(pubSnapshot, "visibility", SnapshotVisibility.PUBLISHED);

        GovernanceIndicatorSnapshot intSnapshot = new GovernanceIndicatorSnapshot();
        ReflectionTestUtils.setField(intSnapshot, "visibility", SnapshotVisibility.INTERNAL);

        when(snapshotRepository.findSnapshotsByScopeHierarchy(
                GovernanceScopeType.DISTRICT, "Madhya Pradesh", "Bhopal", null, null, null, null))
                .thenReturn(List.of(pubSnapshot, intSnapshot));

        GovernanceScopeQuery scope = GovernanceScopeQuery.ofDistrict("Madhya Pradesh", "Bhopal");

        // Anonymous user only sees PUBLISHED
        when(collaborationSecurityService.resolveCurrentUser(null)).thenReturn(Optional.empty());
        List<GovernanceIndicatorSnapshot> publicResults = queryService.queryPersistedSnapshots(scope, null, null);
        assertThat(publicResults).hasSize(1);
        assertThat(publicResults.get(0).getVisibility()).isEqualTo(SnapshotVisibility.PUBLISHED);

        // Official/Admin sees both
        when(collaborationSecurityService.resolveCurrentUser(adminAuth)).thenReturn(Optional.of(adminUser));
        List<GovernanceIndicatorSnapshot> adminResults = queryService.queryPersistedSnapshots(scope, null, adminAuth);
        assertThat(adminResults).hasSize(2);
    }

    // =========================================================================
    // 6. ADMINISTRATIVE SUMMARY (LIVE) TESTS
    // =========================================================================

    @Test
    @DisplayName("Should generate live administrative summary with all 10 default indicators")
    void testGenerateAdministrativeSummaryDefaultAllIndicators() {
        GovernanceScopeQuery scope = GovernanceScopeQuery.ofDistrict("Madhya Pradesh", "Bhopal");
        Instant t1 = Instant.parse("2026-09-24T00:00:00Z");
        Instant tMax = Instant.parse("2026-09-24T02:00:00Z");

        for (String code : GovernanceQueryService.DEFAULT_SUMMARY_INDICATORS) {
            GovernanceIndicatorDefinition def = new GovernanceIndicatorDefinition(
                    code, code, "Desc", IndicatorCategory.STATUS_DISTRIBUTION,
                    IndicatorUnit.COUNT, AggregationMethod.COUNT, "LAND_RECORD", "1.0");
            when(definitionRepository.findByCode(code)).thenReturn(Optional.of(def));

            Instant ts = code.equals("DISPUTED_PARCEL_COUNT") ? tMax : t1;
            CalculationResult calc = new CalculationResult(BigDecimal.valueOf(10), BigDecimal.valueOf(100), "{}", ts);
            when(calculationRepository.calculateIndicator(
                    eq(code), eq(GovernanceScopeType.DISTRICT), eq("Madhya Pradesh"), eq("Bhopal"), eq(null), eq(null), eq(null)))
                    .thenReturn(calc);
        }

        GovernanceAdministrativeSummaryResponse summary = queryService.generateAdministrativeSummary(
                scope, null, null, null);

        assertThat(summary).isNotNull();
        assertThat(summary.summaryMode()).isEqualTo("LIVE");
        assertThat(summary.calculationVersion()).isEqualTo("1.0");
        assertThat(summary.totalIndicatorsEvaluated()).isEqualTo(10);
        assertThat(summary.indicators()).hasSize(10);
        assertThat(summary.sourceDataTimestamp()).isEqualTo(tMax);
        assertThat(summary.scope().scopeType()).isEqualTo(GovernanceScopeType.DISTRICT);
        assertThat(summary.scope().state()).isEqualTo("Madhya Pradesh");
        assertThat(summary.scope().district()).isEqualTo("Bhopal");
        assertThat(summary.scope().projectId()).isNull();
        assertThat(summary.scope().projectName()).isNull();
    }

    @Test
    @DisplayName("Should generate live summary filtered by category")
    void testGenerateAdministrativeSummaryCategoryFilter() {
        GovernanceScopeQuery scope = GovernanceScopeQuery.ofState("Madhya Pradesh");

        // Mock land use indicators with LAND_USE category, others with STATUS_DISTRIBUTION
        for (String code : GovernanceQueryService.DEFAULT_SUMMARY_INDICATORS) {
            IndicatorCategory cat = code.contains("LAND_USE") ? IndicatorCategory.LAND_USE : IndicatorCategory.STATUS_DISTRIBUTION;
            GovernanceIndicatorDefinition def = new GovernanceIndicatorDefinition(
                    code, code, "Desc", cat, IndicatorUnit.COUNT, AggregationMethod.COUNT, "LAND_RECORD", "1.0");
            when(definitionRepository.findByCode(code)).thenReturn(Optional.of(def));

            if (cat == IndicatorCategory.LAND_USE) {
                CalculationResult calc = new CalculationResult(BigDecimal.valueOf(5), null, "{}", Instant.now());
                when(calculationRepository.calculateIndicator(
                        eq(code), eq(GovernanceScopeType.STATE), eq("Madhya Pradesh"), eq(null), eq(null), eq(null), eq(null)))
                        .thenReturn(calc);
            }
        }

        GovernanceAdministrativeSummaryResponse summary = queryService.generateAdministrativeSummary(
                scope, IndicatorCategory.LAND_USE, null, null);

        assertThat(summary.totalIndicatorsEvaluated()).isEqualTo(3);
        assertThat(summary.indicators()).allMatch(i -> i.category() == IndicatorCategory.LAND_USE);
    }

    @Test
    @DisplayName("Should generate live summary for explicit list of indicators")
    void testGenerateAdministrativeSummaryExplicitIndicators() {
        GovernanceScopeQuery scope = GovernanceScopeQuery.ofTehsil("Madhya Pradesh", "Bhopal", "Huzur");
        List<String> explicitCodes = List.of("ACTIVE_PARCEL_COUNT", "DISPUTED_PARCEL_COUNT");

        for (String code : explicitCodes) {
            GovernanceIndicatorDefinition def = new GovernanceIndicatorDefinition(
                    code, code, "Desc", IndicatorCategory.STATUS_DISTRIBUTION,
                    IndicatorUnit.COUNT, AggregationMethod.COUNT, "LAND_RECORD", "1.0");
            when(definitionRepository.findByCode(code)).thenReturn(Optional.of(def));

            CalculationResult calc = new CalculationResult(BigDecimal.valueOf(42), BigDecimal.valueOf(100), "{}", Instant.now());
            when(calculationRepository.calculateIndicator(
                    eq(code), eq(GovernanceScopeType.TEHSIL), eq("Madhya Pradesh"), eq("Bhopal"), eq("Huzur"), eq(null), eq(null)))
                    .thenReturn(calc);
        }

        GovernanceAdministrativeSummaryResponse summary = queryService.generateAdministrativeSummary(
                scope, null, explicitCodes, null);

        assertThat(summary.totalIndicatorsEvaluated()).isEqualTo(2);
        assertThat(summary.indicators().get(0).indicatorCode()).isEqualTo("ACTIVE_PARCEL_COUNT");
        assertThat(summary.indicators().get(1).indicatorCode()).isEqualTo("DISPUTED_PARCEL_COUNT");
    }

    @Test
    @DisplayName("Should filter explicit indicators with category constraint")
    void testGenerateAdministrativeSummaryCategoryAndExplicitIntersection() {
        GovernanceScopeQuery scope = GovernanceScopeQuery.ofDistrict("Madhya Pradesh", "Bhopal");
        List<String> explicitCodes = List.of("ACTIVE_PARCEL_COUNT", "AREA_BY_LAND_USE");

        GovernanceIndicatorDefinition def1 = new GovernanceIndicatorDefinition(
                "ACTIVE_PARCEL_COUNT", "Active Count", "Desc", IndicatorCategory.STATUS_DISTRIBUTION,
                IndicatorUnit.COUNT, AggregationMethod.COUNT, "LAND_RECORD", "1.0");
        GovernanceIndicatorDefinition def2 = new GovernanceIndicatorDefinition(
                "AREA_BY_LAND_USE", "Area by Land Use", "Desc", IndicatorCategory.LAND_USE,
                IndicatorUnit.SQ_METERS, AggregationMethod.SUM, "LAND_RECORD", "1.0");

        when(definitionRepository.findByCode("ACTIVE_PARCEL_COUNT")).thenReturn(Optional.of(def1));
        when(definitionRepository.findByCode("AREA_BY_LAND_USE")).thenReturn(Optional.of(def2));

        CalculationResult calc = new CalculationResult(BigDecimal.valueOf(100), null, "{}", Instant.now());
        when(calculationRepository.calculateIndicator(
                eq("ACTIVE_PARCEL_COUNT"), eq(GovernanceScopeType.DISTRICT), eq("Madhya Pradesh"), eq("Bhopal"), eq(null), eq(null), eq(null)))
                .thenReturn(calc);

        GovernanceAdministrativeSummaryResponse summary = queryService.generateAdministrativeSummary(
                scope, IndicatorCategory.STATUS_DISTRIBUTION, explicitCodes, null);

        assertThat(summary.totalIndicatorsEvaluated()).isEqualTo(1);
        assertThat(summary.indicators().get(0).indicatorCode()).isEqualTo("ACTIVE_PARCEL_COUNT");
    }

    @Test
    @DisplayName("Should fail when explicit indicators and category have empty intersection")
    void testGenerateAdministrativeSummaryCategoryAndExplicitEmptyIntersection() {
        GovernanceScopeQuery scope = GovernanceScopeQuery.ofDistrict("Madhya Pradesh", "Bhopal");
        List<String> explicitCodes = List.of("AREA_BY_LAND_USE");

        GovernanceIndicatorDefinition def = new GovernanceIndicatorDefinition(
                "AREA_BY_LAND_USE", "Area", "Desc", IndicatorCategory.LAND_USE,
                IndicatorUnit.SQ_METERS, AggregationMethod.SUM, "LAND_RECORD", "1.0");
        when(definitionRepository.findByCode("AREA_BY_LAND_USE")).thenReturn(Optional.of(def));

        assertThatThrownBy(() -> queryService.generateAdministrativeSummary(
                scope, IndicatorCategory.STATUS_DISTRIBUTION, explicitCodes, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No requested indicators match the specified category filter");
    }

    @Test
    @DisplayName("Should generate live summary for PROJECT scope with project name")
    void testGenerateAdministrativeSummaryProjectScope() {
        GovernanceScopeQuery scope = GovernanceScopeQuery.ofProject(projectId);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(collaborationSecurityService.resolveCurrentUser(adminAuth)).thenReturn(Optional.of(adminUser));

        List<String> explicitCodes = List.of("ACTIVE_PARCEL_COUNT");
        GovernanceIndicatorDefinition def = new GovernanceIndicatorDefinition(
                "ACTIVE_PARCEL_COUNT", "Active Count", "Desc", IndicatorCategory.STATUS_DISTRIBUTION,
                IndicatorUnit.COUNT, AggregationMethod.COUNT, "LAND_RECORD", "1.0");
        when(definitionRepository.findByCode("ACTIVE_PARCEL_COUNT")).thenReturn(Optional.of(def));

        CalculationResult calc = new CalculationResult(BigDecimal.valueOf(15), BigDecimal.valueOf(20), "{}", Instant.now());
        when(calculationRepository.calculateIndicator(
                eq("ACTIVE_PARCEL_COUNT"), eq(GovernanceScopeType.PROJECT), eq(null), eq(null), eq(null), eq(null), eq(projectId)))
                .thenReturn(calc);

        GovernanceAdministrativeSummaryResponse summary = queryService.generateAdministrativeSummary(
                scope, null, explicitCodes, adminAuth);

        assertThat(summary.scope().scopeType()).isEqualTo(GovernanceScopeType.PROJECT);
        assertThat(summary.scope().projectId()).isEqualTo(projectId);
        assertThat(summary.scope().projectName()).isEqualTo(testProject.getName());
        assertThat(summary.totalIndicatorsEvaluated()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should fail project summary with 404 IDOR protection when user unauthorized")
    void testGenerateAdministrativeSummaryProjectUnauthorized() {
        GovernanceScopeQuery scope = GovernanceScopeQuery.ofProject(projectId);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(collaborationSecurityService.resolveCurrentUser(researcherAuth)).thenReturn(Optional.of(researcherUser));
        org.mockito.Mockito.doThrow(new ResourceNotFoundException("Project not found"))
                .when(collaborationSecurityService).checkCanViewProject(testProject, researcherUser);

        assertThatThrownBy(() -> queryService.generateAdministrativeSummary(scope, null, null, researcherAuth))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Project not found");
    }

    @Test
    @DisplayName("Should fail project summary with 404 IDOR protection when user is anonymous")
    void testGenerateAdministrativeSummaryProjectAnonymous() {
        GovernanceScopeQuery scope = GovernanceScopeQuery.ofProject(projectId);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(collaborationSecurityService.resolveCurrentUser(null)).thenReturn(Optional.empty());
        org.mockito.Mockito.doThrow(new ResourceNotFoundException("Project not found"))
                .when(collaborationSecurityService).checkCanViewProject(testProject, null);

        assertThatThrownBy(() -> queryService.generateAdministrativeSummary(scope, null, null, null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Project not found");
    }

    @Test
    @DisplayName("Should succeed project summary for authorized regular project member")
    void testGenerateAdministrativeSummaryProjectMember() {
        GovernanceScopeQuery scope = GovernanceScopeQuery.ofProject(projectId);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(collaborationSecurityService.resolveCurrentUser(researcherAuth)).thenReturn(Optional.of(researcherUser));
        org.mockito.Mockito.doNothing().when(collaborationSecurityService).checkCanViewProject(testProject, researcherUser);

        List<String> explicitCodes = List.of("ACTIVE_PARCEL_COUNT");
        GovernanceIndicatorDefinition def = new GovernanceIndicatorDefinition(
                "ACTIVE_PARCEL_COUNT", "Active Count", "Desc", IndicatorCategory.STATUS_DISTRIBUTION,
                IndicatorUnit.COUNT, AggregationMethod.COUNT, "LAND_RECORD", "1.0");
        when(definitionRepository.findByCode("ACTIVE_PARCEL_COUNT")).thenReturn(Optional.of(def));

        CalculationResult calc = new CalculationResult(BigDecimal.valueOf(15), BigDecimal.valueOf(20), "{}", Instant.now());
        when(calculationRepository.calculateIndicator(
                eq("ACTIVE_PARCEL_COUNT"), eq(GovernanceScopeType.PROJECT), eq(null), eq(null), eq(null), eq(null), eq(projectId)))
                .thenReturn(calc);

        GovernanceAdministrativeSummaryResponse summary = queryService.generateAdministrativeSummary(
                scope, null, explicitCodes, researcherAuth);

        assertThat(summary.scope().scopeType()).isEqualTo(GovernanceScopeType.PROJECT);
        assertThat(summary.scope().projectId()).isEqualTo(projectId);
        assertThat(summary.scope().projectName()).isEqualTo(testProject.getName());
        assertThat(summary.totalIndicatorsEvaluated()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should fail summary with invalid geographic scope hierarchy")
    void testGenerateAdministrativeSummaryInvalidScope() {
        GovernanceScopeQuery malformed = new GovernanceScopeQuery(
                GovernanceScopeType.DISTRICT, "Madhya Pradesh", null, null, null, null);

        assertThatThrownBy(() -> queryService.generateAdministrativeSummary(malformed, null, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("state and district are required for DISTRICT scope type");
    }

    @Test
    @DisplayName("Should fail summary when explicit indicator is unknown")
    void testGenerateAdministrativeSummaryUnknownIndicator() {
        GovernanceScopeQuery scope = GovernanceScopeQuery.ofDistrict("Madhya Pradesh", "Bhopal");
        when(definitionRepository.findByCode("NON_EXISTENT")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> queryService.generateAdministrativeSummary(
                scope, null, List.of("NON_EXISTENT"), null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Indicator definition not found: NON_EXISTENT");
    }

    @Test
    @DisplayName("Should fail summary when explicit indicator is inactive")
    void testGenerateAdministrativeSummaryInactiveIndicator() {
        GovernanceScopeQuery scope = GovernanceScopeQuery.ofDistrict("Madhya Pradesh", "Bhopal");
        when(definitionRepository.findByCode("INACTIVE_DEF")).thenReturn(Optional.of(inactiveDefinition));

        assertThatThrownBy(() -> queryService.generateAdministrativeSummary(
                scope, null, List.of("INACTIVE_DEF"), null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Indicator definition is inactive: INACTIVE_DEF");
    }

    @Test
    @DisplayName("Should fail summary when explicit indicator calculation is unsupported")
    void testGenerateAdministrativeSummaryUnsupportedIndicator() {
        GovernanceScopeQuery scope = GovernanceScopeQuery.ofDistrict("Madhya Pradesh", "Bhopal");
        GovernanceIndicatorDefinition defWithoutCalc = new GovernanceIndicatorDefinition(
                "FUTURE_UNSUPPORTED", "Future", "Desc", IndicatorCategory.LAND_USE,
                IndicatorUnit.PERCENTAGE, AggregationMethod.PERCENTAGE_SHARE, "LAND_RECORD", "1.0");
        when(definitionRepository.findByCode("FUTURE_UNSUPPORTED")).thenReturn(Optional.of(defWithoutCalc));

        assertThatThrownBy(() -> queryService.generateAdministrativeSummary(
                scope, null, List.of("FUTURE_UNSUPPORTED"), null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported calculation for indicator code: FUTURE_UNSUPPORTED");
    }
}
