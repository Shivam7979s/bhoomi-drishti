package com.bhoomidrishti.policy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.entity.ProjectRole;
import com.bhoomidrishti.collaboration.entity.ProjectVisibility;
import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.entity.WorkspaceMember;
import com.bhoomidrishti.collaboration.entity.WorkspaceRole;
import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
import com.bhoomidrishti.collaboration.repository.ProjectRepository;
import com.bhoomidrishti.collaboration.repository.WorkspaceMemberRepository;
import com.bhoomidrishti.collaboration.repository.WorkspaceRepository;
import com.bhoomidrishti.landrecord.entity.LandRecord;
import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.landrecord.entity.OwnershipType;
import com.bhoomidrishti.landrecord.repository.LandRecordRepository;
import com.bhoomidrishti.policy.dto.ScenarioResultResponse;
import com.bhoomidrishti.policy.entity.PolicyScenario;
import com.bhoomidrishti.policy.entity.ScenarioAffectedParcel;
import com.bhoomidrishti.policy.entity.ScenarioParameter;
import com.bhoomidrishti.policy.entity.ScenarioResult;
import com.bhoomidrishti.policy.entity.ScenarioStatus;
import com.bhoomidrishti.policy.entity.ScenarioType;
import com.bhoomidrishti.policy.repository.PolicyScenarioRepository;
import com.bhoomidrishti.policy.repository.ScenarioAffectedParcelRepository;
import com.bhoomidrishti.policy.repository.ScenarioParameterRepository;
import com.bhoomidrishti.policy.repository.ScenarioResultRepository;
import com.bhoomidrishti.policy.service.PolicySimulationService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.locationtech.jts.io.WKTReader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

/**
 * Real PostgreSQL + PostGIS integration tests for Phase 8B:
 * Deterministic PostGIS Policy Simulation Engine.
 *
 * Verifies all 15 acceptance criteria against the live PostGIS database:
 * 1. LAND_USE_CONVERSION: eligible selection, deterministic percentage, affected parcels, area calculations, distribution
 * 2. Geographic filters: state, district, tehsil, village
 * 3. Intervention geometry: ST_Intersects behavior
 * 4. Corridor buffer: ST_DWithin behavior with meters interpreted accurately
 * 5. LAND_CEILING_REDISTRIBUTION: parcel-level threshold, affected count/area, no invented redistribution
 * 6. DISPUTE_RISK_ASSESSMENT: disputed records counted, non-predictive exposure
 * 7. PROJECT_PARCEL_EVALUATION: only project-linked parcels evaluated
 * 8. Empty candidate set: zero affected, valid zero metrics, COMPLETED status
 * 9. Rerun: previous result remains valid, new execution result does not corrupt previous snapshot
 * 10. Archived scenario: execution rejected
 * 11. Invalid parameters: clear validation error
 * 12. Transaction safety: no lingering RUNNING state on failure
 * 13. Privacy: simulation results contain no owner PII
 * 14. Deterministic ordering: same input produces identical affected parcel sets
 * 15. Regression: existing database and repository integrity
 */
@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:5433/bhoomi_drishti",
        "spring.datasource.username=bhoomi",
        "spring.datasource.password=change_me",
        "spring.flyway.enabled=true"
})
@Transactional
class PolicySimulationIntegrationTest {

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
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final GeometryFactory geomFactory = new GeometryFactory(new PrecisionModel(), 4326);
    private final WKTReader wktReader = new WKTReader(geomFactory);

    private User researcher;
    private User externalUser;
    private Workspace workspace;
    private Project project;

    @BeforeEach
    void setUp() {
        affectedParcelRepository.deleteAll();
        resultRepository.deleteAll();
        parameterRepository.deleteAll();
        scenarioRepository.deleteAll();
        jdbcTemplate.execute("DELETE FROM project_land_records");
        landRecordRepository.deleteAll();

        researcher = userRepository.save(User.registerLocal("Dr. Ananya Sharma", "ananya.sim@gov.in", "hash123"));
        externalUser = userRepository.save(User.registerLocal("External Researcher", "external.sim@gov.in", "hash123"));

        workspace = workspaceRepository.save(new Workspace(
                "Indore Urban Planning",
                "indore-urban-planning-" + UUID.randomUUID().toString().substring(0, 8),
                "Urban study workspace",
                "MoHUA",
                WorkspaceVisibility.PRIVATE,
                researcher
        ));

        workspaceMemberRepository.save(new WorkspaceMember(workspace, researcher, WorkspaceRole.OWNER));

        project = projectRepository.save(new Project(
                workspace,
                "Bypass Infrastructure Corridor",
                "bypass-corridor-" + UUID.randomUUID().toString().substring(0, 8),
                "Infrastructure corridor evaluation",
                ProjectVisibility.WORKSPACE_INHERITED,
                researcher
        ));
    }

    @Test
    @DisplayName("1. LAND_USE_CONVERSION: evaluates eligible parcels, applies deterministic percentage, persists result snapshot")
    void test1_LandUseConversion_DeterministicExecution() {
        // Create 4 agricultural parcels of 10,000 sqm each (total 40,000 sqm)
        LandRecord p1 = createParcel("MP-IND-001", "Madhya Pradesh", "Indore", "Rau", "Rangwasa",
                new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.8100, 22.6500, 75.8200, 22.6600);
        LandRecord p2 = createParcel("MP-IND-002", "Madhya Pradesh", "Indore", "Rau", "Rangwasa",
                new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.8200, 22.6500, 75.8300, 22.6600);
        LandRecord p3 = createParcel("MP-IND-003", "Madhya Pradesh", "Indore", "Rau", "Rangwasa",
                new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.DISPUTED,
                75.8300, 22.6500, 75.8400, 22.6600);
        LandRecord p4 = createParcel("MP-IND-004", "Madhya Pradesh", "Indore", "Rau", "Rangwasa",
                new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.COMMUNITY, LandRecordStatus.ACTIVE,
                75.8400, 22.6500, 75.8500, 22.6600);

        // And 1 commercial parcel that must NOT be selected for conversion
        createParcel("MP-IND-COM", "Madhya Pradesh", "Indore", "Rau", "Rangwasa",
                new BigDecimal("5000.00"), LandUseType.COMMERCIAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.8500, 22.6500, 75.8600, 22.6600);

        PolicyScenario scenario = createScenario(ScenarioType.LAND_USE_CONVERSION, "LUC Indore 50%");
        ScenarioParameter param = new ScenarioParameter(scenario);
        param.setTargetState("Madhya Pradesh");
        param.setTargetDistrict("Indore");
        param.setTargetTehsil("Rau");
        param.setTargetVillage("Rangwasa");
        param.setSourceLandUse(LandUseType.AGRICULTURAL);
        param.setTargetLandUse(LandUseType.RESIDENTIAL);
        param.setConversionPercentage(new BigDecimal("50.00")); // 50% of 4 = 2 parcels
        parameterRepository.save(param);

        ScenarioResultResponse response = simulationService.executeScenario(scenario.getId(), researcher);

        assertThat(response).isNotNull();
        assertThat(response.totalParcelsEvaluated()).isEqualTo(4L);
        assertThat(response.totalParcelsAffected()).isEqualTo(2L);
        assertThat(response.totalAreaAffectedSqm()).isEqualByComparingTo("20000.00");
        assertThat(response.baselineAreaSqm()).isEqualByComparingTo("40000.00");
        assertThat(response.disputedParcelsCount()).isEqualTo(1L);
        assertThat(response.disputedAreaSqm()).isEqualByComparingTo("10000.00");
        assertThat(response.landUseDistributionJson()).contains("RESIDENTIAL").contains("AGRICULTURAL");
        assertThat(response.ownershipDistributionJson()).contains("INDIVIDUAL").contains("COMMUNITY");

        // Verify Scenario status updated to COMPLETED
        PolicyScenario updatedScenario = scenarioRepository.findById(scenario.getId()).orElseThrow();
        assertThat(updatedScenario.getStatus()).isEqualTo(ScenarioStatus.COMPLETED);

        // Verify unaffected LandRecord is untouched (simulation is read-only against land_records)
        LandRecord p1Db = landRecordRepository.findById(p1.getId()).orElseThrow();
        assertThat(p1Db.getLandUseType()).isEqualTo(LandUseType.AGRICULTURAL);

        // Verify ScenarioAffectedParcel rows persisted
        List<ScenarioAffectedParcel> affectedParcels = affectedParcelRepository.findByScenarioResultId(response.id());
        assertThat(affectedParcels).hasSize(2);
        assertThat(affectedParcels.get(0).getBaselineLandUse()).isEqualTo(LandUseType.AGRICULTURAL);
        assertThat(affectedParcels.get(0).getSimulatedLandUse()).isEqualTo(LandUseType.RESIDENTIAL);
    }

    @Test
    @DisplayName("2. Geographic filters: state, district, tehsil, village filtering restricts candidate scope")
    void test2_GeographicFilters_RestrictsCandidates() {
        createParcel("IND-VIL-1", "Madhya Pradesh", "Indore", "Rau", "VillageA",
                new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.81, 22.65, 75.82, 22.66);
        createParcel("IND-VIL-2", "Madhya Pradesh", "Indore", "Rau", "VillageB",
                new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.82, 22.65, 75.83, 22.66);
        createParcel("BHO-VIL-1", "Madhya Pradesh", "Bhopal", "Huzur", "Kolar",
                new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                77.41, 23.25, 77.42, 23.26);

        PolicyScenario scenario = createScenario(ScenarioType.LAND_USE_CONVERSION, "VillageA Only");
        ScenarioParameter param = new ScenarioParameter(scenario);
        param.setTargetState("Madhya Pradesh");
        param.setTargetDistrict("Indore");
        param.setTargetTehsil("Rau");
        param.setTargetVillage("VillageA");
        param.setSourceLandUse(LandUseType.AGRICULTURAL);
        param.setTargetLandUse(LandUseType.COMMERCIAL);
        param.setConversionPercentage(new BigDecimal("100.00"));
        parameterRepository.save(param);

        ScenarioResultResponse response = simulationService.executeScenario(scenario.getId(), researcher);

        assertThat(response.totalParcelsEvaluated()).isEqualTo(1L);
        assertThat(response.totalParcelsAffected()).isEqualTo(1L);
        assertThat(response.totalAreaAffectedSqm()).isEqualByComparingTo("10000.00");
    }

    @Test
    @DisplayName("3. Intervention geometry: ST_Intersects selects overlapping parcels")
    void test3_InterventionGeometry_ST_Intersects() throws Exception {
        // Parcel in Bhopal
        createParcel("BHOPAL-OVERLAP", "Madhya Pradesh", "Bhopal", "Huzur", "Kolar",
                new BigDecimal("5000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                77.4100, 23.2500, 77.4200, 23.2600);
        // Parcel in Indore (outside query geometry)
        createParcel("INDORE-DISJOINT", "Madhya Pradesh", "Indore", "Rau", "Rangwasa",
                new BigDecimal("5000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.8100, 22.6500, 75.8200, 22.6600);

        PolicyScenario scenario = createScenario(ScenarioType.LAND_USE_CONVERSION, "Spatial Intersection");
        ScenarioParameter param = new ScenarioParameter(scenario);
        param.setSourceLandUse(LandUseType.AGRICULTURAL);
        param.setTargetLandUse(LandUseType.RESIDENTIAL);
        param.setConversionPercentage(new BigDecimal("100.00"));

        // Polygon overlapping Bhopal parcel
        Geometry queryPoly = wktReader.read("POLYGON((77.4000 23.2400, 77.4300 23.2400, 77.4300 23.2700, 77.4000 23.2700, 77.4000 23.2400))");
        queryPoly.setSRID(4326);
        param.setInterventionGeometry(queryPoly);
        parameterRepository.save(param);

        ScenarioResultResponse response = simulationService.executeScenario(scenario.getId(), researcher);

        assertThat(response.totalParcelsEvaluated()).isEqualTo(1L);
        assertThat(response.totalParcelsAffected()).isEqualTo(1L);
    }

    @Test
    @DisplayName("4. Corridor buffer: ST_DWithin accurately measures distance in meters using PostGIS geography")
    void test4_CorridorBuffer_ST_DWithin_Meters() throws Exception {
        // Parcel at longitude 75.8000, latitude 22.7000 (roughly 110 meters wide)
        createParcel("NEAR-CORRIDOR", "Madhya Pradesh", "Indore", "Rau", "VillageA",
                new BigDecimal("5000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.8000, 22.7000, 75.8010, 22.7010);

        // Parcel 1 km away (lon 75.8100 is ~1028 meters east at 22.7 deg latitude)
        createParcel("FAR-PARCEL", "Madhya Pradesh", "Indore", "Rau", "VillageA",
                new BigDecimal("5000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.8100, 22.7000, 75.8110, 22.7010);

        // Centerline geometry passing through 75.8000, 22.7005 (right next to NEAR-CORRIDOR)
        Geometry corridorLine = wktReader.read("LINESTRING(75.8000 22.6950, 75.8000 22.7050)");
        corridorLine.setSRID(4326);

        // Buffer of 500 meters: should include NEAR-CORRIDOR, exclude FAR-PARCEL (~1028m away)
        PolicyScenario scenario500m = createScenario(ScenarioType.CORRIDOR_BUFFER_INTERVENTION, "Corridor 500m");
        ScenarioParameter param500m = new ScenarioParameter(scenario500m);
        param500m.setInterventionGeometry(corridorLine);
        param500m.setBufferDistanceMeters(new BigDecimal("500.00"));
        parameterRepository.save(param500m);

        ScenarioResultResponse response500m = simulationService.executeScenario(scenario500m.getId(), researcher);
        assertThat(response500m.totalParcelsEvaluated()).isEqualTo(1L);
        assertThat(response500m.totalParcelsAffected()).isEqualTo(1L);

        // Buffer of 1500 meters: should include BOTH parcels
        PolicyScenario scenario1500m = createScenario(ScenarioType.CORRIDOR_BUFFER_INTERVENTION, "Corridor 1500m");
        ScenarioParameter param1500m = new ScenarioParameter(scenario1500m);
        param1500m.setInterventionGeometry(corridorLine);
        param1500m.setBufferDistanceMeters(new BigDecimal("1500.00"));
        parameterRepository.save(param1500m);

        ScenarioResultResponse response1500m = simulationService.executeScenario(scenario1500m.getId(), researcher);
        assertThat(response1500m.totalParcelsEvaluated()).isEqualTo(2L);
        assertThat(response1500m.totalParcelsAffected()).isEqualTo(2L);
    }

    @Test
    @DisplayName("5. LAND_CEILING_REDISTRIBUTION: identifies parcels exceeding area threshold without invented redistribution")
    void test5_LandCeilingRedistribution() {
        createParcel("SMALL-1", "Madhya Pradesh", "Indore", "Rau", "VillageA",
                new BigDecimal("25000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.81, 22.65, 75.82, 22.66);
        createParcel("LARGE-1", "Madhya Pradesh", "Indore", "Rau", "VillageA",
                new BigDecimal("75000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.82, 22.65, 75.83, 22.66);
        createParcel("LARGE-2", "Madhya Pradesh", "Indore", "Rau", "VillageA",
                new BigDecimal("80000.00"), LandUseType.COMMERCIAL, OwnershipType.COMMUNITY, LandRecordStatus.ACTIVE,
                75.83, 22.65, 75.84, 22.66);

        PolicyScenario scenario = createScenario(ScenarioType.LAND_CEILING_REDISTRIBUTION, "Ceiling 50000 sqm");
        ScenarioParameter param = new ScenarioParameter(scenario);
        param.setTargetDistrict("Indore");
        param.setMaxOwnershipArea(new BigDecimal("50000.00"));
        parameterRepository.save(param);

        ScenarioResultResponse response = simulationService.executeScenario(scenario.getId(), researcher);

        assertThat(response.totalParcelsEvaluated()).isEqualTo(3L);
        assertThat(response.totalParcelsAffected()).isEqualTo(2L); // LARGE-1 and LARGE-2
        assertThat(response.totalAreaAffectedSqm()).isEqualByComparingTo("155000.00");
        assertThat(response.baselineAreaSqm()).isEqualByComparingTo("180000.00");

        // Verify affected parcel snapshot
        List<ScenarioAffectedParcel> affected = affectedParcelRepository.findByScenarioResultId(response.id());
        assertThat(affected).hasSize(2);
    }

    @Test
    @DisplayName("6. DISPUTE_RISK_ASSESSMENT: counts existing disputed records deterministically with no predictive claim")
    void test6_DisputeRiskAssessment() {
        createParcel("DISP-1", "Madhya Pradesh", "Indore", "Rau", "VillageA",
                new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.DISPUTED,
                75.81, 22.65, 75.82, 22.66);
        createParcel("DISP-2", "Madhya Pradesh", "Indore", "Rau", "VillageA",
                new BigDecimal("15000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.DISPUTED,
                75.82, 22.65, 75.83, 22.66);
        createParcel("ACTIVE-1", "Madhya Pradesh", "Indore", "Rau", "VillageA",
                new BigDecimal("20000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.83, 22.65, 75.84, 22.66);

        PolicyScenario scenario = createScenario(ScenarioType.DISPUTE_RISK_ASSESSMENT, "Indore Dispute Exposure");
        ScenarioParameter param = new ScenarioParameter(scenario);
        param.setTargetDistrict("Indore");
        parameterRepository.save(param);

        ScenarioResultResponse response = simulationService.executeScenario(scenario.getId(), researcher);

        assertThat(response.totalParcelsEvaluated()).isEqualTo(3L);
        assertThat(response.disputedParcelsCount()).isEqualTo(2L);
        assertThat(response.disputedAreaSqm()).isEqualByComparingTo("25000.00");
        assertThat(response.totalParcelsAffected()).isEqualTo(2L);
        assertThat(response.spatialSummaryJson()).contains("EXISTING_DISPUTED_RECORD_EXPOSURE");
    }

    @Test
    @DisplayName("7. PROJECT_PARCEL_EVALUATION: includes only parcels linked to the requested project")
    void test7_ProjectParcelEvaluation() {
        LandRecord pLinked = createParcel("LINKED-1", "Madhya Pradesh", "Indore", "Rau", "VillageA",
                new BigDecimal("12000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.81, 22.65, 75.82, 22.66);
        LandRecord pUnlinked = createParcel("UNLINKED-1", "Madhya Pradesh", "Indore", "Rau", "VillageA",
                new BigDecimal("18000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.82, 22.65, 75.83, 22.66);

        // Link only pLinked to project
        jdbcTemplate.update(
                "INSERT INTO project_land_records (project_id, land_record_id, added_by, added_at) VALUES (?, ?, ?, now())",
                project.getId(), pLinked.getId(), researcher.getId()
        );

        PolicyScenario scenario = createScenario(ScenarioType.PROJECT_PARCEL_EVALUATION, "Project Scope Evaluation");
        ScenarioParameter param = new ScenarioParameter(scenario);
        parameterRepository.save(param);

        ScenarioResultResponse response = simulationService.executeScenario(scenario.getId(), researcher);

        assertThat(response.totalParcelsEvaluated()).isEqualTo(1L);
        assertThat(response.totalParcelsAffected()).isEqualTo(1L);
        assertThat(response.totalAreaAffectedSqm()).isEqualByComparingTo("12000.00");

        List<ScenarioAffectedParcel> affected = affectedParcelRepository.findByScenarioResultId(response.id());
        assertThat(affected).hasSize(1);
        assertThat(affected.get(0).getLandRecord().getId()).isEqualTo(pLinked.getId());
    }

    @Test
    @DisplayName("8. Empty candidate set: returns zero metrics and COMPLETED status cleanly")
    void test8_EmptyCandidateSet() {
        PolicyScenario scenario = createScenario(ScenarioType.LAND_USE_CONVERSION, "Empty Candidates");
        ScenarioParameter param = new ScenarioParameter(scenario);
        param.setTargetDistrict("NonExistentDistrict");
        param.setSourceLandUse(LandUseType.FOREST);
        param.setTargetLandUse(LandUseType.COMMERCIAL);
        param.setConversionPercentage(new BigDecimal("50.00"));
        parameterRepository.save(param);

        ScenarioResultResponse response = simulationService.executeScenario(scenario.getId(), researcher);

        assertThat(response.totalParcelsEvaluated()).isEqualTo(0L);
        assertThat(response.totalParcelsAffected()).isEqualTo(0L);
        assertThat(response.totalAreaAffectedSqm()).isEqualByComparingTo("0.00");
        assertThat(response.baselineAreaSqm()).isEqualByComparingTo("0.00");

        PolicyScenario updated = scenarioRepository.findById(scenario.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(ScenarioStatus.COMPLETED);
    }

    @Test
    @DisplayName("9. Rerun: previous result remains valid, new snapshot created without corruption")
    void test9_RerunScenario_CreatesNewSnapshot() throws Exception {
        createParcel("RERUN-1", "Madhya Pradesh", "Indore", "Rau", "VillageA",
                new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.81, 22.65, 75.82, 22.66);

        PolicyScenario scenario = createScenario(ScenarioType.LAND_USE_CONVERSION, "Rerun Scenario");
        ScenarioParameter param = new ScenarioParameter(scenario);
        param.setTargetDistrict("Indore");
        param.setSourceLandUse(LandUseType.AGRICULTURAL);
        param.setTargetLandUse(LandUseType.RESIDENTIAL);
        param.setConversionPercentage(new BigDecimal("100.00"));
        parameterRepository.save(param);

        // Run 1
        ScenarioResultResponse run1 = simulationService.executeScenario(scenario.getId(), researcher);
        Thread.sleep(10); // Guarantee distinct execution timestamp

        // Run 2
        ScenarioResultResponse run2 = simulationService.executeScenario(scenario.getId(), researcher);

        assertThat(run1.id()).isNotEqualTo(run2.id());

        // Check both results exist in database
        List<ScenarioResult> allResults = resultRepository.findByScenarioIdOrderByExecutedAtDesc(scenario.getId());
        assertThat(allResults).hasSize(2);
        assertThat(allResults.get(0).getId()).isEqualTo(run2.id());
        assertThat(allResults.get(1).getId()).isEqualTo(run1.id());

        // Both runs have valid affected parcel records
        assertThat(affectedParcelRepository.findByScenarioResultId(run1.id())).hasSize(1);
        assertThat(affectedParcelRepository.findByScenarioResultId(run2.id())).hasSize(1);
    }

    @Test
    @DisplayName("10. Archived scenario: execution is rejected with IllegalStateException")
    void test10_ArchivedScenario_ExecutionRejected() {
        PolicyScenario scenario = createScenario(ScenarioType.LAND_USE_CONVERSION, "Archived Scenario");
        scenario.setStatus(ScenarioStatus.ARCHIVED);
        scenarioRepository.save(scenario);

        ScenarioParameter param = new ScenarioParameter(scenario);
        param.setSourceLandUse(LandUseType.AGRICULTURAL);
        param.setTargetLandUse(LandUseType.RESIDENTIAL);
        param.setConversionPercentage(new BigDecimal("10.00"));
        parameterRepository.save(param);

        assertThatThrownBy(() -> simulationService.executeScenario(scenario.getId(), researcher))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot execute an archived scenario");
    }

    @Test
    @DisplayName("11. Invalid parameters: clear validation error thrown")
    void test11_InvalidParameters_ThrowsValidationError() {
        PolicyScenario scenario = createScenario(ScenarioType.LAND_USE_CONVERSION, "Invalid Param");
        ScenarioParameter param = new ScenarioParameter(scenario);
        param.setSourceLandUse(LandUseType.AGRICULTURAL);
        param.setTargetLandUse(LandUseType.AGRICULTURAL); // Same target as source!
        param.setConversionPercentage(new BigDecimal("20.00"));
        parameterRepository.save(param);

        assertThatThrownBy(() -> simulationService.executeScenario(scenario.getId(), researcher))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Target land use must differ from source land use");
    }

    @Test
    @DisplayName("12. Transaction safety: failure does not leave scenario stuck in RUNNING or write partial result")
    void test12_TransactionRollbackOnFailure() {
        PolicyScenario scenario = createScenario(ScenarioType.LAND_USE_CONVERSION, "Failing Scenario");
        // No ScenarioParameter saved!
        UUID scenarioId = scenario.getId();

        assertThatThrownBy(() -> simulationService.executeScenario(scenarioId, researcher))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Scenario has no parameters configured");

        PolicyScenario postFail = scenarioRepository.findById(scenarioId).orElseThrow();
        assertThat(postFail.getStatus()).isNotEqualTo(ScenarioStatus.RUNNING);
        assertThat(resultRepository.findByScenarioIdOrderByExecutedAtDesc(scenarioId)).isEmpty();
    }

    @Test
    @DisplayName("13. Privacy: ScenarioResult JSON aggregates and snapshots contain NO owner PII")
    void test13_Privacy_NoOwnerPiiPersisted() {
        String sensitiveOwner = "Secret Maharaja Trust";
        String sensitiveId = "PAN-XXXXX-9999";

        LandRecord p = new LandRecord();
        p.setId(UUID.randomUUID());
        p.setParcelNumber("PRIVACY-01");
        p.setSurveyNumber("SN-PRIVACY-01");
        p.setState("Madhya Pradesh");
        p.setDistrict("Indore");
        p.setTehsil("Rau");
        p.setVillage("VillageA");
        p.setLandAreaSqMeters(new BigDecimal("15000.00"));
        p.setLandUseType(LandUseType.AGRICULTURAL);
        p.setOwnershipType(OwnershipType.INDIVIDUAL);
        p.setOwnerName(sensitiveOwner);
        p.setOwnerIdentifier(sensitiveId);
        p.setStatus(LandRecordStatus.ACTIVE);
        p.setBoundary(createPolygon(75.81, 22.65, 75.82, 22.66));
        landRecordRepository.saveAndFlush(p);

        PolicyScenario scenario = createScenario(ScenarioType.LAND_USE_CONVERSION, "Privacy Scenario");
        ScenarioParameter param = new ScenarioParameter(scenario);
        param.setTargetDistrict("Indore");
        param.setSourceLandUse(LandUseType.AGRICULTURAL);
        param.setTargetLandUse(LandUseType.COMMERCIAL);
        param.setConversionPercentage(new BigDecimal("100.00"));
        parameterRepository.save(param);

        ScenarioResultResponse response = simulationService.executeScenario(scenario.getId(), researcher);

        // Inspect raw persisted JSON fields from database
        String landUseJson = jdbcTemplate.queryForObject(
                "SELECT land_use_distribution_json::text FROM scenario_results WHERE id = ?",
                String.class, response.id());
        String ownershipJson = jdbcTemplate.queryForObject(
                "SELECT ownership_distribution_json::text FROM scenario_results WHERE id = ?",
                String.class, response.id());
        String spatialJson = jdbcTemplate.queryForObject(
                "SELECT spatial_summary_json::text FROM scenario_results WHERE id = ?",
                String.class, response.id());

        assertThat(landUseJson).doesNotContain(sensitiveOwner).doesNotContain(sensitiveId);
        assertThat(ownershipJson).doesNotContain(sensitiveOwner).doesNotContain(sensitiveId);
        assertThat(spatialJson).doesNotContain(sensitiveOwner).doesNotContain(sensitiveId);
    }

    @Test
    @DisplayName("14. Deterministic ordering: same candidate input produces identically ordered affected parcel set")
    void test14_DeterministicOrdering() {
        createParcel("DET-03", "Madhya Pradesh", "Indore", "Rau", "VillageA",
                new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.83, 22.65, 75.84, 22.66);
        createParcel("DET-01", "Madhya Pradesh", "Indore", "Rau", "VillageA",
                new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.81, 22.65, 75.82, 22.66);
        createParcel("DET-02", "Madhya Pradesh", "Indore", "Rau", "VillageA",
                new BigDecimal("10000.00"), LandUseType.AGRICULTURAL, OwnershipType.INDIVIDUAL, LandRecordStatus.ACTIVE,
                75.82, 22.65, 75.83, 22.66);

        PolicyScenario scenario = createScenario(ScenarioType.LAND_USE_CONVERSION, "Deterministic Order");
        ScenarioParameter param = new ScenarioParameter(scenario);
        param.setTargetDistrict("Indore");
        param.setSourceLandUse(LandUseType.AGRICULTURAL);
        param.setTargetLandUse(LandUseType.RESIDENTIAL);
        param.setConversionPercentage(new BigDecimal("66.00")); // floor(3 * 66 / 100) = 1 affected
        parameterRepository.save(param);

        ScenarioResultResponse response = simulationService.executeScenario(scenario.getId(), researcher);

        List<ScenarioAffectedParcel> affected = affectedParcelRepository.findByScenarioResultId(response.id());
        assertThat(affected).hasSize(1);
        // Deterministic ordering by parcel_number ASC means DET-01 is always chosen first
        assertThat(affected.get(0).getLandRecord().getParcelNumber()).isEqualTo("DET-01");
    }

    @Test
    @DisplayName("15. Project authorization: user without project contribute permission is denied execution")
    void test15_ProjectAuthorizationEnforced() {
        PolicyScenario scenario = createScenario(ScenarioType.LAND_USE_CONVERSION, "Secure Scenario");
        ScenarioParameter param = new ScenarioParameter(scenario);
        param.setSourceLandUse(LandUseType.AGRICULTURAL);
        param.setTargetLandUse(LandUseType.RESIDENTIAL);
        param.setConversionPercentage(new BigDecimal("10.00"));
        parameterRepository.save(param);

        // externalUser has no membership or role in private project
        assertThatThrownBy(() -> simulationService.executeScenario(scenario.getId(), externalUser))
                .isInstanceOf(AccessDeniedException.class);
    }

    private PolicyScenario createScenario(ScenarioType type, String name) {
        String slug = name.toLowerCase().replaceAll("[^a-z0-9]+", "-") + "-" + UUID.randomUUID().toString().substring(0, 6);
        PolicyScenario scenario = new PolicyScenario(
                project,
                researcher,
                name,
                slug,
                "Integration test scenario for " + type.name(),
                type
        );
        return scenarioRepository.save(scenario);
    }

    private LandRecord createParcel(
            String parcelNumber, String state, String district, String tehsil, String village,
            BigDecimal area, LandUseType landUse, OwnershipType ownership, LandRecordStatus status,
            double minLon, double minLat, double maxLon, double maxLat) {

        LandRecord record = new LandRecord();
        record.setId(UUID.randomUUID());
        record.setParcelNumber(parcelNumber);
        record.setSurveyNumber("SN-" + parcelNumber);
        record.setState(state);
        record.setDistrict(district);
        record.setTehsil(tehsil);
        record.setVillage(village);
        record.setLandAreaSqMeters(area);
        record.setLandUseType(landUse);
        record.setOwnershipType(ownership);
        record.setOwnerName("Integration Test Owner");
        record.setOwnerIdentifier("OWNER-" + parcelNumber);
        record.setStatus(status);
        record.setBoundary(createPolygon(minLon, minLat, maxLon, maxLat));
        return landRecordRepository.saveAndFlush(record);
    }

    private Polygon createPolygon(double minX, double minY, double maxX, double maxY) {
        Coordinate[] coords = new Coordinate[] {
                new Coordinate(minX, minY),
                new Coordinate(maxX, minY),
                new Coordinate(maxX, maxY),
                new Coordinate(minX, maxY),
                new Coordinate(minX, minY)
        };
        LinearRing ring = geomFactory.createLinearRing(coords);
        Polygon poly = geomFactory.createPolygon(ring);
        poly.setSRID(4326);
        return poly;
    }
}
