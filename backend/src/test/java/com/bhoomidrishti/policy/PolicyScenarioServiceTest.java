package com.bhoomidrishti.policy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
import com.bhoomidrishti.collaboration.repository.ProjectRepository;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.policy.dto.CreatePolicyScenarioRequest;
import com.bhoomidrishti.policy.dto.PolicyScenarioResponse;
import com.bhoomidrishti.policy.dto.ScenarioParameterRequest;
import com.bhoomidrishti.policy.dto.UpdatePolicyScenarioRequest;
import com.bhoomidrishti.policy.entity.PolicyScenario;
import com.bhoomidrishti.policy.entity.ScenarioParameter;
import com.bhoomidrishti.policy.entity.ScenarioStatus;
import com.bhoomidrishti.policy.entity.ScenarioType;
import com.bhoomidrishti.policy.repository.PolicyScenarioRepository;
import com.bhoomidrishti.policy.repository.ScenarioEvidenceRepository;
import com.bhoomidrishti.policy.repository.ScenarioParameterRepository;
import com.bhoomidrishti.policy.repository.ScenarioResultRepository;
import com.bhoomidrishti.policy.service.PolicyScenarioService;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class PolicyScenarioServiceTest {

    @Mock
    private PolicyScenarioRepository scenarioRepository;
    @Mock
    private ScenarioParameterRepository parameterRepository;
    @Mock
    private ScenarioResultRepository resultRepository;
    @Mock
    private ScenarioEvidenceRepository evidenceRepository;
    @Mock
    private ProjectRepository projectRepository;

    private PolicyScenarioService scenarioService;

    private User researcher;
    private Project project;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        scenarioService = new PolicyScenarioService(
                scenarioRepository,
                parameterRepository,
                resultRepository,
                evidenceRepository,
                projectRepository
        );

        researcher = User.registerLocal("Dr. Verma", "verma@gov.in", "hash");
        ReflectionTestUtils.setField(researcher, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(researcher, "role", Role.RESEARCHER);

        Workspace ws = new Workspace("Planning Lab", "planning-lab", "Desc", "MoHUA", WorkspaceVisibility.PRIVATE, researcher);
        ReflectionTestUtils.setField(ws, "id", UUID.randomUUID());

        projectId = UUID.randomUUID();
        project = new Project(ws, "Urban Fringe Study", "urban-fringe-study", "Desc", null, researcher);
        ReflectionTestUtils.setField(project, "id", projectId);
    }

    @Test
    void createScenario_successWithParameters() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(scenarioRepository.existsByProjectIdAndSlug(any(), any())).thenReturn(false);

        ScenarioParameterRequest paramReq = new ScenarioParameterRequest(
                "Madhya Pradesh", "Indore", "Rau", null, null,
                LandUseType.AGRICULTURAL, LandUseType.RESIDENTIAL,
                new BigDecimal("25.00"), null, null, new BigDecimal("500.00"), null
        );

        CreatePolicyScenarioRequest request = new CreatePolicyScenarioRequest(
                "Indore Urban Expansion 2030", "indore-urban-expansion-2030",
                "Simulating conversion of rural agricultural parcels along Rau bypass",
                ScenarioType.LAND_USE_CONVERSION,
                paramReq
        );

        when(scenarioRepository.save(any(PolicyScenario.class))).thenAnswer(inv -> {
            PolicyScenario s = inv.getArgument(0);
            ReflectionTestUtils.setField(s, "id", UUID.randomUUID());
            return s;
        });

        when(parameterRepository.save(any(ScenarioParameter.class))).thenAnswer(inv -> {
            ScenarioParameter p = inv.getArgument(0);
            ReflectionTestUtils.setField(p, "id", UUID.randomUUID());
            return p;
        });

        PolicyScenarioResponse response = scenarioService.createScenario(projectId, request, researcher);

        assertThat(response).isNotNull();
        assertThat(response.name()).isEqualTo("Indore Urban Expansion 2030");
        assertThat(response.status()).isEqualTo(ScenarioStatus.DRAFT);
        assertThat(response.scenarioType()).isEqualTo(ScenarioType.LAND_USE_CONVERSION);
        assertThat(response.parameters()).isNotNull();
        assertThat(response.parameters().conversionPercentage()).isEqualTo(new BigDecimal("25.00"));
        assertThat(response.parameters().bufferDistanceMeters()).isEqualTo(new BigDecimal("500.00"));

        verify(scenarioRepository).save(any(PolicyScenario.class));
        verify(parameterRepository).save(any(ScenarioParameter.class));
    }

    @Test
    void createScenario_rejectConversionPercentageGreaterThan100() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        ScenarioParameterRequest paramReq = new ScenarioParameterRequest(
                "Delhi", "North", null, null, null,
                LandUseType.AGRICULTURAL, LandUseType.COMMERCIAL,
                new BigDecimal("105.00"), null, null, null, null
        );

        CreatePolicyScenarioRequest request = new CreatePolicyScenarioRequest(
                "Invalid Conversion", "invalid-conversion", "Desc",
                ScenarioType.LAND_USE_CONVERSION, paramReq
        );

        assertThatThrownBy(() -> scenarioService.createScenario(projectId, request, researcher))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Conversion percentage must be between 0 and 100");
    }

    @Test
    void createScenario_rejectNegativeConversionPercentage() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        ScenarioParameterRequest paramReq = new ScenarioParameterRequest(
                "Delhi", "North", null, null, null,
                LandUseType.AGRICULTURAL, LandUseType.COMMERCIAL,
                new BigDecimal("-5.00"), null, null, null, null
        );

        CreatePolicyScenarioRequest request = new CreatePolicyScenarioRequest(
                "Invalid Conversion", "invalid-conversion", "Desc",
                ScenarioType.LAND_USE_CONVERSION, paramReq
        );

        assertThatThrownBy(() -> scenarioService.createScenario(projectId, request, researcher))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Conversion percentage must be between 0 and 100");
    }

    @Test
    void createScenario_rejectNegativeBufferDistance() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        ScenarioParameterRequest paramReq = new ScenarioParameterRequest(
                "Delhi", "North", null, null, null,
                null, null, null, null, null, new BigDecimal("-100.00"), null
        );

        CreatePolicyScenarioRequest request = new CreatePolicyScenarioRequest(
                "Invalid Buffer", "invalid-buffer", "Desc",
                ScenarioType.CORRIDOR_BUFFER_INTERVENTION, paramReq
        );

        assertThatThrownBy(() -> scenarioService.createScenario(projectId, request, researcher))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Buffer distance cannot be negative");
    }

    @Test
    void createScenario_rejectNegativeMaxOwnershipArea() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        ScenarioParameterRequest paramReq = new ScenarioParameterRequest(
                "Delhi", "North", null, null, null,
                null, null, null, new BigDecimal("-50.00"), null, null, null
        );

        CreatePolicyScenarioRequest request = new CreatePolicyScenarioRequest(
                "Invalid Ceiling", "invalid-ceiling", "Desc",
                ScenarioType.LAND_CEILING_REDISTRIBUTION, paramReq
        );

        assertThatThrownBy(() -> scenarioService.createScenario(projectId, request, researcher))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Max ownership area cannot be negative");
    }

    @Test
    void archiveScenario_setsStatusToArchived() {
        UUID scenarioId = UUID.randomUUID();
        PolicyScenario scenario = new PolicyScenario(
                project, researcher, "Test Scenario", "test-scenario", "Desc", ScenarioType.DISPUTE_RISK_ASSESSMENT
        );
        ReflectionTestUtils.setField(scenario, "id", scenarioId);

        when(scenarioRepository.findById(scenarioId)).thenReturn(Optional.of(scenario));

        scenarioService.archiveScenario(scenarioId);

        assertThat(scenario.getStatus()).isEqualTo(ScenarioStatus.ARCHIVED);
        verify(scenarioRepository).save(scenario);
    }

    @Test
    void updateScenario_rejectsModifyingArchivedScenario() {
        UUID scenarioId = UUID.randomUUID();
        PolicyScenario scenario = new PolicyScenario(
                project, researcher, "Archived Scenario", "archived-scenario", "Desc", ScenarioType.LAND_USE_CONVERSION
        );
        ReflectionTestUtils.setField(scenario, "id", scenarioId);
        scenario.setStatus(ScenarioStatus.ARCHIVED);

        when(scenarioRepository.findById(scenarioId)).thenReturn(Optional.of(scenario));

        UpdatePolicyScenarioRequest updateReq = new UpdatePolicyScenarioRequest("New Name", null, null, null);

        assertThatThrownBy(() -> scenarioService.updateScenario(scenarioId, updateReq))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot modify an archived scenario");
    }

    @Test
    void createScenario_slugCollisionInSameProject_appendsIncrementingCounter() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(scenarioRepository.existsByProjectIdAndSlug(projectId, "corridor-expansion")).thenReturn(true);
        when(scenarioRepository.existsByProjectIdAndSlug(projectId, "corridor-expansion-1")).thenReturn(false);

        CreatePolicyScenarioRequest request = new CreatePolicyScenarioRequest(
                "Corridor Expansion", "corridor-expansion", "Desc",
                ScenarioType.CORRIDOR_BUFFER_INTERVENTION, null
        );

        when(scenarioRepository.save(any(PolicyScenario.class))).thenAnswer(inv -> {
            PolicyScenario s = inv.getArgument(0);
            ReflectionTestUtils.setField(s, "id", UUID.randomUUID());
            return s;
        });

        PolicyScenarioResponse response = scenarioService.createScenario(projectId, request, researcher);

        assertThat(response).isNotNull();
        assertThat(response.slug()).isEqualTo("corridor-expansion-1");
        verify(scenarioRepository).save(any(PolicyScenario.class));
    }

    @Test
    void createScenario_projectScopedSlugUniqueness_allowsSameSlugWhenNotUsedInCurrentProject() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        // In this project, slug is not taken (even if taken in another project)
        when(scenarioRepository.existsByProjectIdAndSlug(projectId, "corridor-expansion")).thenReturn(false);

        CreatePolicyScenarioRequest request = new CreatePolicyScenarioRequest(
                "Corridor Expansion", "corridor-expansion", "Desc",
                ScenarioType.CORRIDOR_BUFFER_INTERVENTION, null
        );

        when(scenarioRepository.save(any(PolicyScenario.class))).thenAnswer(inv -> {
            PolicyScenario s = inv.getArgument(0);
            ReflectionTestUtils.setField(s, "id", UUID.randomUUID());
            return s;
        });

        PolicyScenarioResponse response = scenarioService.createScenario(projectId, request, researcher);

        assertThat(response).isNotNull();
        assertThat(response.slug()).isEqualTo("corridor-expansion");
        verify(scenarioRepository).existsByProjectIdAndSlug(projectId, "corridor-expansion");
    }
}
