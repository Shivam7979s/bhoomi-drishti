package com.bhoomidrishti.policy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.entity.ProjectVisibility;
import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.entity.WorkspaceMember;
import com.bhoomidrishti.collaboration.entity.WorkspaceRole;
import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
import com.bhoomidrishti.collaboration.repository.ProjectRepository;
import com.bhoomidrishti.collaboration.repository.WorkspaceMemberRepository;
import com.bhoomidrishti.collaboration.repository.WorkspaceRepository;
import com.bhoomidrishti.common.PageResponse;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.policy.dto.CreatePolicyScenarioRequest;
import com.bhoomidrishti.policy.dto.PolicyScenarioResponse;
import com.bhoomidrishti.policy.dto.ScenarioParameterRequest;
import com.bhoomidrishti.policy.dto.UpdatePolicyScenarioRequest;
import com.bhoomidrishti.policy.entity.PolicyScenario;
import com.bhoomidrishti.policy.entity.ScenarioResult;
import com.bhoomidrishti.policy.entity.ScenarioStatus;
import com.bhoomidrishti.policy.entity.ScenarioType;
import com.bhoomidrishti.policy.repository.PolicyScenarioRepository;
import com.bhoomidrishti.policy.repository.ScenarioAffectedParcelRepository;
import com.bhoomidrishti.policy.repository.ScenarioParameterRepository;
import com.bhoomidrishti.policy.repository.ScenarioResultRepository;
import com.bhoomidrishti.policy.service.PolicyScenarioService;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

/**
 * Real database integration test for PolicyScenarioService:
 * Validates slug uniqueness, lifecycle state transitions, delete protections, and multi-tenant access.
 */
@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:5433/bhoomi_drishti",
        "spring.datasource.username=bhoomi",
        "spring.datasource.password=change_me",
        "spring.flyway.enabled=true"
})
@Transactional
class PolicyScenarioIntegrationTest {

    @Autowired
    private PolicyScenarioService scenarioService;

    @Autowired
    private PolicyScenarioRepository scenarioRepository;

    @Autowired
    private ScenarioParameterRepository parameterRepository;

    @Autowired
    private ScenarioResultRepository resultRepository;

    @Autowired
    private ScenarioAffectedParcelRepository affectedParcelRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;

    @Autowired
    private UserRepository userRepository;

    private User leadResearcher;
    private User externalUser;
    private Workspace workspace;
    private Project publicProject;
    private Project privateProject;
    private Authentication leadAuth;
    private Authentication externalAuth;

    @BeforeEach
    void setUp() {
        affectedParcelRepository.deleteAll();
        resultRepository.deleteAll();
        parameterRepository.deleteAll();
        scenarioRepository.deleteAll();

        leadResearcher = userRepository.save(User.registerLocal(
                "Lead Researcher", "lead.scenario." + UUID.randomUUID() + "@gov.in", "hash"
        ));
        leadAuth = new UsernamePasswordAuthenticationToken(
                leadResearcher, null, List.of(new SimpleGrantedAuthority("ROLE_RESEARCHER"))
        );

        externalUser = userRepository.save(User.registerLocal(
                "External Researcher", "ext.scenario." + UUID.randomUUID() + "@gov.in", "hash"
        ));
        externalAuth = new UsernamePasswordAuthenticationToken(
                externalUser, null, List.of(new SimpleGrantedAuthority("ROLE_RESEARCHER"))
        );

        workspace = workspaceRepository.save(new Workspace(
                "Scenario Test WS",
                "sc-ws-" + UUID.randomUUID().toString().substring(0, 8),
                "Desc",
                "MoHUA",
                WorkspaceVisibility.PUBLIC,
                leadResearcher
        ));

        workspaceMemberRepository.save(new WorkspaceMember(workspace, leadResearcher, WorkspaceRole.OWNER));

        publicProject = projectRepository.save(new Project(
                workspace,
                "Public Corridor Study",
                "pub-corridor-" + UUID.randomUUID().toString().substring(0, 8),
                "Public study",
                ProjectVisibility.PUBLIC,
                leadResearcher
        ));

        privateProject = projectRepository.save(new Project(
                workspace,
                "Private Zoning Plan",
                "priv-zoning-" + UUID.randomUUID().toString().substring(0, 8),
                "Confidential",
                ProjectVisibility.PRIVATE_TO_PROJECT_MEMBERS,
                leadResearcher
        ));
    }

    @Test
    @DisplayName("Create scenario with parameters and verify slug generation")
    void testCreateScenarioSuccess() {
        ScenarioParameterRequest paramReq = new ScenarioParameterRequest(
                "Madhya Pradesh", "Indore", "Rau", "Rangwasa", null,
                LandUseType.AGRICULTURAL, LandUseType.COMMERCIAL,
                new BigDecimal("50.00"), null, null, null, null
        );
        CreatePolicyScenarioRequest request = new CreatePolicyScenarioRequest(
                "Indore Bypass 50%", "indore-bypass-50", "Initial draft",
                ScenarioType.LAND_USE_CONVERSION, paramReq
        );

        PolicyScenarioResponse response = scenarioService.createScenario(publicProject.getId(), request, leadAuth);

        assertThat(response).isNotNull();
        assertThat(response.id()).isNotNull();
        assertThat(response.slug()).isEqualTo("indore-bypass-50");
        assertThat(response.status()).isEqualTo(ScenarioStatus.DRAFT);
        assertThat(response.parameters()).isNotNull();
        assertThat(response.parameters().conversionPercentage()).isEqualByComparingTo("50.00");
    }

    @Test
    @DisplayName("Project-scoped slug collision automatically appends incrementing counter")
    void testProjectScopedSlugCollision() {
        CreatePolicyScenarioRequest req1 = new CreatePolicyScenarioRequest(
                "Zoning Study", "zoning-study", "First", ScenarioType.LAND_USE_CONVERSION, null
        );
        CreatePolicyScenarioRequest req2 = new CreatePolicyScenarioRequest(
                "Zoning Study", "zoning-study", "Second", ScenarioType.LAND_USE_CONVERSION, null
        );

        PolicyScenarioResponse resp1 = scenarioService.createScenario(publicProject.getId(), req1, leadAuth);
        PolicyScenarioResponse resp2 = scenarioService.createScenario(publicProject.getId(), req2, leadAuth);

        assertThat(resp1.slug()).isEqualTo("zoning-study");
        assertThat(resp2.slug()).isEqualTo("zoning-study-1");
    }

    @Test
    @DisplayName("Unauthorized user cannot create scenario under private project")
    void testUnauthorizedCreateScenarioRejected() {
        CreatePolicyScenarioRequest request = new CreatePolicyScenarioRequest(
                "Unauthorized Scenario", "unauth-sc", "Desc", ScenarioType.LAND_USE_CONVERSION, null
        );

        assertThatThrownBy(() -> scenarioService.createScenario(privateProject.getId(), request, externalAuth))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("Anonymous user can list scenarios of public project but receives 404 for private project")
    void testPublicVsPrivateProjectScenarioListing() {
        CreatePolicyScenarioRequest req = new CreatePolicyScenarioRequest(
                "Public Scenario", "pub-sc", "Desc", ScenarioType.LAND_USE_CONVERSION, null
        );
        scenarioService.createScenario(publicProject.getId(), req, leadAuth);

        // Anonymous user listing public project: succeeds
        PageResponse<PolicyScenarioResponse> publicList = scenarioService.listScenarios(
                publicProject.getId(), PageRequest.of(0, 10), (Authentication) null
        );
        assertThat(publicList.content()).hasSize(1);

        // Anonymous user listing private project: throws 404 Not Found (no existence leakage)
        assertThatThrownBy(() -> scenarioService.listScenarios(
                privateProject.getId(), PageRequest.of(0, 10), (Authentication) null
        )).isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Project not found");
    }

    @Test
    @DisplayName("Modifying parameters on COMPLETED scenario resets status to DRAFT and retains results")
    void testParameterModificationOnCompletedScenarioResetsToDraft() {
        CreatePolicyScenarioRequest req = new CreatePolicyScenarioRequest(
                "Baseline Scenario", "baseline-sc", "Desc", ScenarioType.LAND_USE_CONVERSION, null
        );
        PolicyScenarioResponse created = scenarioService.createScenario(publicProject.getId(), req, leadAuth);

        // Manually mark scenario COMPLETED and seed a result snapshot
        PolicyScenario scenario = scenarioRepository.findById(created.id()).orElseThrow();
        scenario.setStatus(ScenarioStatus.COMPLETED);
        scenarioRepository.save(scenario);

        ScenarioResult result = new ScenarioResult(scenario, leadResearcher);
        result.setTotalParcelsEvaluated(100L);
        result.setTotalParcelsAffected(20L);
        resultRepository.save(result);

        // Update parameters
        ScenarioParameterRequest newParams = new ScenarioParameterRequest(
                "Madhya Pradesh", "Indore", null, null, null,
                null, null, new BigDecimal("75.00"), null, null, null, null
        );
        UpdatePolicyScenarioRequest updateReq = new UpdatePolicyScenarioRequest(null, null, null, newParams);

        PolicyScenarioResponse updated = scenarioService.updateScenario(scenario.getId(), updateReq, leadAuth);

        // Status reset to DRAFT
        assertThat(updated.status()).isEqualTo(ScenarioStatus.DRAFT);

        // Historical result still exists!
        assertThat(resultRepository.countByScenarioId(scenario.getId())).isEqualTo(1L);
    }

    @Test
    @DisplayName("Deleting completed scenario with results is rejected with 409 IllegalStateException")
    void testDeleteCompletedScenarioWithResultsRejected() {
        CreatePolicyScenarioRequest req = new CreatePolicyScenarioRequest(
                "Protected Scenario", "prot-sc", "Desc", ScenarioType.LAND_USE_CONVERSION, null
        );
        PolicyScenarioResponse created = scenarioService.createScenario(publicProject.getId(), req, leadAuth);

        PolicyScenario scenario = scenarioRepository.findById(created.id()).orElseThrow();
        scenario.setStatus(ScenarioStatus.COMPLETED);
        scenarioRepository.save(scenario);

        ScenarioResult result = new ScenarioResult(scenario, leadResearcher);
        resultRepository.save(result);

        assertThatThrownBy(() -> scenarioService.deleteScenario(scenario.getId(), leadAuth))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot delete a scenario with completed simulation results");
    }

    @Test
    @DisplayName("Deleting draft scenario without results succeeds")
    void testDeleteDraftScenarioSuccess() {
        CreatePolicyScenarioRequest req = new CreatePolicyScenarioRequest(
                "Draft Scenario", "draft-sc", "Desc", ScenarioType.LAND_USE_CONVERSION, null
        );
        PolicyScenarioResponse created = scenarioService.createScenario(publicProject.getId(), req, leadAuth);

        scenarioService.deleteScenario(created.id(), leadAuth);

        assertThat(scenarioRepository.findById(created.id())).isEmpty();
    }
}
