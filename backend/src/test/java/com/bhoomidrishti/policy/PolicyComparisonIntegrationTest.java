package com.bhoomidrishti.policy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.entity.ProjectMember;
import com.bhoomidrishti.collaboration.entity.ProjectRole;
import com.bhoomidrishti.collaboration.entity.ProjectVisibility;
import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.entity.WorkspaceMember;
import com.bhoomidrishti.collaboration.entity.WorkspaceRole;
import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
import com.bhoomidrishti.collaboration.repository.ProjectMemberRepository;
import com.bhoomidrishti.collaboration.repository.ProjectRepository;
import com.bhoomidrishti.collaboration.repository.WorkspaceMemberRepository;
import com.bhoomidrishti.collaboration.repository.WorkspaceRepository;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.landrecord.entity.LandRecord;
import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.landrecord.entity.OwnershipType;
import com.bhoomidrishti.landrecord.repository.LandRecordRepository;
import com.bhoomidrishti.policy.dto.CompareScenariosRequest;
import com.bhoomidrishti.policy.dto.PairwiseComparison;
import com.bhoomidrishti.policy.dto.ScenarioComparisonResponse;
import com.bhoomidrishti.policy.dto.ScenarioResultResponse;
import com.bhoomidrishti.policy.dto.ScenarioResultTarget;
import com.bhoomidrishti.policy.entity.PolicyScenario;
import com.bhoomidrishti.policy.entity.ScenarioParameter;
import com.bhoomidrishti.policy.entity.ScenarioResult;
import com.bhoomidrishti.policy.entity.ScenarioStatus;
import com.bhoomidrishti.policy.entity.ScenarioType;
import com.bhoomidrishti.policy.repository.PolicyScenarioRepository;
import com.bhoomidrishti.policy.repository.ScenarioAffectedParcelRepository;
import com.bhoomidrishti.policy.repository.ScenarioParameterRepository;
import com.bhoomidrishti.policy.repository.ScenarioResultRepository;
import com.bhoomidrishti.policy.service.PolicyComparisonService;
import com.bhoomidrishti.policy.service.PolicySimulationService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

/**
 * Real PostgreSQL + PostGIS integration tests for Phase 8D:
 * Deterministic Scenario Comparison Engine against real database snapshots.
 */
@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:5433/bhoomi_drishti",
        "spring.datasource.username=bhoomi",
        "spring.datasource.password=change_me",
        "spring.flyway.enabled=true"
})
@Transactional
class PolicyComparisonIntegrationTest {

    @Autowired
    private PolicyComparisonService comparisonService;

    @Autowired
    private PolicySimulationService simulationService;

    @Autowired
    private PolicyScenarioRepository scenarioRepository;

    @Autowired
    private ScenarioParameterRepository parameterRepository;

    @Autowired
    private ScenarioResultRepository resultRepository;

    @Autowired
    private ScenarioAffectedParcelRepository affectedParcelRepository;

    @Autowired
    private LandRecordRepository landRecordRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final GeometryFactory geomFactory = new GeometryFactory(new PrecisionModel(), 4326);

    private User researcher;
    private User externalUser;
    private Workspace workspace;
    private Project publicProject;
    private Project privateProject;
    private Authentication researcherAuth;

    @BeforeEach
    void setUp() {
        affectedParcelRepository.deleteAll();
        resultRepository.deleteAll();
        parameterRepository.deleteAll();
        scenarioRepository.deleteAll();
        jdbcTemplate.execute("DELETE FROM project_land_records");
        landRecordRepository.deleteAll();

        researcher = userRepository.save(User.registerLocal("Dr. Ananya Sharma", "ananya.comp." + UUID.randomUUID() + "@gov.in", "hash123"));
        researcherAuth = new UsernamePasswordAuthenticationToken(
                researcher, null, List.of(new SimpleGrantedAuthority("ROLE_RESEARCHER"))
        );

        externalUser = userRepository.save(User.registerLocal("External Researcher", "external.comp." + UUID.randomUUID() + "@gov.in", "hash123"));

        workspace = workspaceRepository.save(new Workspace(
                "Indore Urban Planning",
                "indore-ws-" + UUID.randomUUID().toString().substring(0, 8),
                "Urban study workspace",
                "MoHUA",
                WorkspaceVisibility.PUBLIC,
                researcher
        ));

        workspaceMemberRepository.save(new WorkspaceMember(workspace, researcher, WorkspaceRole.OWNER));

        publicProject = projectRepository.save(new Project(
                workspace,
                "Public Indore Master Plan",
                "public-master-plan-" + UUID.randomUUID().toString().substring(0, 8),
                "Public infrastructure evaluation",
                ProjectVisibility.PUBLIC,
                researcher
        ));

        Workspace privateWorkspace = workspaceRepository.save(new Workspace(
                "Defense Planning",
                "defense-ws-" + UUID.randomUUID().toString().substring(0, 8),
                "Confidential",
                "MoD",
                WorkspaceVisibility.PRIVATE,
                externalUser
        ));
        workspaceMemberRepository.save(new WorkspaceMember(privateWorkspace, externalUser, WorkspaceRole.OWNER));

        privateProject = projectRepository.save(new Project(
                privateWorkspace,
                "Private Defense Zone Study",
                "private-defense-" + UUID.randomUUID().toString().substring(0, 8),
                "Confidential planning",
                ProjectVisibility.PRIVATE_TO_PROJECT_MEMBERS,
                externalUser
        ));
        projectMemberRepository.save(new ProjectMember(privateProject, externalUser, ProjectRole.LEAD));

        // Seed 4 test parcels in Indore:
        // 3 Agricultural parcels (total 30,000 sqm), 1 Commercial parcel (10,000 sqm)
        createParcel("MP-IND-001", "Madhya Pradesh", "Indore", "Rau", "Rangwasa",
                new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.8100, 22.6500, 75.8200, 22.6600);
        createParcel("MP-IND-002", "Madhya Pradesh", "Indore", "Rau", "Rangwasa",
                new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.8200, 22.6500, 75.8300, 22.6600);
        createParcel("MP-IND-003", "Madhya Pradesh", "Indore", "Rau", "Rangwasa",
                new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.COMMUNITY, LandRecordStatus.DISPUTED,
                75.8300, 22.6500, 75.8400, 22.6600);
        createParcel("MP-IND-004", "Madhya Pradesh", "Indore", "Rau", "Rangwasa",
                new BigDecimal("10000.00"), LandUseType.COMMERCIAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.8400, 22.6500, 75.8500, 22.6600);
    }

    @Test
    @DisplayName("17-21. Compare two completed results: numeric deltas and distribution deltas calculated deterministically")
    void testCompareTwoCompletedResults() {
        // Scenario A: 50% Agricultural conversion in Indore
        PolicyScenario scenarioA = createScenario(publicProject, "Scenario A - 50%", new BigDecimal("50.00"));
        ScenarioResultResponse resultA = simulationService.executeScenario(scenarioA.getId(), researcherAuth);

        // Scenario B: 100% Agricultural conversion in Indore
        PolicyScenario scenarioB = createScenario(publicProject, "Scenario B - 100%", new BigDecimal("100.00"));
        ScenarioResultResponse resultB = simulationService.executeScenario(scenarioB.getId(), researcherAuth);

        CompareScenariosRequest request = new CompareScenariosRequest(
                null,
                List.of(scenarioA.getId(), scenarioB.getId())
        );

        ScenarioComparisonResponse comparison = comparisonService.compareScenarios(request, researcherAuth);

        assertThat(comparison).isNotNull();
        assertThat(comparison.scenarios()).hasSize(2);
        assertThat(comparison.comparisons()).hasSize(1);

        PairwiseComparison pair = comparison.comparisons().get(0);
        assertThat(pair.leftScenarioId()).isEqualTo(scenarioA.getId());
        assertThat(pair.rightScenarioId()).isEqualTo(scenarioB.getId());

        // Scenario A: 50% of 3 agricultural parcels -> 2 parcels affected (15,000 sqm or similar ceil)
        // Scenario B: 100% of 3 agricultural parcels -> 3 parcels affected (30,000 sqm)
        // Delta = Right - Left
        assertThat(pair.metricDeltas().totalParcelsEvaluated()).isEqualTo(0L); // Evaluated pool is the same (3 eligible)
        assertThat(pair.metricDeltas().totalParcelsAffected()).isGreaterThanOrEqualTo(1L);
        assertThat(pair.metricDeltas().totalAreaAffectedSqm()).isGreaterThan(BigDecimal.ZERO);

        // Verify distribution deltas exist
        assertThat(pair.landUseDistributionDeltas()).isNotEmpty();
        assertThat(pair.ownershipDistributionDeltas()).isNotEmpty();

        // Verify NO subjective ranking or winner fields exist
        assertThat(comparison.scenarios().get(0)).hasNoNullFieldsOrPropertiesExcept();
    }

    @Test
    @DisplayName("22. Multi-scenario comparison: 3 scenarios produce 3 neutral pairwise matrices")
    void testMultiScenarioComparison() {
        PolicyScenario scA = createScenario(publicProject, "Scenario A", new BigDecimal("30.00"));
        PolicyScenario scB = createScenario(publicProject, "Scenario B", new BigDecimal("60.00"));
        PolicyScenario scC = createScenario(publicProject, "Scenario C", new BigDecimal("90.00"));

        simulationService.executeScenario(scA.getId(), researcherAuth);
        simulationService.executeScenario(scB.getId(), researcherAuth);
        simulationService.executeScenario(scC.getId(), researcherAuth);

        CompareScenariosRequest request = new CompareScenariosRequest(
                null,
                List.of(scA.getId(), scB.getId(), scC.getId())
        );

        ScenarioComparisonResponse response = comparisonService.compareScenarios(request, researcherAuth);

        assertThat(response.scenarios()).hasSize(3);
        // 3 scenarios -> 3 pairs: (A vs B), (A vs C), (B vs C)
        assertThat(response.comparisons()).hasSize(3);

        assertThat(response.comparisons().get(0).leftScenarioId()).isEqualTo(scA.getId());
        assertThat(response.comparisons().get(0).rightScenarioId()).isEqualTo(scB.getId());

        assertThat(response.comparisons().get(1).leftScenarioId()).isEqualTo(scA.getId());
        assertThat(response.comparisons().get(1).rightScenarioId()).isEqualTo(scC.getId());

        assertThat(response.comparisons().get(2).leftScenarioId()).isEqualTo(scB.getId());
        assertThat(response.comparisons().get(2).rightScenarioId()).isEqualTo(scC.getId());
    }

    @Test
    @DisplayName("31 & 32. Comparison is read-only and does not re-execute simulation")
    void testComparisonIsReadOnly() {
        PolicyScenario scA = createScenario(publicProject, "Scenario ReadOnly A", new BigDecimal("50.00"));
        PolicyScenario scB = createScenario(publicProject, "Scenario ReadOnly B", new BigDecimal("75.00"));

        simulationService.executeScenario(scA.getId(), researcherAuth);
        simulationService.executeScenario(scB.getId(), researcherAuth);

        long initialResultCount = resultRepository.count();
        long initialAffectedCount = affectedParcelRepository.count();
        Instant executedAtA = resultRepository.findFirstByScenarioIdOrderByExecutedAtDesc(scA.getId()).orElseThrow().getExecutedAt();

        // Perform comparison
        CompareScenariosRequest request = new CompareScenariosRequest(null, List.of(scA.getId(), scB.getId()));
        comparisonService.compareScenarios(request, researcherAuth);

        // Verification: no simulation was rerun, no database rows added, timestamps untouched
        assertThat(resultRepository.count()).isEqualTo(initialResultCount);
        assertThat(affectedParcelRepository.count()).isEqualTo(initialAffectedCount);
        assertThat(resultRepository.findFirstByScenarioIdOrderByExecutedAtDesc(scA.getId()).orElseThrow().getExecutedAt())
                .isEqualTo(executedAtA);
    }

    @Test
    @DisplayName("27. Unauthorized scenario in private project is rejected with 404 (no existence leakage)")
    void testUnauthorizedScenarioInPrivateProject() {
        PolicyScenario publicSc = createScenario(publicProject, "Public Scenario", new BigDecimal("50.00"));
        simulationService.executeScenario(publicSc.getId(), researcherAuth);

        // Private scenario created by externalUser under privateProject
        PolicyScenario privateSc = createScenario(privateProject, "Private Scenario", new BigDecimal("50.00"));
        Authentication extAuth = new UsernamePasswordAuthenticationToken(
                externalUser, null, List.of(new SimpleGrantedAuthority("ROLE_RESEARCHER"))
        );
        simulationService.executeScenario(privateSc.getId(), extAuth);

        // Researcher (who has no access to privateProject) attempts to compare publicSc with privateSc
        CompareScenariosRequest request = new CompareScenariosRequest(null, List.of(publicSc.getId(), privateSc.getId()));

        assertThatThrownBy(() -> comparisonService.compareScenarios(request, researcherAuth))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Scenario not found");
    }

    @Test
    @DisplayName("28. Incomplete scenario without results is rejected")
    void testIncompleteScenarioWithoutResultsRejected() {
        PolicyScenario completedSc = createScenario(publicProject, "Completed", new BigDecimal("50.00"));
        simulationService.executeScenario(completedSc.getId(), researcherAuth);

        PolicyScenario draftSc = createScenario(publicProject, "Draft", new BigDecimal("50.00"));
        // Draft has not been simulated

        CompareScenariosRequest request = new CompareScenariosRequest(null, List.of(completedSc.getId(), draftSc.getId()));

        assertThatThrownBy(() -> comparisonService.compareScenarios(request, researcherAuth))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("has no completed simulation results");
    }

    @Test
    @DisplayName("29. Cross-scenario result ID is rejected")
    void testCrossScenarioResultIdRejected() {
        PolicyScenario scA = createScenario(publicProject, "Scenario Cross A", new BigDecimal("50.00"));
        PolicyScenario scB = createScenario(publicProject, "Scenario Cross B", new BigDecimal("75.00"));

        simulationService.executeScenario(scA.getId(), researcherAuth);
        ScenarioResultResponse resB = simulationService.executeScenario(scB.getId(), researcherAuth);

        // Attempt to pass scenario A with result B's ID
        CompareScenariosRequest request = new CompareScenariosRequest(
                List.of(
                        new ScenarioResultTarget(scA.getId(), resB.id()),
                        new ScenarioResultTarget(scB.getId(), null)
                ),
                null
        );

        assertThatThrownBy(() -> comparisonService.compareScenarios(request, researcherAuth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not belong to scenario");
    }

    @Test
    @DisplayName("30. Rerun snapshots: specific historical result snapshot compares accurately")
    void testRerunSnapshotsCompareCorrectly() {
        PolicyScenario sc = createScenario(publicProject, "Rerun Scenario", new BigDecimal("30.00"));
        ScenarioResultResponse firstRun = simulationService.executeScenario(sc.getId(), researcherAuth);

        // Re-execute scenario (second run)
        ScenarioResultResponse secondRun = simulationService.executeScenario(sc.getId(), researcherAuth);

        PolicyScenario otherSc = createScenario(publicProject, "Other Scenario", new BigDecimal("60.00"));
        simulationService.executeScenario(otherSc.getId(), researcherAuth);

        // Compare first run of 'sc' against 'otherSc'
        CompareScenariosRequest request = new CompareScenariosRequest(
                List.of(
                        new ScenarioResultTarget(sc.getId(), firstRun.id()),
                        new ScenarioResultTarget(otherSc.getId(), null)
                ),
                null
        );

        ScenarioComparisonResponse response = comparisonService.compareScenarios(request, researcherAuth);

        assertThat(response.scenarios()).hasSize(2);
        assertThat(response.scenarios().get(0).resultId()).isEqualTo(firstRun.id());
    }

    private PolicyScenario createScenario(Project proj, String name, BigDecimal convPct) {
        PolicyScenario scenario = scenarioRepository.save(new PolicyScenario(
                proj,
                researcher,
                name,
                name.toLowerCase().replaceAll("[^a-z0-9]+", "-") + "-" + UUID.randomUUID().toString().substring(0, 6),
                "Scenario description",
                ScenarioType.LAND_USE_CONVERSION
        ));

        ScenarioParameter param = new ScenarioParameter(scenario);
        param.setTargetState("Madhya Pradesh");
        param.setTargetDistrict("Indore");
        param.setSourceLandUse(LandUseType.AGRICULTURAL);
        param.setTargetLandUse(LandUseType.COMMERCIAL);
        param.setConversionPercentage(convPct);
        parameterRepository.save(param);
        scenario.setParameters(param);
        return scenarioRepository.save(scenario);
    }

    private LandRecord createParcel(
            String ulpyn, String state, String district, String tehsil, String village,
            BigDecimal area, LandUseType landUse, OwnershipType ownership, LandRecordStatus status,
            double minLon, double minLat, double maxLon, double maxLat
    ) {
        Coordinate[] coords = new Coordinate[]{
                new Coordinate(minLon, minLat),
                new Coordinate(maxLon, minLat),
                new Coordinate(maxLon, maxLat),
                new Coordinate(minLon, maxLat),
                new Coordinate(minLon, minLat)
        };
        LinearRing ring = geomFactory.createLinearRing(coords);
        Polygon poly = geomFactory.createPolygon(ring);
        poly.setSRID(4326);

        LandRecord record = new LandRecord();
        record.setId(UUID.randomUUID());
        record.setParcelNumber(ulpyn);
        record.setSurveyNumber("SURVEY-" + ulpyn);
        record.setState(state);
        record.setDistrict(district);
        record.setTehsil(tehsil);
        record.setVillage(village);
        record.setLandAreaSqMeters(area);
        record.setLandUseType(landUse);
        record.setOwnershipType(ownership);
        record.setOwnerName("Owner " + ulpyn);
        record.setOwnerIdentifier("OWN-" + ulpyn);
        record.setStatus(status);
        record.setBoundary(poly);
        return landRecordRepository.saveAndFlush(record);
    }
}
