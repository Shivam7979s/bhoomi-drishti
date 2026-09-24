package com.bhoomidrishti.governance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.service.CollaborationSecurityService;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.governance.dto.BreakdownVarianceItemDTO;
import com.bhoomidrishti.governance.dto.CurrentIndicatorQueryResult;
import com.bhoomidrishti.governance.dto.GovernanceComparisonRequest;
import com.bhoomidrishti.governance.dto.GovernanceComparisonResponse;
import com.bhoomidrishti.governance.dto.GovernanceIndicatorEvidenceResponse;
import com.bhoomidrishti.governance.dto.GovernanceScopeQuery;
import com.bhoomidrishti.governance.entity.AggregationMethod;
import com.bhoomidrishti.governance.entity.GovernanceEvidenceType;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorDefinition;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorSnapshot;
import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import com.bhoomidrishti.governance.entity.IndicatorCategory;
import com.bhoomidrishti.governance.entity.IndicatorUnit;
import com.bhoomidrishti.governance.entity.SnapshotVisibility;
import com.bhoomidrishti.governance.repository.GovernanceIndicatorSnapshotRepository;
import com.bhoomidrishti.governance.service.GovernanceComparisonService;
import com.bhoomidrishti.governance.service.GovernanceIndicatorService;
import com.bhoomidrishti.governance.service.GovernanceQueryService;
import tools.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
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
class GovernanceComparisonServiceTest {

    @Mock
    private GovernanceIndicatorSnapshotRepository snapshotRepository;

    @Mock
    private GovernanceIndicatorService governanceIndicatorService;

    @Mock
    private GovernanceQueryService governanceQueryService;

    @Mock
    private CollaborationSecurityService collaborationSecurityService;

    private ObjectMapper objectMapper;
    private GovernanceComparisonService comparisonService;

    private User adminUser;
    private User citizenUser;
    private Authentication adminAuth;
    private Authentication citizenAuth;

    private GovernanceIndicatorDefinition definitionLandUse;
    private GovernanceIndicatorDefinition definitionDispute;

    private Project testProject;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        comparisonService = new GovernanceComparisonService(
                snapshotRepository,
                governanceIndicatorService,
                governanceQueryService,
                collaborationSecurityService,
                objectMapper
        );

        adminUser = User.registerLocal("Admin Official", "admin@bhoomi.gov.in", "hash");
        ReflectionTestUtils.setField(adminUser, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(adminUser, "role", Role.GOVERNMENT_OFFICIAL);

        citizenUser = User.registerLocal("Citizen User", "citizen@example.com", "hash");
        ReflectionTestUtils.setField(citizenUser, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(citizenUser, "role", Role.PUBLIC);

        adminAuth = new UsernamePasswordAuthenticationToken(adminUser, null, Collections.emptyList());
        citizenAuth = new UsernamePasswordAuthenticationToken(citizenUser, null, Collections.emptyList());

        definitionLandUse = new GovernanceIndicatorDefinition(
                "PARCEL_COUNT_BY_LAND_USE",
                "Parcel Count by Land Use",
                "Distribution of parcels by land use classification",
                IndicatorCategory.LAND_USE,
                IndicatorUnit.COUNT,
                AggregationMethod.SUM,
                "land_records",
                "1.0"
        );
        ReflectionTestUtils.setField(definitionLandUse, "id", UUID.randomUUID());

        definitionDispute = new GovernanceIndicatorDefinition(
                "DISPUTED_PARCEL_COUNT",
                "Disputed Parcel Count",
                "Number of parcels with active legal disputes",
                IndicatorCategory.STATUS_DISTRIBUTION,
                IndicatorUnit.COUNT,
                AggregationMethod.SUM,
                "land_records",
                "1.0"
        );
        ReflectionTestUtils.setField(definitionDispute, "id", UUID.randomUUID());

        testProject = new Project(null, "Metro Corridor Project", "metro-corridor", "Desc", null, adminUser);
        ReflectionTestUtils.setField(testProject, "id", UUID.randomUUID());
    }

    private GovernanceIndicatorSnapshot createSnapshot(
            UUID id,
            GovernanceIndicatorDefinition def,
            Project project,
            GovernanceScopeType scopeType,
            String state,
            String district,
            String tehsil,
            String village,
            Instant asOf,
            BigDecimal numericValue,
            BigDecimal denominator,
            String breakdownJson,
            String calculationVersion,
            SnapshotVisibility visibility,
            User user) {
        GovernanceIndicatorSnapshot s = new GovernanceIndicatorSnapshot(
                def,
                project,
                scopeType,
                state,
                district,
                tehsil,
                village,
                visibility,
                asOf,
                null,
                null,
                numericValue,
                denominator,
                breakdownJson,
                calculationVersion,
                asOf,
                "v1",
                user
        );
        ReflectionTestUtils.setField(s, "id", id);
        return s;
    }

    // =========================================================================
    // 1. Quantitative Delta Math
    // =========================================================================

    @Test
    @DisplayName("Mode A: Positive delta calculates absolute and percentage change correctly")
    void compareTwoSnapshots_positiveDelta_calculatesCorrectly() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        Instant now = Instant.now();

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now.minus(30, ChronoUnit.DAYS),
                new BigDecimal("100.0000"), new BigDecimal("1000.0000"),
                "{\"AGRICULTURAL\": 100}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        GovernanceIndicatorSnapshot snapB = createSnapshot(
                idB, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now,
                new BigDecimal("150.0000"), new BigDecimal("1200.0000"),
                "{\"AGRICULTURAL\": 150}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(snapshotRepository.findById(idB)).thenReturn(Optional.of(snapB));
        when(governanceIndicatorService.getSnapshotEvidence(idA, adminAuth)).thenReturn(Collections.emptyList());
        when(governanceIndicatorService.getSnapshotEvidence(idB, adminAuth)).thenReturn(Collections.emptyList());

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idB, false);
        GovernanceComparisonResponse response = comparisonService.compareGovernanceSnapshots(request, adminAuth);

        assertThat(response).isNotNull();
        assertThat(response.indicatorCode()).isEqualTo("PARCEL_COUNT_BY_LAND_USE");
        assertThat(response.quantitativeVariance().absoluteDelta()).isEqualByComparingTo(new BigDecimal("50.0000"));
        assertThat(response.quantitativeVariance().percentageChange()).isEqualByComparingTo(new BigDecimal("50.0000"));
        assertThat(response.quantitativeVariance().percentageChangeDefined()).isTrue();
        assertThat(response.quantitativeVariance().trendDirection()).isEqualTo("NOT_DEFINED");
        assertThat(response.quantitativeVariance().denominatorDelta()).isEqualByComparingTo(new BigDecimal("200.0000"));
        assertThat(response.elapsedDays()).isEqualTo(30L);
        assertThat(response.chronologicalReversal()).isFalse();
    }

    @Test
    @DisplayName("Mode A: Negative delta calculates correctly")
    void compareTwoSnapshots_negativeDelta_calculatesCorrectly() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        Instant now = Instant.now();

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now.minus(60, ChronoUnit.DAYS),
                new BigDecimal("200.0000"), null,
                "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        GovernanceIndicatorSnapshot snapB = createSnapshot(
                idB, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now,
                new BigDecimal("150.0000"), null,
                "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(snapshotRepository.findById(idB)).thenReturn(Optional.of(snapB));
        when(governanceIndicatorService.getSnapshotEvidence(any(), eq(adminAuth))).thenReturn(Collections.emptyList());

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idB, false);
        GovernanceComparisonResponse response = comparisonService.compareGovernanceSnapshots(request, adminAuth);

        assertThat(response.quantitativeVariance().absoluteDelta()).isEqualByComparingTo(new BigDecimal("-50.0000"));
        assertThat(response.quantitativeVariance().percentageChange()).isEqualByComparingTo(new BigDecimal("-25.0000"));
        assertThat(response.quantitativeVariance().percentageChangeDefined()).isTrue();
    }

    @Test
    @DisplayName("Mode A: Unchanged value produces zero delta and zero percentage")
    void compareTwoSnapshots_unchangedValue_calculatesCorrectly() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        Instant now = Instant.now();

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now.minus(10, ChronoUnit.DAYS),
                new BigDecimal("100.0000"), null,
                "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        GovernanceIndicatorSnapshot snapB = createSnapshot(
                idB, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now,
                new BigDecimal("100.0000"), null,
                "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(snapshotRepository.findById(idB)).thenReturn(Optional.of(snapB));

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idB, false);
        GovernanceComparisonResponse response = comparisonService.compareGovernanceSnapshots(request, adminAuth);

        assertThat(response.quantitativeVariance().absoluteDelta()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.quantitativeVariance().percentageChange()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.quantitativeVariance().percentageChangeDefined()).isTrue();
    }

    @Test
    @DisplayName("Mode A: Zero baseline safely flags percentageChangeDefined=false without arithmetic exception")
    void compareTwoSnapshots_zeroBaseline_avoidsDivisionByZero() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        Instant now = Instant.now();

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now.minus(15, ChronoUnit.DAYS),
                BigDecimal.ZERO, null,
                "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        GovernanceIndicatorSnapshot snapB = createSnapshot(
                idB, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now,
                new BigDecimal("50.0000"), null,
                "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(snapshotRepository.findById(idB)).thenReturn(Optional.of(snapB));

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idB, false);
        GovernanceComparisonResponse response = comparisonService.compareGovernanceSnapshots(request, adminAuth);

        assertThat(response.quantitativeVariance().absoluteDelta()).isEqualByComparingTo(new BigDecimal("50.0000"));
        assertThat(response.quantitativeVariance().percentageChange()).isNull();
        assertThat(response.quantitativeVariance().percentageChangeDefined()).isFalse();
    }

    // =========================================================================
    // 2. Compatibility & Scope Validation
    // =========================================================================

    @Test
    @DisplayName("Snapshots with different indicator codes are rejected with HTTP 400 (IllegalArgumentException)")
    void compareTwoSnapshots_differentIndicators_rejectedWithBadRequest() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        Instant now = Instant.now();

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now, new BigDecimal("100"), null, "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        GovernanceIndicatorSnapshot snapB = createSnapshot(
                idB, definitionDispute, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now, new BigDecimal("50"), null, "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(snapshotRepository.findById(idB)).thenReturn(Optional.of(snapB));

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idB, false);

        assertThatThrownBy(() -> comparisonService.compareGovernanceSnapshots(request, adminAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot compare snapshots of different indicators");
    }

    @Test
    @DisplayName("Snapshots with different scope types (e.g. STATE vs DISTRICT) are rejected")
    void compareTwoSnapshots_differentScopeTypes_rejectedWithBadRequest() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        Instant now = Instant.now();

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, null, GovernanceScopeType.STATE,
                "Madhya Pradesh", null, null, null,
                now, new BigDecimal("100"), null, "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        GovernanceIndicatorSnapshot snapB = createSnapshot(
                idB, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now, new BigDecimal("100"), null, "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(snapshotRepository.findById(idB)).thenReturn(Optional.of(snapB));

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idB, false);

        assertThatThrownBy(() -> comparisonService.compareGovernanceSnapshots(request, adminAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot compare snapshots with different scope types");
    }

    @Test
    @DisplayName("Snapshots from different districts (e.g. Bhopal vs Indore) are rejected")
    void compareTwoSnapshots_differentDistricts_rejectedWithBadRequest() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        Instant now = Instant.now();

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now, new BigDecimal("100"), null, "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        GovernanceIndicatorSnapshot snapB = createSnapshot(
                idB, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Indore", null, null,
                now, new BigDecimal("100"), null, "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(snapshotRepository.findById(idB)).thenReturn(Optional.of(snapB));

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idB, false);

        assertThatThrownBy(() -> comparisonService.compareGovernanceSnapshots(request, adminAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot compare snapshots with mismatched district");
    }

    @Test
    @DisplayName("Snapshots from different projects are rejected")
    void compareTwoSnapshots_differentProjects_rejectedWithBadRequest() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        Instant now = Instant.now();

        Project otherProject = new Project(null, "Other Project", "other-project", "Desc", null, adminUser);
        ReflectionTestUtils.setField(otherProject, "id", UUID.randomUUID());

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, testProject, GovernanceScopeType.PROJECT,
                null, null, null, null,
                now, new BigDecimal("100"), null, "{}", "1.0", SnapshotVisibility.INTERNAL, adminUser);

        GovernanceIndicatorSnapshot snapB = createSnapshot(
                idB, definitionLandUse, otherProject, GovernanceScopeType.PROJECT,
                null, null, null, null,
                now, new BigDecimal("100"), null, "{}", "1.0", SnapshotVisibility.INTERNAL, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(snapshotRepository.findById(idB)).thenReturn(Optional.of(snapB));

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idB, false);

        assertThatThrownBy(() -> comparisonService.compareGovernanceSnapshots(request, adminAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot compare snapshots from different projects");
    }

    // =========================================================================
    // 3. Chronology Normalization
    // =========================================================================

    @Test
    @DisplayName("Chronological reversal: Earlier snapshot becomes baseline and later becomes target")
    void compareTwoSnapshots_chronologicalReversal_normalizesEarlierAsBaseline() {
        UUID idLater = UUID.randomUUID();
        UUID idEarlier = UUID.randomUUID();
        Instant now = Instant.now();

        GovernanceIndicatorSnapshot snapLater = createSnapshot(
                idLater, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now,
                new BigDecimal("150.0000"), null,
                "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        GovernanceIndicatorSnapshot snapEarlier = createSnapshot(
                idEarlier, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now.minus(45, ChronoUnit.DAYS),
                new BigDecimal("100.0000"), null,
                "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        // User passes later snapshot as baselineSnapshotId
        when(snapshotRepository.findById(idLater)).thenReturn(Optional.of(snapLater));
        when(snapshotRepository.findById(idEarlier)).thenReturn(Optional.of(snapEarlier));

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idLater, idEarlier, false);
        GovernanceComparisonResponse response = comparisonService.compareGovernanceSnapshots(request, adminAuth);

        assertThat(response.chronologicalReversal()).isTrue();
        assertThat(response.baseline().snapshotId()).isEqualTo(idEarlier);
        assertThat(response.target().snapshotId()).isEqualTo(idLater);
        // Absolute delta should be positive (150 - 100) because earlier is baseline
        assertThat(response.quantitativeVariance().absoluteDelta()).isEqualByComparingTo(new BigDecimal("50.0000"));
    }

    // =========================================================================
    // 4. Breakdown Comparison
    // =========================================================================

    @Test
    @DisplayName("Breakdown: Common keys calculate delta and percentage change correctly")
    void compareTwoSnapshots_breakdownVariances_commonKeys_calculatesDeltaAndPct() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        Instant now = Instant.now();

        String jsonA = "{\"AGRICULTURAL\": 100, \"RESIDENTIAL\": 50}";
        String jsonB = "{\"AGRICULTURAL\": 120, \"RESIDENTIAL\": 40}";

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now.minus(10, ChronoUnit.DAYS),
                new BigDecimal("150"), null, jsonA, "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        GovernanceIndicatorSnapshot snapB = createSnapshot(
                idB, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now,
                new BigDecimal("160"), null, jsonB, "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(snapshotRepository.findById(idB)).thenReturn(Optional.of(snapB));

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idB, false);
        GovernanceComparisonResponse response = comparisonService.compareGovernanceSnapshots(request, adminAuth);

        List<BreakdownVarianceItemDTO> variances = response.breakdownVariances();
        assertThat(variances).hasSize(2);

        BreakdownVarianceItemDTO agr = variances.stream()
                .filter(v -> v.key().equals("AGRICULTURAL")).findFirst().orElseThrow();
        assertThat(agr.baselineValue()).isEqualByComparingTo(new BigDecimal("100"));
        assertThat(agr.targetValue()).isEqualByComparingTo(new BigDecimal("120"));
        assertThat(agr.delta()).isEqualByComparingTo(new BigDecimal("20"));
        assertThat(agr.percentageChange()).isEqualByComparingTo(new BigDecimal("20.0000"));
        assertThat(agr.percentageChangeDefined()).isTrue();

        BreakdownVarianceItemDTO res = variances.stream()
                .filter(v -> v.key().equals("RESIDENTIAL")).findFirst().orElseThrow();
        assertThat(res.delta()).isEqualByComparingTo(new BigDecimal("-10"));
    }

    @Test
    @DisplayName("Breakdown: Baseline-only and target-only keys handled safely with null deltas")
    void compareTwoSnapshots_breakdownVariances_disjointKeys_handledSafely() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        Instant now = Instant.now();

        String jsonA = "{\"COMMERCIAL\": 30}";
        String jsonB = "{\"INDUSTRIAL\": 45}";

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now.minus(10, ChronoUnit.DAYS),
                new BigDecimal("30"), null, jsonA, "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        GovernanceIndicatorSnapshot snapB = createSnapshot(
                idB, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now,
                new BigDecimal("45"), null, jsonB, "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(snapshotRepository.findById(idB)).thenReturn(Optional.of(snapB));

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idB, false);
        GovernanceComparisonResponse response = comparisonService.compareGovernanceSnapshots(request, adminAuth);

        List<BreakdownVarianceItemDTO> variances = response.breakdownVariances();
        assertThat(variances).hasSize(2);

        BreakdownVarianceItemDTO comm = variances.stream()
                .filter(v -> v.key().equals("COMMERCIAL")).findFirst().orElseThrow();
        assertThat(comm.baselineValue()).isEqualByComparingTo(new BigDecimal("30"));
        assertThat(comm.targetValue()).isNull();
        assertThat(comm.delta()).isNull();
        assertThat(comm.percentageChangeDefined()).isFalse();

        BreakdownVarianceItemDTO ind = variances.stream()
                .filter(v -> v.key().equals("INDUSTRIAL")).findFirst().orElseThrow();
        assertThat(ind.baselineValue()).isNull();
        assertThat(ind.targetValue()).isEqualByComparingTo(new BigDecimal("45"));
        assertThat(ind.delta()).isNull();
    }

    @Test
    @DisplayName("Breakdown: Non-numeric values preserved safely without throwing exceptions")
    void compareTwoSnapshots_breakdownVariances_nonNumericValues_handledSafely() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        Instant now = Instant.now();

        String jsonA = "{\"surveyAgency\": \"Survey of India\"}";
        String jsonB = "{\"surveyAgency\": \"National Remote Sensing Centre\"}";

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now.minus(10, ChronoUnit.DAYS),
                new BigDecimal("100"), null, jsonA, "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        GovernanceIndicatorSnapshot snapB = createSnapshot(
                idB, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now,
                new BigDecimal("100"), null, jsonB, "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(snapshotRepository.findById(idB)).thenReturn(Optional.of(snapB));

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idB, false);
        GovernanceComparisonResponse response = comparisonService.compareGovernanceSnapshots(request, adminAuth);

        BreakdownVarianceItemDTO item = response.breakdownVariances().get(0);
        assertThat(item.key()).isEqualTo("surveyAgency");
        assertThat(item.baselineValue()).isNull();
        assertThat(item.targetValue()).isNull();
        assertThat(item.baselineRawValue()).isEqualTo("Survey of India");
        assertThat(item.targetRawValue()).isEqualTo("National Remote Sensing Centre");
    }

    // =========================================================================
    // 5. Statutory Evidence Provenance Diff
    // =========================================================================

    @Test
    @DisplayName("Evidence delta: Correctly categorizes COMMON, ADDED, and REMOVED evidence")
    void compareTwoSnapshots_evidenceDelta_classifiesCommonAddedRemoved() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        Instant now = Instant.now();

        UUID docId1 = UUID.randomUUID();
        UUID docId2 = UUID.randomUUID();
        UUID docId3 = UUID.randomUUID();
        UUID chunk1 = UUID.randomUUID();
        UUID chunk2 = UUID.randomUUID();
        UUID chunk3 = UUID.randomUUID();

        GovernanceIndicatorEvidenceResponse evCommon = new GovernanceIndicatorEvidenceResponse(
                UUID.randomUUID(), idA, docId1, chunk1, "Doc 1", "ACT", "Chunk text 1",
                1, "Sec 1", GovernanceEvidenceType.STATUTORY_BENCHMARK,
                new BigDecimal("0.9500"), "Rationale 1", adminUser.getId(), "Admin", now);

        GovernanceIndicatorEvidenceResponse evRemoved = new GovernanceIndicatorEvidenceResponse(
                UUID.randomUUID(), idA, docId2, chunk2, "Doc 2", "CIRCULAR", "Chunk text 2",
                2, "Sec 2", GovernanceEvidenceType.ADMINISTRATIVE_CIRCULAR,
                new BigDecimal("0.8500"), "Rationale 2", adminUser.getId(), "Admin", now);

        GovernanceIndicatorEvidenceResponse evAdded = new GovernanceIndicatorEvidenceResponse(
                UUID.randomUUID(), idB, docId3, chunk3, "Doc 3", "POLICY", "Chunk text 3",
                3, "Sec 3", GovernanceEvidenceType.POLICY_FRAMEWORK,
                new BigDecimal("0.9000"), "Rationale 3", adminUser.getId(), "Admin", now);

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now.minus(10, ChronoUnit.DAYS),
                new BigDecimal("100"), null, "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        GovernanceIndicatorSnapshot snapB = createSnapshot(
                idB, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now,
                new BigDecimal("110"), null, "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(snapshotRepository.findById(idB)).thenReturn(Optional.of(snapB));
        when(governanceIndicatorService.getSnapshotEvidence(idA, adminAuth)).thenReturn(List.of(evCommon, evRemoved));
        when(governanceIndicatorService.getSnapshotEvidence(idB, adminAuth)).thenReturn(List.of(evCommon, evAdded));

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idB, false);
        GovernanceComparisonResponse response = comparisonService.compareGovernanceSnapshots(request, adminAuth);

        assertThat(response.evidenceDelta().commonEvidenceCount()).isEqualTo(1);
        assertThat(response.evidenceDelta().addedEvidenceCount()).isEqualTo(1);
        assertThat(response.evidenceDelta().removedEvidenceCount()).isEqualTo(1);
        assertThat(response.evidenceDelta().commonEvidence().get(0).documentTitle()).isEqualTo("Doc 1");
        assertThat(response.evidenceDelta().addedEvidence().get(0).documentTitle()).isEqualTo("Doc 3");
        assertThat(response.evidenceDelta().removedEvidence().get(0).documentTitle()).isEqualTo("Doc 2");
    }

    // =========================================================================
    // 6. Calculation Version Handling
    // =========================================================================

    @Test
    @DisplayName("Calculation version: Flags mismatch when versions differ")
    void compareTwoSnapshots_calculationVersionMismatch_flagsTrue() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        Instant now = Instant.now();

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now.minus(10, ChronoUnit.DAYS),
                new BigDecimal("100"), null, "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        GovernanceIndicatorSnapshot snapB = createSnapshot(
                idB, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now,
                new BigDecimal("100"), null, "{}", "2.0", SnapshotVisibility.PUBLISHED, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(snapshotRepository.findById(idB)).thenReturn(Optional.of(snapB));

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idB, false);
        GovernanceComparisonResponse response = comparisonService.compareGovernanceSnapshots(request, adminAuth);

        assertThat(response.calculationVersionMismatch()).isTrue();
    }

    // =========================================================================
    // 7. Mode B: Snapshot vs LIVE
    // =========================================================================

    @Test
    @DisplayName("Mode B: Snapshot vs LIVE executes successfully without persisting any data")
    void compareSnapshotWithLive_executesSuccessfullyWithoutPersistence() {
        UUID idA = UUID.randomUUID();
        Instant now = Instant.now();

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now.minus(30, ChronoUnit.DAYS),
                new BigDecimal("100.0000"), new BigDecimal("1000.0000"),
                "{\"AGRICULTURAL\": 100}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        CurrentIndicatorQueryResult liveResult = new CurrentIndicatorQueryResult(
                "PARCEL_COUNT_BY_LAND_USE",
                "Parcel Count by Land Use",
                IndicatorCategory.LAND_USE,
                IndicatorUnit.COUNT,
                AggregationMethod.SUM,
                GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null, null,
                new BigDecimal("130.0000"),
                new BigDecimal("1100.0000"),
                "{\"AGRICULTURAL\": 130}",
                "1.0",
                now
        );

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(governanceQueryService.calculateCurrentIndicator(eq("PARCEL_COUNT_BY_LAND_USE"), any(GovernanceScopeQuery.class), eq(adminAuth)))
                .thenReturn(liveResult);
        when(governanceIndicatorService.getSnapshotEvidence(idA, adminAuth)).thenReturn(Collections.emptyList());

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, null, true);
        GovernanceComparisonResponse response = comparisonService.compareGovernanceSnapshots(request, adminAuth);

        assertThat(response).isNotNull();
        assertThat(response.target().isLive()).isTrue();
        assertThat(response.target().snapshotId()).isNull();
        assertThat(response.target().evidenceCount()).isEqualTo(0);
        assertThat(response.quantitativeVariance().absoluteDelta()).isEqualByComparingTo(new BigDecimal("30.0000"));
        assertThat(response.quantitativeVariance().percentageChange()).isEqualByComparingTo(new BigDecimal("30.0000"));

        // Verify zero snapshots persisted
        verify(snapshotRepository, never()).save(any());
    }

    // =========================================================================
    // 8. Security & IDOR Protection
    // =========================================================================

    @Test
    @DisplayName("Security: Unauthorized project comparison throws ResourceNotFoundException (404)")
    void compareSnapshots_unauthorizedProjectSnapshot_returns404() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, testProject, GovernanceScopeType.PROJECT,
                null, null, null, null,
                Instant.now(), new BigDecimal("100"), null, "{}", "1.0", SnapshotVisibility.INTERNAL, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(collaborationSecurityService.resolveCurrentUser(citizenAuth)).thenReturn(Optional.of(citizenUser));
        doThrow(new ResourceNotFoundException("Project not found"))
                .when(collaborationSecurityService).checkCanViewProject(testProject, citizenUser);

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idB, false);

        assertThatThrownBy(() -> comparisonService.compareGovernanceSnapshots(request, citizenAuth))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Project not found");
    }

    @Test
    @DisplayName("Security: Citizen viewing unpublished regional snapshot receives 404")
    void compareSnapshots_unpublishedRegionalSnapshot_citizenAccess_returns404() {
        UUID idA = UUID.randomUUID();

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                Instant.now(), new BigDecimal("100"), null, "{}", "1.0", SnapshotVisibility.INTERNAL, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(collaborationSecurityService.resolveCurrentUser(citizenAuth)).thenReturn(Optional.of(citizenUser));

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, null, true);

        assertThatThrownBy(() -> comparisonService.compareGovernanceSnapshots(request, citizenAuth))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Governance snapshot not found");
    }

    @Test
    @DisplayName("Validation: Comparing a snapshot with itself is rejected with HTTP 400")
    void compareSnapshots_sameSnapshotId_rejectedWithBadRequest() {
        UUID idA = UUID.randomUUID();
        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idA, false);

        assertThatThrownBy(() -> comparisonService.compareGovernanceSnapshots(request, adminAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot compare a snapshot with itself");
    }

    @Test
    @DisplayName("Security: Authorized project comparison succeeds")
    void compareSnapshots_authorizedProjectSnapshot_succeeds() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        Instant now = Instant.now();

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, testProject, GovernanceScopeType.PROJECT,
                null, null, null, null,
                now.minus(15, ChronoUnit.DAYS), new BigDecimal("100"), null, "{}", "1.0", SnapshotVisibility.INTERNAL, adminUser);

        GovernanceIndicatorSnapshot snapB = createSnapshot(
                idB, definitionLandUse, testProject, GovernanceScopeType.PROJECT,
                null, null, null, null,
                now, new BigDecimal("120"), null, "{}", "1.0", SnapshotVisibility.INTERNAL, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(snapshotRepository.findById(idB)).thenReturn(Optional.of(snapB));
        when(collaborationSecurityService.resolveCurrentUser(adminAuth)).thenReturn(Optional.of(adminUser));

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idB, false);
        GovernanceComparisonResponse response = comparisonService.compareGovernanceSnapshots(request, adminAuth);

        assertThat(response).isNotNull();
        assertThat(response.projectId()).isEqualTo(testProject.getId());
        assertThat(response.quantitativeVariance().absoluteDelta()).isEqualByComparingTo(new BigDecimal("20"));
        verify(collaborationSecurityService, org.mockito.Mockito.times(2)).checkCanViewProject(testProject, adminUser);
    }

    @Test
    @DisplayName("Calculation version: Identical versions flag calculationVersionMismatch=false")
    void compareTwoSnapshots_matchingCalculationVersions_flagsFalse() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        Instant now = Instant.now();

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now.minus(10, ChronoUnit.DAYS),
                new BigDecimal("100"), null, "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        GovernanceIndicatorSnapshot snapB = createSnapshot(
                idB, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now,
                new BigDecimal("100"), null, "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(snapshotRepository.findById(idB)).thenReturn(Optional.of(snapB));

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idB, false);
        GovernanceComparisonResponse response = comparisonService.compareGovernanceSnapshots(request, adminAuth);

        assertThat(response.calculationVersionMismatch()).isFalse();
    }

    @Test
    @DisplayName("Validation: Snapshots from different tehsils are rejected")
    void compareTwoSnapshots_mismatchedTehsil_rejectedWithBadRequest() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        Instant now = Instant.now();

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, null, GovernanceScopeType.TEHSIL,
                "Madhya Pradesh", "Bhopal", "Huzur", null,
                now, new BigDecimal("100"), null, "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        GovernanceIndicatorSnapshot snapB = createSnapshot(
                idB, definitionLandUse, null, GovernanceScopeType.TEHSIL,
                "Madhya Pradesh", "Bhopal", "Berasia", null,
                now, new BigDecimal("100"), null, "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(snapshotRepository.findById(idB)).thenReturn(Optional.of(snapB));

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idB, false);

        assertThatThrownBy(() -> comparisonService.compareGovernanceSnapshots(request, adminAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot compare snapshots with mismatched tehsil");
    }

    @Test
    @DisplayName("Validation: Snapshots from different villages are rejected")
    void compareTwoSnapshots_mismatchedVillage_rejectedWithBadRequest() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        Instant now = Instant.now();

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, null, GovernanceScopeType.VILLAGE,
                "Madhya Pradesh", "Bhopal", "Huzur", "Kolar",
                now, new BigDecimal("100"), null, "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        GovernanceIndicatorSnapshot snapB = createSnapshot(
                idB, definitionLandUse, null, GovernanceScopeType.VILLAGE,
                "Madhya Pradesh", "Bhopal", "Huzur", "Bairagarh",
                now, new BigDecimal("100"), null, "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(snapshotRepository.findById(idB)).thenReturn(Optional.of(snapB));

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idB, false);

        assertThatThrownBy(() -> comparisonService.compareGovernanceSnapshots(request, adminAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot compare snapshots with mismatched village");
    }

    @Test
    @DisplayName("Quantitative: Null numeric values return null delta and NOT_DEFINED trend")
    void compareTwoSnapshots_nullNumericValue_handledSafely() {
        UUID idA = UUID.randomUUID();
        UUID idB = UUID.randomUUID();
        Instant now = Instant.now();

        GovernanceIndicatorSnapshot snapA = createSnapshot(
                idA, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now.minus(10, ChronoUnit.DAYS),
                null, null, "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        GovernanceIndicatorSnapshot snapB = createSnapshot(
                idB, definitionLandUse, null, GovernanceScopeType.DISTRICT,
                "Madhya Pradesh", "Bhopal", null, null,
                now,
                new BigDecimal("100"), null, "{}", "1.0", SnapshotVisibility.PUBLISHED, adminUser);

        when(snapshotRepository.findById(idA)).thenReturn(Optional.of(snapA));
        when(snapshotRepository.findById(idB)).thenReturn(Optional.of(snapB));

        GovernanceComparisonRequest request = new GovernanceComparisonRequest(idA, idB, false);
        GovernanceComparisonResponse response = comparisonService.compareGovernanceSnapshots(request, adminAuth);

        assertThat(response.quantitativeVariance().absoluteDelta()).isNull();
        assertThat(response.quantitativeVariance().percentageChange()).isNull();
        assertThat(response.quantitativeVariance().percentageChangeDefined()).isFalse();
        assertThat(response.quantitativeVariance().trendDirection()).isEqualTo("NOT_DEFINED");
    }

    @Test
    @DisplayName("Validation: Null comparison request rejected with IllegalArgumentException")
    void compareSnapshots_nullRequest_rejectedWithBadRequest() {
        assertThatThrownBy(() -> comparisonService.compareGovernanceSnapshots(null, adminAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Comparison request cannot be null");
    }

    @Test
    @DisplayName("Validation: Missing baseline snapshot ID rejected with IllegalArgumentException")
    void compareSnapshots_nullBaselineId_rejectedWithBadRequest() {
        GovernanceComparisonRequest request = new GovernanceComparisonRequest(null, UUID.randomUUID(), false);

        assertThatThrownBy(() -> comparisonService.compareGovernanceSnapshots(request, adminAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("baselineSnapshotId is required");
    }
}
