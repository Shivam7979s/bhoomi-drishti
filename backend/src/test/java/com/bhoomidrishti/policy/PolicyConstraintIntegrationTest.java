package com.bhoomidrishti.policy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.entity.ProjectVisibility;
import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
import com.bhoomidrishti.collaboration.repository.ProjectRepository;
import com.bhoomidrishti.collaboration.repository.WorkspaceRepository;
import com.bhoomidrishti.landrecord.entity.LandRecord;
import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.landrecord.entity.OwnershipType;
import com.bhoomidrishti.landrecord.repository.LandRecordRepository;
import com.bhoomidrishti.policy.entity.EvidenceType;
import com.bhoomidrishti.policy.entity.PolicyScenario;
import com.bhoomidrishti.policy.entity.ScenarioAffectedParcel;
import com.bhoomidrishti.policy.entity.ScenarioEvidence;
import com.bhoomidrishti.policy.entity.ScenarioParameter;
import com.bhoomidrishti.policy.entity.ScenarioResult;
import com.bhoomidrishti.policy.entity.ScenarioType;
import com.bhoomidrishti.policy.repository.PolicyScenarioRepository;
import com.bhoomidrishti.policy.repository.ScenarioAffectedParcelRepository;
import com.bhoomidrishti.policy.repository.ScenarioEvidenceRepository;
import com.bhoomidrishti.policy.repository.ScenarioParameterRepository;
import com.bhoomidrishti.policy.repository.ScenarioResultRepository;
import com.bhoomidrishti.research.entity.DocumentType;
import com.bhoomidrishti.research.entity.ResearchDocument;
import com.bhoomidrishti.research.entity.ResearchDocumentStatus;
import com.bhoomidrishti.research.repository.ResearchDocumentRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

/**
 * Real PostgreSQL/PostGIS integration tests validating database-level constraints
 * and duplicate-prevention invariants introduced in V6 migration:
 *
 * <ol>
 *   <li>Scenario slug uniqueness scoped per project (uq_scenarios_project_slug)</li>
 *   <li>Scenario affected parcel composite primary key duplicate prevention (pk_scenario_affected_parcels)</li>
 *   <li>Scenario parameter 1:1 uniqueness relationship (uq_scenario_parameters_scenario)</li>
 *   <li>Scenario evidence duplicate checking logic and database behavior</li>
 * </ol>
 */
@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:5433/bhoomi_drishti",
        "spring.datasource.username=bhoomi",
        "spring.datasource.password=change_me",
        "spring.flyway.enabled=true"
})
@Transactional
class PolicyConstraintIntegrationTest {

    @Autowired
    private PolicyScenarioRepository scenarioRepository;

    @Autowired
    private ScenarioParameterRepository parameterRepository;

    @Autowired
    private ScenarioResultRepository resultRepository;

    @Autowired
    private ScenarioAffectedParcelRepository affectedParcelRepository;

    @Autowired
    private ScenarioEvidenceRepository evidenceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private LandRecordRepository landRecordRepository;

    @Autowired
    private ResearchDocumentRepository researchDocumentRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final GeometryFactory geomFactory = new GeometryFactory(new PrecisionModel(), 4326);

    private User testUser;
    private Workspace testWorkspace;
    private Project projectA;
    private Project projectB;

    @BeforeEach
    void setUp() {
        testUser = User.registerLocal(
                "Policy Researcher",
                "policy.researcher." + UUID.randomUUID() + "@bhoomi.gov.in",
                "$2a$10$wN9iL6U/O7QO6zE33e0GkeYF32K8P4XU1v68u7NsqxW5r5Zz4L342"
        );
        testUser = userRepository.saveAndFlush(testUser);

        testWorkspace = new Workspace(
                "State Spatial Planning Cell",
                "spatial-planning-" + UUID.randomUUID().toString().substring(0, 8),
                "Workspace for territorial analysis",
                "Directorate of Land Records",
                WorkspaceVisibility.PRIVATE,
                testUser
        );
        testWorkspace = workspaceRepository.saveAndFlush(testWorkspace);

        projectA = new Project(
                testWorkspace,
                "Indore Urban Corridor",
                "indore-corridor-" + UUID.randomUUID().toString().substring(0, 8),
                "Urban expansion impact study",
                ProjectVisibility.WORKSPACE_INHERITED,
                testUser
        );
        projectA = projectRepository.saveAndFlush(projectA);

        projectB = new Project(
                testWorkspace,
                "Bhopal Metro Zone",
                "bhopal-metro-" + UUID.randomUUID().toString().substring(0, 8),
                "Metro corridor land use",
                ProjectVisibility.WORKSPACE_INHERITED,
                testUser
        );
        projectB = projectRepository.saveAndFlush(projectB);
    }

    // -------------------------------------------------------------------------
    // A. Scenario slug uniqueness
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("A1: uq_scenarios_project_slug rejects duplicate slug in the same project")
    void scenarioSlugUniqueness_sameSlugInSameProject_throwsDataIntegrityViolationException() {
        String sharedSlug = "indore-bypass-conversion";

        PolicyScenario scenario1 = new PolicyScenario(
                projectA, testUser, "Bypass Conversion Phase 1", sharedSlug,
                "Initial conversion plan", ScenarioType.LAND_USE_CONVERSION
        );
        scenarioRepository.saveAndFlush(scenario1);

        PolicyScenario scenario2 = new PolicyScenario(
                projectA, testUser, "Bypass Conversion Phase 2", sharedSlug,
                "Overlapping duplicate slug attempt", ScenarioType.LAND_USE_CONVERSION
        );

        assertThatThrownBy(() -> scenarioRepository.saveAndFlush(scenario2))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("A2: uq_scenarios_project_slug allows identical slug across different projects")
    void scenarioSlugUniqueness_sameSlugInDifferentProjects_isAllowed() {
        String sharedSlug = "master-plan-2035";

        PolicyScenario scenarioInProjectA = new PolicyScenario(
                projectA, testUser, "Indore Master Plan 2035", sharedSlug,
                "Indore scenario", ScenarioType.LAND_USE_CONVERSION
        );
        scenarioRepository.saveAndFlush(scenarioInProjectA);

        PolicyScenario scenarioInProjectB = new PolicyScenario(
                projectB, testUser, "Bhopal Master Plan 2035", sharedSlug,
                "Bhopal scenario", ScenarioType.LAND_USE_CONVERSION
        );
        PolicyScenario savedB = scenarioRepository.saveAndFlush(scenarioInProjectB);

        assertThat(savedB.getId()).isNotNull();
        assertThat(savedB.getSlug()).isEqualTo(sharedSlug);
        assertThat(savedB.getProject().getId()).isEqualTo(projectB.getId());
        assertThat(scenarioInProjectA.getProject().getId()).isEqualTo(projectA.getId());
    }

    // -------------------------------------------------------------------------
    // B. Scenario affected parcel duplicate prevention
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("B1: pk_scenario_affected_parcels prevents duplicate parcel association in the same result")
    void affectedParcel_compositePrimaryKeyPreventsDuplicateInSameResult() {
        PolicyScenario scenario = createAndSaveScenario(projectA, "affected-parcel-test");
        ScenarioResult result = createAndSaveResult(scenario);
        LandRecord record = createAndSaveLandRecord("MP-IND-PARCEL-001");

        // First association
        jdbcTemplate.update("""
            INSERT INTO scenario_affected_parcels
            (scenario_result_id, land_record_id, baseline_land_use, simulated_land_use, parcel_area_sqm, status)
            VALUES (?, ?, 'AGRICULTURAL', 'RESIDENTIAL', 4046.86, 'ACTIVE')
        """, result.getId(), record.getId());

        assertThat(affectedParcelRepository.existsByScenarioResultIdAndLandRecordId(result.getId(), record.getId()))
                .isTrue();

        // Attempt duplicate association with exact same (scenario_result_id, land_record_id)
        assertThatThrownBy(() -> jdbcTemplate.update("""
            INSERT INTO scenario_affected_parcels
            (scenario_result_id, land_record_id, baseline_land_use, simulated_land_use, parcel_area_sqm, status)
            VALUES (?, ?, 'AGRICULTURAL', 'COMMERCIAL', 4046.86, 'ACTIVE')
        """, result.getId(), record.getId()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("B2: pk_scenario_affected_parcels allows same parcel across different scenario results")
    void affectedParcel_sameParcelInDifferentResults_isAllowed() {
        PolicyScenario scenario = createAndSaveScenario(projectA, "multi-result-test");
        ScenarioResult result1 = createAndSaveResult(scenario);
        ScenarioResult result2 = createAndSaveResult(scenario);
        LandRecord record = createAndSaveLandRecord("MP-IND-PARCEL-002");

        jdbcTemplate.update("""
            INSERT INTO scenario_affected_parcels
            (scenario_result_id, land_record_id, baseline_land_use, simulated_land_use, parcel_area_sqm, status)
            VALUES (?, ?, 'AGRICULTURAL', 'RESIDENTIAL', 5000.00, 'ACTIVE')
        """, result1.getId(), record.getId());

        jdbcTemplate.update("""
            INSERT INTO scenario_affected_parcels
            (scenario_result_id, land_record_id, baseline_land_use, simulated_land_use, parcel_area_sqm, status)
            VALUES (?, ?, 'AGRICULTURAL', 'COMMERCIAL', 5000.00, 'ACTIVE')
        """, result2.getId(), record.getId());

        assertThat(affectedParcelRepository.existsByScenarioResultIdAndLandRecordId(result1.getId(), record.getId()))
                .isTrue();
        assertThat(affectedParcelRepository.existsByScenarioResultIdAndLandRecordId(result2.getId(), record.getId()))
                .isTrue();
    }

    // -------------------------------------------------------------------------
    // C. Scenario parameter 1:1 relationship
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("C1: uq_scenario_parameters_scenario prevents multiple parameter records for one scenario")
    void scenarioParameter_uniqueConstraintEnforcesOneToOne() {
        PolicyScenario scenario = createAndSaveScenario(projectA, "param-1to1-test");

        ScenarioParameter param1 = new ScenarioParameter(scenario);
        param1.setTargetState("Madhya Pradesh");
        param1.setTargetDistrict("Indore");
        param1.setConversionPercentage(new BigDecimal("15.50"));
        parameterRepository.saveAndFlush(param1);

        assertThat(parameterRepository.findByScenarioId(scenario.getId())).isPresent();

        // Attempting to persist a second ScenarioParameter record for the exact same scenario
        ScenarioParameter param2 = new ScenarioParameter(scenario);
        param2.setTargetState("Madhya Pradesh");
        param2.setTargetDistrict("Bhopal");
        param2.setConversionPercentage(new BigDecimal("30.00"));

        assertThatThrownBy(() -> parameterRepository.saveAndFlush(param2))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    // -------------------------------------------------------------------------
    // D. Evidence duplicate behavior
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("D1: ScenarioEvidenceRepository duplicate-check queries accurately detect existing evidence")
    void scenarioEvidence_repositoryDuplicateQueriesDetectExistingEvidence() {
        PolicyScenario scenario = createAndSaveScenario(projectA, "evidence-check-test");
        ResearchDocument document = createAndSaveResearchDocument("MP Land Revenue Manual Vol 1");

        // Insert a real document chunk to satisfy fk_evidence_chunk
        UUID chunkId = UUID.randomUUID();
        jdbcTemplate.update("""
            INSERT INTO document_chunks (id, research_document_id, chunk_index, text, embedding, created_at)
            VALUES (?, ?, 0, 'Precedent text for land ceiling redistribution', ('[' || repeat('0,', 383) || '0]')::vector, NOW())
        """, chunkId, document.getId());

        // Initially no evidence is linked
        assertThat(evidenceRepository.existsByScenarioIdAndResearchDocumentId(scenario.getId(), document.getId()))
                .isFalse();
        assertThat(evidenceRepository.existsByScenarioIdAndDocumentChunkId(scenario.getId(), chunkId))
                .isFalse();

        // Link document-level evidence
        ScenarioEvidence docEvidence = new ScenarioEvidence(
                scenario, document, null, EvidenceType.STATUTORY_AUTHORITY,
                "Section 172 Land Conversion Authority", new BigDecimal("0.9500"), testUser
        );
        evidenceRepository.saveAndFlush(docEvidence);

        // Verification query returns true for document
        assertThat(evidenceRepository.existsByScenarioIdAndResearchDocumentId(scenario.getId(), document.getId()))
                .isTrue();
        assertThat(evidenceRepository.existsByScenarioIdAndDocumentChunkId(scenario.getId(), chunkId))
                .isFalse();

        // Link chunk-level evidence
        ScenarioEvidence chunkEvidence = new ScenarioEvidence(
                scenario, null, chunkId, EvidenceType.DISPUTE_PRECEDENT,
                "Arbitration precedence regarding ceiling redistribution", new BigDecimal("0.8800"), testUser
        );
        evidenceRepository.saveAndFlush(chunkEvidence);

        // Verification query returns true for chunk
        assertThat(evidenceRepository.existsByScenarioIdAndDocumentChunkId(scenario.getId(), chunkId))
                .isTrue();
        assertThat(evidenceRepository.countByScenarioId(scenario.getId())).isEqualTo(2);
    }

    // -------------------------------------------------------------------------
    // Helper factories
    // -------------------------------------------------------------------------

    private PolicyScenario createAndSaveScenario(Project project, String slug) {
        PolicyScenario s = new PolicyScenario(
                project, testUser, "Scenario " + slug, slug,
                "Integration test scenario", ScenarioType.LAND_USE_CONVERSION
        );
        return scenarioRepository.saveAndFlush(s);
    }

    private ScenarioResult createAndSaveResult(PolicyScenario scenario) {
        ScenarioResult result = new ScenarioResult(scenario, testUser);
        result.setTotalParcelsEvaluated(100L);
        result.setTotalParcelsAffected(10L);
        result.setTotalAreaAffectedSqm(new BigDecimal("40468.60"));
        result.setBaselineAreaSqm(new BigDecimal("40468.60"));
        result.setSimulatedAreaSqm(new BigDecimal("40468.60"));
        return resultRepository.saveAndFlush(result);
    }

    private LandRecord createAndSaveLandRecord(String parcelNumber) {
        LandRecord record = new LandRecord();
        record.setId(UUID.randomUUID());
        record.setParcelNumber(parcelNumber);
        record.setSurveyNumber("SN-" + parcelNumber);
        record.setState("Madhya Pradesh");
        record.setDistrict("Indore");
        record.setTehsil("Rau");
        record.setVillage("Rau");
        record.setLandAreaSqMeters(new BigDecimal("4046.86"));
        record.setLandUseType(LandUseType.AGRICULTURAL);
        record.setOwnershipType(OwnershipType.INDIVIDUAL);
        record.setOwnerName("Integration Test Owner");
        record.setOwnerIdentifier("INT-TEST-" + parcelNumber);
        record.setStatus(LandRecordStatus.ACTIVE);
        record.setBoundary(createPolygon(77.4100, 23.2500, 77.4200, 23.2600));
        return landRecordRepository.saveAndFlush(record);
    }

    private ResearchDocument createAndSaveResearchDocument(String title) {
        ResearchDocument doc = new ResearchDocument(
                title,
                "Statutory provisions and precedents for land management",
                DocumentType.POLICY_DOCUMENT,
                "Revenue Department",
                "Madhya Pradesh Government",
                LocalDate.of(2020, 1, 1),
                null,
                null,
                "en",
                "revenue,land-use,statutory",
                "Statutory guidelines for land records and conversions.",
                ResearchDocumentStatus.PUBLISHED,
                testUser
        );
        return researchDocumentRepository.saveAndFlush(doc);
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
