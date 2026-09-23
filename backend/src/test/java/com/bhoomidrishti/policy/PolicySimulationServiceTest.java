package com.bhoomidrishti.policy;

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
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
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
import com.bhoomidrishti.policy.repository.PolicySimulationQueryRepository.CandidateParcel;
import com.bhoomidrishti.policy.repository.PolicySimulationQueryRepository.SpatialBoundingBox;
import com.bhoomidrishti.policy.repository.ScenarioParameterRepository;
import com.bhoomidrishti.policy.repository.ScenarioResultRepository;
import com.bhoomidrishti.policy.service.PolicySimulationService;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class PolicySimulationServiceTest {

    @Mock
    private PolicyScenarioRepository scenarioRepository;
    @Mock
    private ScenarioParameterRepository parameterRepository;
    @Mock
    private ScenarioResultRepository resultRepository;
    @Mock
    private PolicySimulationQueryRepository simulationQueryRepository;
    @Mock
    private CollaborationSecurityService collaborationSecurityService;
    @Mock
    private UserRepository userRepository;

    private PolicySimulationService simulationService;

    private User researcher;
    private Project project;
    private PolicyScenario scenario;
    private ScenarioParameter parameter;
    private final GeometryFactory geomFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @BeforeEach
    void setUp() {
        simulationService = new PolicySimulationService(
                scenarioRepository,
                parameterRepository,
                resultRepository,
                simulationQueryRepository,
                collaborationSecurityService,
                userRepository,
                new ObjectMapper()
        );

        researcher = User.registerLocal("Dr. Verma", "verma@gov.in", "hash");
        ReflectionTestUtils.setField(researcher, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(researcher, "role", Role.RESEARCHER);

        Workspace workspace = new Workspace("Policy WS", "policy-ws", "Desc", "MoHUA", WorkspaceVisibility.PRIVATE, researcher);
        ReflectionTestUtils.setField(workspace, "id", UUID.randomUUID());

        project = new Project(workspace, "Indore Master Plan", "indore-mp", "Desc", null, researcher);
        ReflectionTestUtils.setField(project, "id", UUID.randomUUID());

        scenario = new PolicyScenario(project, researcher, "Indore Bypass Conversion", "indore-bypass", "Desc", ScenarioType.LAND_USE_CONVERSION);
        scenario.setId(UUID.randomUUID());

        parameter = new ScenarioParameter(scenario);
        parameter.setId(UUID.randomUUID());
        parameter.setSourceLandUse(LandUseType.AGRICULTURAL);
        parameter.setTargetLandUse(LandUseType.RESIDENTIAL);
        parameter.setConversionPercentage(new BigDecimal("20.00"));
    }

    @Test
    @DisplayName("executeScenario: null executedBy throws AccessDeniedException")
    void executeScenario_NullUser_ThrowsAccessDenied() {
        assertThatThrownBy(() -> simulationService.executeScenario(scenario.getId(), (User) null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Authentication required");
    }

    @Test
    @DisplayName("executeScenario: unknown user UUID throws ResourceNotFoundException")
    void executeScenario_UnknownUserUUID_ThrowsNotFound() {
        UUID unknownId = UUID.randomUUID();
        when(userRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> simulationService.executeScenario(scenario.getId(), unknownId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    @DisplayName("executeScenario: non-existent scenario throws ResourceNotFoundException")
    void executeScenario_NonExistentScenario_ThrowsNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(scenarioRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> simulationService.executeScenario(nonExistentId, researcher))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Scenario not found");
    }

    @Test
    @DisplayName("executeScenario: project access check fails throws AccessDeniedException")
    void executeScenario_UnauthorizedUser_ThrowsAccessDenied() {
        when(scenarioRepository.findById(scenario.getId())).thenReturn(Optional.of(scenario));
        doThrow(new AccessDeniedException("Access denied")).when(collaborationSecurityService)
                .checkCanContributeToProject(project, researcher);

        assertThatThrownBy(() -> simulationService.executeScenario(scenario.getId(), researcher))
                .isInstanceOf(AccessDeniedException.class);

        verify(scenarioRepository, never()).save(any());
        verify(resultRepository, never()).save(any());
    }

    @Test
    @DisplayName("executeScenario: ARCHIVED scenario cannot execute")
    void executeScenario_ArchivedScenario_ThrowsIllegalState() {
        scenario.setStatus(ScenarioStatus.ARCHIVED);
        when(scenarioRepository.findById(scenario.getId())).thenReturn(Optional.of(scenario));

        assertThatThrownBy(() -> simulationService.executeScenario(scenario.getId(), researcher))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot execute an archived scenario");
    }

    @Test
    @DisplayName("executeScenario: missing ScenarioParameter throws IllegalStateException")
    void executeScenario_MissingParameters_ThrowsIllegalState() {
        when(scenarioRepository.findById(scenario.getId())).thenReturn(Optional.of(scenario));
        when(parameterRepository.findByScenarioId(scenario.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> simulationService.executeScenario(scenario.getId(), researcher))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Scenario has no parameters configured");
    }

    @Test
    @DisplayName("executeScenario: LAND_USE_CONVERSION with same source and target land use throws IllegalArgumentException")
    void executeScenario_SameSourceAndTargetLandUse_ThrowsIllegalArgument() {
        parameter.setTargetLandUse(LandUseType.AGRICULTURAL);
        when(scenarioRepository.findById(scenario.getId())).thenReturn(Optional.of(scenario));
        when(parameterRepository.findByScenarioId(scenario.getId())).thenReturn(Optional.of(parameter));

        assertThatThrownBy(() -> simulationService.executeScenario(scenario.getId(), researcher))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Target land use must differ from source land use");
    }

    @Test
    @DisplayName("executeScenario: LAND_USE_CONVERSION with invalid conversion percentage throws IllegalArgumentException")
    void executeScenario_InvalidConversionPercentage_ThrowsIllegalArgument() {
        parameter.setConversionPercentage(new BigDecimal("120.00"));
        when(scenarioRepository.findById(scenario.getId())).thenReturn(Optional.of(scenario));
        when(parameterRepository.findByScenarioId(scenario.getId())).thenReturn(Optional.of(parameter));

        assertThatThrownBy(() -> simulationService.executeScenario(scenario.getId(), researcher))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Conversion percentage must be between 0 and 100");
    }

    @Test
    @DisplayName("executeScenario: LAND_CEILING_REDISTRIBUTION without maxOwnershipArea throws IllegalArgumentException")
    void executeScenario_LandCeiling_MissingMaxArea_ThrowsIllegalArgument() {
        scenario.setScenarioType(ScenarioType.LAND_CEILING_REDISTRIBUTION);
        parameter.setMaxOwnershipArea(null);
        when(scenarioRepository.findById(scenario.getId())).thenReturn(Optional.of(scenario));
        when(parameterRepository.findByScenarioId(scenario.getId())).thenReturn(Optional.of(parameter));

        assertThatThrownBy(() -> simulationService.executeScenario(scenario.getId(), researcher))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Max ownership area is required");
    }

    @Test
    @DisplayName("executeScenario: CORRIDOR_BUFFER_INTERVENTION without geometry throws IllegalArgumentException")
    void executeScenario_CorridorBuffer_MissingGeometry_ThrowsIllegalArgument() {
        scenario.setScenarioType(ScenarioType.CORRIDOR_BUFFER_INTERVENTION);
        parameter.setInterventionGeometry(null);
        parameter.setBufferDistanceMeters(new BigDecimal("100.00"));
        when(scenarioRepository.findById(scenario.getId())).thenReturn(Optional.of(scenario));
        when(parameterRepository.findByScenarioId(scenario.getId())).thenReturn(Optional.of(parameter));

        assertThatThrownBy(() -> simulationService.executeScenario(scenario.getId(), researcher))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Intervention geometry is required");
    }

    @Test
    @DisplayName("executeScenario: CORRIDOR_BUFFER_INTERVENTION with negative buffer distance throws IllegalArgumentException")
    void executeScenario_CorridorBuffer_NegativeBuffer_ThrowsIllegalArgument() {
        scenario.setScenarioType(ScenarioType.CORRIDOR_BUFFER_INTERVENTION);
        parameter.setInterventionGeometry(geomFactory.createPoint(new Coordinate(77.41, 23.25)));
        parameter.setBufferDistanceMeters(new BigDecimal("-50.00"));
        when(scenarioRepository.findById(scenario.getId())).thenReturn(Optional.of(scenario));
        when(parameterRepository.findByScenarioId(scenario.getId())).thenReturn(Optional.of(parameter));

        assertThatThrownBy(() -> simulationService.executeScenario(scenario.getId(), researcher))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Buffer distance cannot be negative");
    }

    @Test
    @DisplayName("executeScenario: empty candidate set returns valid zero metrics and COMPLETED status")
    void executeScenario_EmptyCandidateSet_ReturnsZeroMetricsAndCompleted() {
        when(scenarioRepository.findById(scenario.getId())).thenReturn(Optional.of(scenario));
        when(parameterRepository.findByScenarioId(scenario.getId())).thenReturn(Optional.of(parameter));
        when(simulationQueryRepository.findCandidates(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of());

        when(resultRepository.saveAndFlush(any(ScenarioResult.class))).thenAnswer(invocation -> {
            ScenarioResult r = invocation.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        ScenarioResultResponse response = simulationService.executeScenario(scenario.getId(), researcher);

        assertThat(response).isNotNull();
        assertThat(response.totalParcelsEvaluated()).isEqualTo(0L);
        assertThat(response.totalParcelsAffected()).isEqualTo(0L);
        assertThat(response.totalAreaAffectedSqm()).isEqualByComparingTo("0.00");
        assertThat(response.baselineAreaSqm()).isEqualByComparingTo("0.00");
        assertThat(scenario.getStatus()).isEqualTo(ScenarioStatus.COMPLETED);
        verify(simulationQueryRepository, never()).batchInsertAffectedParcels(any());
    }

    @Test
    @DisplayName("executeScenario: LAND_USE_CONVERSION calculates deterministic affected subset and metrics")
    void executeScenario_LandUseConversion_CalculatesDeterministicMetrics() {
        when(scenarioRepository.findById(scenario.getId())).thenReturn(Optional.of(scenario));
        when(parameterRepository.findByScenarioId(scenario.getId())).thenReturn(Optional.of(parameter));

        // 5 candidates of 10,000 sqm each = 50,000 sqm baseline
        // 20% conversion => floor(5 * 20 / 100) = 1 affected parcel
        List<CandidateParcel> candidates = List.of(
                new CandidateParcel(UUID.randomUUID(), "P-01", new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE),
                new CandidateParcel(UUID.randomUUID(), "P-02", new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE),
                new CandidateParcel(UUID.randomUUID(), "P-03", new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.DISPUTED),
                new CandidateParcel(UUID.randomUUID(), "P-04", new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.COMMUNITY, LandRecordStatus.ACTIVE),
                new CandidateParcel(UUID.randomUUID(), "P-05", new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.GOVERNMENT, LandRecordStatus.ACTIVE)
        );

        when(simulationQueryRepository.findCandidates(any(), any(), any(), any(), eq(LandUseType.AGRICULTURAL), any(), any(), any(), any()))
                .thenReturn(candidates);
        when(simulationQueryRepository.computeBoundingBox(any()))
                .thenReturn(new SpatialBoundingBox(75.8, 22.7, 75.9, 22.8));

        when(resultRepository.saveAndFlush(any(ScenarioResult.class))).thenAnswer(invocation -> {
            ScenarioResult r = invocation.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        ScenarioResultResponse response = simulationService.executeScenario(scenario.getId(), researcher);

        assertThat(response.totalParcelsEvaluated()).isEqualTo(5L);
        assertThat(response.totalParcelsAffected()).isEqualTo(1L);
        assertThat(response.totalAreaAffectedSqm()).isEqualByComparingTo("10000.00");
        assertThat(response.baselineAreaSqm()).isEqualByComparingTo("50000.00");
        assertThat(response.disputedParcelsCount()).isEqualTo(1L);
        assertThat(response.disputedAreaSqm()).isEqualByComparingTo("10000.00");
        assertThat(response.landUseDistributionJson()).contains("RESIDENTIAL").contains("AGRICULTURAL");
        assertThat(response.ownershipDistributionJson()).contains("INDIVIDUAL").contains("COMMUNITY");
        assertThat(scenario.getStatus()).isEqualTo(ScenarioStatus.COMPLETED);

        // Verify affected parcel snapshot inserted
        ArgumentCaptor<List<PolicySimulationQueryRepository.AffectedParcelRecord>> captor = ArgumentCaptor.forClass(List.class);
        verify(simulationQueryRepository).batchInsertAffectedParcels(captor.capture());
        assertThat(captor.getValue()).hasSize(1);
        assertThat(captor.getValue().get(0).baselineLandUse()).isEqualTo(LandUseType.AGRICULTURAL);
        assertThat(captor.getValue().get(0).simulatedLandUse()).isEqualTo(LandUseType.RESIDENTIAL);
        assertThat(captor.getValue().get(0).landRecordId()).isEqualTo(candidates.get(0).id());
    }

    @Test
    @DisplayName("executeScenario: LAND_CEILING_REDISTRIBUTION identifies parcels above threshold")
    void executeScenario_LandCeiling_IdentifiesExceedingParcels() {
        scenario.setScenarioType(ScenarioType.LAND_CEILING_REDISTRIBUTION);
        parameter.setMaxOwnershipArea(new BigDecimal("40000.00"));
        parameter.setSourceLandUse(null);

        when(scenarioRepository.findById(scenario.getId())).thenReturn(Optional.of(scenario));
        when(parameterRepository.findByScenarioId(scenario.getId())).thenReturn(Optional.of(parameter));

        List<CandidateParcel> candidates = List.of(
                new CandidateParcel(UUID.randomUUID(), "P-01", new BigDecimal("35000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE),
                new CandidateParcel(UUID.randomUUID(), "P-02", new BigDecimal("55000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE),
                new CandidateParcel(UUID.randomUUID(), "P-03", new BigDecimal("60000.00"), LandUseType.COMMERCIAL, OwnershipType.COMMUNITY, LandRecordStatus.ACTIVE)
        );

        when(simulationQueryRepository.findCandidates(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(candidates);

        when(resultRepository.saveAndFlush(any(ScenarioResult.class))).thenAnswer(invocation -> {
            ScenarioResult r = invocation.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        ScenarioResultResponse response = simulationService.executeScenario(scenario.getId(), researcher);

        // 2 parcels exceed 40,000 sqm (P-02 with 55k, P-03 with 60k = 115,000 sqm)
        assertThat(response.totalParcelsEvaluated()).isEqualTo(3L);
        assertThat(response.totalParcelsAffected()).isEqualTo(2L);
        assertThat(response.totalAreaAffectedSqm()).isEqualByComparingTo("115000.00");
        assertThat(response.baselineAreaSqm()).isEqualByComparingTo("150000.00");
    }

    @Test
    @DisplayName("executeScenario: DISPUTE_RISK_ASSESSMENT counts existing disputed records")
    void executeScenario_DisputeRisk_CalculatesDisputeExposure() {
        scenario.setScenarioType(ScenarioType.DISPUTE_RISK_ASSESSMENT);
        parameter.setSourceLandUse(null);

        when(scenarioRepository.findById(scenario.getId())).thenReturn(Optional.of(scenario));
        when(parameterRepository.findByScenarioId(scenario.getId())).thenReturn(Optional.of(parameter));

        List<CandidateParcel> candidates = List.of(
                new CandidateParcel(UUID.randomUUID(), "P-01", new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE),
                new CandidateParcel(UUID.randomUUID(), "P-02", new BigDecimal("20000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.DISPUTED),
                new CandidateParcel(UUID.randomUUID(), "P-03", new BigDecimal("30000.00"), LandUseType.RESIDENTIAL, OwnershipType.INDIVIDUAL, LandRecordStatus.DISPUTED)
        );

        when(simulationQueryRepository.findCandidates(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(candidates);

        when(resultRepository.saveAndFlush(any(ScenarioResult.class))).thenAnswer(invocation -> {
            ScenarioResult r = invocation.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        ScenarioResultResponse response = simulationService.executeScenario(scenario.getId(), researcher);

        assertThat(response.totalParcelsEvaluated()).isEqualTo(3L);
        assertThat(response.disputedParcelsCount()).isEqualTo(2L);
        assertThat(response.disputedAreaSqm()).isEqualByComparingTo("50000.00");
        assertThat(response.spatialSummaryJson()).contains("EXISTING_DISPUTED_RECORD_EXPOSURE");
    }
}
