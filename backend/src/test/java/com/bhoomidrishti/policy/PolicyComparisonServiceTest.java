package com.bhoomidrishti.policy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
import com.bhoomidrishti.collaboration.service.CollaborationSecurityService;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.policy.dto.CompareScenariosRequest;
import com.bhoomidrishti.policy.dto.DistributionDelta;
import com.bhoomidrishti.policy.dto.MetricDeltas;
import com.bhoomidrishti.policy.dto.PairwiseComparison;
import com.bhoomidrishti.policy.dto.ScenarioComparisonResponse;
import com.bhoomidrishti.policy.dto.ScenarioResultTarget;
import com.bhoomidrishti.policy.entity.PolicyScenario;
import com.bhoomidrishti.policy.entity.ScenarioResult;
import com.bhoomidrishti.policy.entity.ScenarioType;
import com.bhoomidrishti.policy.repository.PolicyScenarioRepository;
import com.bhoomidrishti.policy.repository.ScenarioEvidenceRepository;
import com.bhoomidrishti.policy.repository.ScenarioResultRepository;
import com.bhoomidrishti.policy.service.PolicyComparisonService;
import tools.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class PolicyComparisonServiceTest {

    @Mock
    private PolicyScenarioRepository scenarioRepository;

    @Mock
    private ScenarioResultRepository resultRepository;

    @Mock
    private ScenarioEvidenceRepository evidenceRepository;

    @Mock
    private CollaborationSecurityService securityService;

    private ObjectMapper objectMapper;
    private PolicyComparisonService comparisonService;

    private User user;
    private Project project;
    private PolicyScenario scenarioA;
    private PolicyScenario scenarioB;
    private ScenarioResult resultA;
    private ScenarioResult resultB;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        comparisonService = new PolicyComparisonService(
                scenarioRepository,
                resultRepository,
                evidenceRepository,
                securityService,
                objectMapper
        );

        user = User.registerLocal("Researcher", "researcher@example.com", "hash");
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(user, "role", Role.RESEARCHER);

        Workspace ws = new Workspace("Urban Lab", "urban-lab", "Desc", "MoHUA", WorkspaceVisibility.PUBLIC, user);
        ReflectionTestUtils.setField(ws, "id", UUID.randomUUID());

        project = new Project(ws, "Master Plan 2030", "master-plan-2030", "Desc", null, user);
        ReflectionTestUtils.setField(project, "id", UUID.randomUUID());

        scenarioA = new PolicyScenario(project, user, "Scenario A", "scenario-a", "Desc A", ScenarioType.LAND_USE_CONVERSION);
        ReflectionTestUtils.setField(scenarioA, "id", UUID.randomUUID());

        scenarioB = new PolicyScenario(project, user, "Scenario B", "scenario-b", "Desc B", ScenarioType.LAND_USE_CONVERSION);
        ReflectionTestUtils.setField(scenarioB, "id", UUID.randomUUID());

        resultA = new ScenarioResult(scenarioA, user);
        ReflectionTestUtils.setField(resultA, "id", UUID.randomUUID());
        resultA.setExecutedAt(Instant.now().minusSeconds(3600));
        resultA.setTotalParcelsEvaluated(100L);
        resultA.setTotalParcelsAffected(20L);
        resultA.setTotalAreaAffectedSqm(new BigDecimal("50000.00"));
        resultA.setBaselineAreaSqm(new BigDecimal("60000.00"));
        resultA.setSimulatedAreaSqm(new BigDecimal("55000.00"));
        resultA.setDisputedParcelsCount(2L);
        resultA.setDisputedAreaSqm(new BigDecimal("4000.00"));
        resultA.setLandUseDistributionJson("{\"AGRICULTURAL\":{\"parcelCount\":15,\"areaSqMeters\":40000.00},\"COMMERCIAL\":{\"parcelCount\":5,\"areaSqMeters\":10000.00}}");
        resultA.setOwnershipDistributionJson("{\"PRIVATE\":{\"parcelCount\":18,\"areaSqMeters\":45000.00},\"GOVERNMENT\":{\"parcelCount\":2,\"areaSqMeters\":5000.00}}");

        resultB = new ScenarioResult(scenarioB, user);
        ReflectionTestUtils.setField(resultB, "id", UUID.randomUUID());
        resultB.setExecutedAt(Instant.now());
        resultB.setTotalParcelsEvaluated(120L);
        resultB.setTotalParcelsAffected(30L);
        resultB.setTotalAreaAffectedSqm(new BigDecimal("75000.00"));
        resultB.setBaselineAreaSqm(new BigDecimal("70000.00"));
        resultB.setSimulatedAreaSqm(new BigDecimal("68000.00"));
        resultB.setDisputedParcelsCount(5L);
        resultB.setDisputedAreaSqm(new BigDecimal("9000.00"));
        resultB.setLandUseDistributionJson("{\"AGRICULTURAL\":{\"parcelCount\":20,\"areaSqMeters\":50000.00},\"FOREST\":{\"parcelCount\":10,\"areaSqMeters\":25000.00}}");
        resultB.setOwnershipDistributionJson("{\"PRIVATE\":{\"parcelCount\":25,\"areaSqMeters\":60000.00},\"COMMUNITY\":{\"parcelCount\":5,\"areaSqMeters\":15000.00}}");
    }

    @Test
    @DisplayName("17 & 18. Compare two completed results: numeric deltas calculated accurately")
    void compareScenarios_twoCompletedResults_calculatesDeltas() {
        when(securityService.resolveCurrentUser(any())).thenReturn(Optional.of(user));
        when(scenarioRepository.findById(scenarioA.getId())).thenReturn(Optional.of(scenarioA));
        when(scenarioRepository.findById(scenarioB.getId())).thenReturn(Optional.of(scenarioB));
        when(securityService.canViewProject(project, user)).thenReturn(true);
        when(resultRepository.findFirstByScenarioIdOrderByExecutedAtDesc(scenarioA.getId())).thenReturn(Optional.of(resultA));
        when(resultRepository.findFirstByScenarioIdOrderByExecutedAtDesc(scenarioB.getId())).thenReturn(Optional.of(resultB));
        when(evidenceRepository.countByScenarioId(scenarioA.getId())).thenReturn(3L);
        when(evidenceRepository.countByScenarioId(scenarioB.getId())).thenReturn(1L);

        CompareScenariosRequest request = new CompareScenariosRequest(
                null,
                List.of(scenarioA.getId(), scenarioB.getId())
        );

        ScenarioComparisonResponse response = comparisonService.compareScenarios(request, null);

        assertThat(response).isNotNull();
        assertThat(response.scenarios()).hasSize(2);
        assertThat(response.comparisons()).hasSize(1);

        PairwiseComparison pair = response.comparisons().get(0);
        assertThat(pair.leftScenarioId()).isEqualTo(scenarioA.getId());
        assertThat(pair.rightScenarioId()).isEqualTo(scenarioB.getId());

        MetricDeltas deltas = pair.metricDeltas();
        // delta = scenarioB - scenarioA
        assertThat(deltas.totalParcelsEvaluated()).isEqualTo(20L); // 120 - 100
        assertThat(deltas.totalParcelsAffected()).isEqualTo(10L); // 30 - 20
        assertThat(deltas.totalAreaAffectedSqm()).isEqualByComparingTo("25000.00"); // 75000 - 50000
        assertThat(deltas.baselineAreaSqm()).isEqualByComparingTo("10000.00"); // 70000 - 60000
        assertThat(deltas.simulatedAreaSqm()).isEqualByComparingTo("13000.00"); // 68000 - 55000
        assertThat(deltas.disputedParcelsCount()).isEqualTo(3L); // 5 - 2
        assertThat(deltas.disputedAreaSqm()).isEqualByComparingTo("5000.00"); // 9000 - 4000

        // Ratio percentage points:
        // leftRate = (20 / 100) * 100 = 20.0000%
        // rightRate = (30 / 120) * 100 = 25.0000%
        // delta = 25.0000 - 20.0000 = +5.0000 pp
        assertThat(deltas.affectedParcelsPercentagePointDelta()).isEqualByComparingTo("5.0000");
    }

    @Test
    @DisplayName("19 & 21. Land-use distribution comparison with missing categories")
    void compareScenarios_landUseDistribution_handlesMissingCategories() {
        when(securityService.resolveCurrentUser(any())).thenReturn(Optional.of(user));
        when(scenarioRepository.findById(scenarioA.getId())).thenReturn(Optional.of(scenarioA));
        when(scenarioRepository.findById(scenarioB.getId())).thenReturn(Optional.of(scenarioB));
        when(securityService.canViewProject(project, user)).thenReturn(true);
        when(resultRepository.findFirstByScenarioIdOrderByExecutedAtDesc(scenarioA.getId())).thenReturn(Optional.of(resultA));
        when(resultRepository.findFirstByScenarioIdOrderByExecutedAtDesc(scenarioB.getId())).thenReturn(Optional.of(resultB));

        CompareScenariosRequest request = new CompareScenariosRequest(
                null,
                List.of(scenarioA.getId(), scenarioB.getId())
        );

        ScenarioComparisonResponse response = comparisonService.compareScenarios(request, null);
        List<DistributionDelta> luDeltas = response.comparisons().get(0).landUseDistributionDeltas();

        // Distinct categories: AGRICULTURAL, COMMERCIAL (only in A), FOREST (only in B)
        assertThat(luDeltas).hasSize(3);

        DistributionDelta ag = luDeltas.stream().filter(d -> d.category().equals("AGRICULTURAL")).findFirst().orElseThrow();
        assertThat(ag.leftParcelCount()).isEqualTo(15L);
        assertThat(ag.rightParcelCount()).isEqualTo(20L);
        assertThat(ag.parcelCountDelta()).isEqualTo(5L);
        assertThat(ag.areaSqmDelta()).isEqualByComparingTo("10000.00");

        DistributionDelta comm = luDeltas.stream().filter(d -> d.category().equals("COMMERCIAL")).findFirst().orElseThrow();
        assertThat(comm.leftParcelCount()).isEqualTo(5L);
        assertThat(comm.rightParcelCount()).isEqualTo(0L); // Missing in B treated as 0
        assertThat(comm.parcelCountDelta()).isEqualTo(-5L);
        assertThat(comm.areaSqmDelta()).isEqualByComparingTo("-10000.00");

        DistributionDelta forest = luDeltas.stream().filter(d -> d.category().equals("FOREST")).findFirst().orElseThrow();
        assertThat(forest.leftParcelCount()).isEqualTo(0L); // Missing in A treated as 0
        assertThat(forest.rightParcelCount()).isEqualTo(10L);
        assertThat(forest.parcelCountDelta()).isEqualTo(10L);
        assertThat(forest.areaSqmDelta()).isEqualByComparingTo("25000.00");
    }

    @Test
    @DisplayName("20. Ownership distribution comparison with deltas and percentage points")
    void compareScenarios_ownershipDistribution_handlesDeltas() {
        when(securityService.resolveCurrentUser(any())).thenReturn(Optional.of(user));
        when(scenarioRepository.findById(scenarioA.getId())).thenReturn(Optional.of(scenarioA));
        when(scenarioRepository.findById(scenarioB.getId())).thenReturn(Optional.of(scenarioB));
        when(securityService.canViewProject(project, user)).thenReturn(true);
        when(resultRepository.findFirstByScenarioIdOrderByExecutedAtDesc(scenarioA.getId())).thenReturn(Optional.of(resultA));
        when(resultRepository.findFirstByScenarioIdOrderByExecutedAtDesc(scenarioB.getId())).thenReturn(Optional.of(resultB));

        CompareScenariosRequest request = new CompareScenariosRequest(
                null,
                List.of(scenarioA.getId(), scenarioB.getId())
        );

        ScenarioComparisonResponse response = comparisonService.compareScenarios(request, null);
        List<DistributionDelta> ownDeltas = response.comparisons().get(0).ownershipDistributionDeltas();

        // Categories: COMMUNITY, GOVERNMENT, PRIVATE
        assertThat(ownDeltas).hasSize(3);

        DistributionDelta priv = ownDeltas.stream().filter(d -> d.category().equals("PRIVATE")).findFirst().orElseThrow();
        assertThat(priv.leftParcelCount()).isEqualTo(18L);
        assertThat(priv.rightParcelCount()).isEqualTo(25L);
        assertThat(priv.parcelCountDelta()).isEqualTo(7L);
        assertThat(priv.areaSqmDelta()).isEqualByComparingTo("15000.00"); // 60000 - 45000
    }

    @Test
    @DisplayName("22. Multi-scenario comparison: N scenarios yield N*(N-1)/2 pairs without ranking")
    void compareScenarios_multiScenario_producesAllPairsWithoutRanking() {
        PolicyScenario scenarioC = new PolicyScenario(project, user, "Scenario C", "scenario-c", "Desc C", ScenarioType.LAND_USE_CONVERSION);
        ReflectionTestUtils.setField(scenarioC, "id", UUID.randomUUID());
        ScenarioResult resultC = new ScenarioResult(scenarioC, user);
        ReflectionTestUtils.setField(resultC, "id", UUID.randomUUID());
        resultC.setExecutedAt(Instant.now());
        resultC.setTotalParcelsEvaluated(150L);
        resultC.setTotalParcelsAffected(45L);
        resultC.setTotalAreaAffectedSqm(new BigDecimal("90000.00"));

        when(securityService.resolveCurrentUser(any())).thenReturn(Optional.of(user));
        when(scenarioRepository.findById(scenarioA.getId())).thenReturn(Optional.of(scenarioA));
        when(scenarioRepository.findById(scenarioB.getId())).thenReturn(Optional.of(scenarioB));
        when(scenarioRepository.findById(scenarioC.getId())).thenReturn(Optional.of(scenarioC));
        when(securityService.canViewProject(project, user)).thenReturn(true);
        when(resultRepository.findFirstByScenarioIdOrderByExecutedAtDesc(scenarioA.getId())).thenReturn(Optional.of(resultA));
        when(resultRepository.findFirstByScenarioIdOrderByExecutedAtDesc(scenarioB.getId())).thenReturn(Optional.of(resultB));
        when(resultRepository.findFirstByScenarioIdOrderByExecutedAtDesc(scenarioC.getId())).thenReturn(Optional.of(resultC));

        CompareScenariosRequest request = new CompareScenariosRequest(
                null,
                List.of(scenarioA.getId(), scenarioB.getId(), scenarioC.getId())
        );

        ScenarioComparisonResponse response = comparisonService.compareScenarios(request, null);

        // 3 scenarios -> 3 pairs: (A vs B), (A vs C), (B vs C)
        assertThat(response.scenarios()).hasSize(3);
        assertThat(response.comparisons()).hasSize(3);

        PairwiseComparison pair0 = response.comparisons().get(0);
        assertThat(pair0.leftScenarioId()).isEqualTo(scenarioA.getId());
        assertThat(pair0.rightScenarioId()).isEqualTo(scenarioB.getId());

        PairwiseComparison pair1 = response.comparisons().get(1);
        assertThat(pair1.leftScenarioId()).isEqualTo(scenarioA.getId());
        assertThat(pair1.rightScenarioId()).isEqualTo(scenarioC.getId());

        PairwiseComparison pair2 = response.comparisons().get(2);
        assertThat(pair2.leftScenarioId()).isEqualTo(scenarioB.getId());
        assertThat(pair2.rightScenarioId()).isEqualTo(scenarioC.getId());
    }

    @Test
    @DisplayName("23. Duplicate scenario IDs rejected")
    void compareScenarios_duplicateScenarioIds_rejected() {
        CompareScenariosRequest request = new CompareScenariosRequest(
                null,
                List.of(scenarioA.getId(), scenarioA.getId())
        );

        assertThatThrownBy(() -> comparisonService.compareScenarios(request, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Duplicate scenario ID");
    }

    @Test
    @DisplayName("24. Too many scenarios rejected (> 10)")
    void compareScenarios_tooManyScenarios_rejected() {
        List<UUID> ids = new ArrayList<>();
        for (int i = 0; i < 11; i++) {
            ids.add(UUID.randomUUID());
        }
        CompareScenariosRequest request = new CompareScenariosRequest(null, ids);

        assertThatThrownBy(() -> comparisonService.compareScenarios(request, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at most 10 scenarios");
    }

    @Test
    @DisplayName("25. Empty or less than 2 scenarios rejected")
    void compareScenarios_emptyOrSingle_rejected() {
        CompareScenariosRequest emptyRequest = new CompareScenariosRequest(null, List.of());
        assertThatThrownBy(() -> comparisonService.compareScenarios(emptyRequest, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at least 2 scenarios");

        CompareScenariosRequest singleRequest = new CompareScenariosRequest(null, List.of(scenarioA.getId()));
        assertThatThrownBy(() -> comparisonService.compareScenarios(singleRequest, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at least 2 scenarios");
    }

    @Test
    @DisplayName("26. Nonexistent scenario rejected with 404 ResourceNotFoundException")
    void compareScenarios_nonexistentScenario_throwsNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(scenarioRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        CompareScenariosRequest request = new CompareScenariosRequest(null, List.of(nonExistentId, scenarioB.getId()));

        assertThatThrownBy(() -> comparisonService.compareScenarios(request, null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Scenario not found");
    }

    @Test
    @DisplayName("27. Unauthorized scenario rejected with ResourceNotFoundException to prevent leakage")
    void compareScenarios_unauthorizedScenario_throwsNotFound() {
        when(securityService.resolveCurrentUser(any())).thenReturn(Optional.of(user));
        when(scenarioRepository.findById(scenarioA.getId())).thenReturn(Optional.of(scenarioA));
        when(securityService.canViewProject(project, user)).thenReturn(false);

        CompareScenariosRequest request = new CompareScenariosRequest(null, List.of(scenarioA.getId(), scenarioB.getId()));

        assertThatThrownBy(() -> comparisonService.compareScenarios(request, null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Scenario not found");
    }

    @Test
    @DisplayName("28. Incomplete / no-result scenario rejected")
    void compareScenarios_noResultScenario_throwsIllegalState() {
        when(securityService.resolveCurrentUser(any())).thenReturn(Optional.of(user));
        when(scenarioRepository.findById(scenarioA.getId())).thenReturn(Optional.of(scenarioA));
        when(securityService.canViewProject(project, user)).thenReturn(true);
        when(resultRepository.findFirstByScenarioIdOrderByExecutedAtDesc(scenarioA.getId())).thenReturn(Optional.empty());

        CompareScenariosRequest request = new CompareScenariosRequest(null, List.of(scenarioA.getId(), scenarioB.getId()));

        assertThatThrownBy(() -> comparisonService.compareScenarios(request, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("has no completed simulation results");
    }

    @Test
    @DisplayName("29. Cross-scenario result ID rejected")
    void compareScenarios_crossScenarioResultId_throwsIllegalArgument() {
        when(securityService.resolveCurrentUser(any())).thenReturn(Optional.of(user));
        when(scenarioRepository.findById(scenarioA.getId())).thenReturn(Optional.of(scenarioA));
        when(securityService.canViewProject(project, user)).thenReturn(true);
        // User attempts to associate resultB with scenarioA
        when(resultRepository.findById(resultB.getId())).thenReturn(Optional.of(resultB));

        CompareScenariosRequest request = new CompareScenariosRequest(
                List.of(
                        new ScenarioResultTarget(scenarioA.getId(), resultB.getId()),
                        new ScenarioResultTarget(scenarioB.getId(), null)
                ),
                null
        );

        assertThatThrownBy(() -> comparisonService.compareScenarios(request, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not belong to scenario");
    }

    @Test
    @DisplayName("30. Rerun snapshots: specific historical result compares accurately")
    void compareScenarios_rerunSnapshots_comparesSpecificResult() {
        ScenarioResult olderResultA = new ScenarioResult(scenarioA, user);
        ReflectionTestUtils.setField(olderResultA, "id", UUID.randomUUID());
        olderResultA.setExecutedAt(Instant.now().minusSeconds(86400));
        olderResultA.setTotalParcelsEvaluated(80L);
        olderResultA.setTotalParcelsAffected(10L);
        olderResultA.setTotalAreaAffectedSqm(new BigDecimal("25000.00"));

        when(securityService.resolveCurrentUser(any())).thenReturn(Optional.of(user));
        when(scenarioRepository.findById(scenarioA.getId())).thenReturn(Optional.of(scenarioA));
        when(scenarioRepository.findById(scenarioB.getId())).thenReturn(Optional.of(scenarioB));
        when(securityService.canViewProject(project, user)).thenReturn(true);
        when(resultRepository.findById(olderResultA.getId())).thenReturn(Optional.of(olderResultA));
        when(resultRepository.findFirstByScenarioIdOrderByExecutedAtDesc(scenarioB.getId())).thenReturn(Optional.of(resultB));

        CompareScenariosRequest request = new CompareScenariosRequest(
                List.of(
                        new ScenarioResultTarget(scenarioA.getId(), olderResultA.getId()),
                        new ScenarioResultTarget(scenarioB.getId(), null)
                ),
                null
        );

        ScenarioComparisonResponse response = comparisonService.compareScenarios(request, null);

        assertThat(response.comparisons()).hasSize(1);
        PairwiseComparison pair = response.comparisons().get(0);
        // Compares olderResultA (10 affected) with resultB (30 affected) -> delta = +20
        assertThat(pair.metricDeltas().totalParcelsAffected()).isEqualTo(20L);
        assertThat(response.scenarios().get(0).resultId()).isEqualTo(olderResultA.getId());
    }
}
