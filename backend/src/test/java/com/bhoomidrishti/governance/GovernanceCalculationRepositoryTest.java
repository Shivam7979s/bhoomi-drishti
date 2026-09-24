package com.bhoomidrishti.governance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.entity.ProjectVisibility;
import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
import com.bhoomidrishti.collaboration.repository.ProjectRepository;
import com.bhoomidrishti.collaboration.repository.WorkspaceRepository;
import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import com.bhoomidrishti.governance.repository.GovernanceCalculationRepository;
import com.bhoomidrishti.governance.repository.GovernanceCalculationRepository.CalculationResult;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:5433/bhoomi_drishti",
        "spring.datasource.username=bhoomi",
        "spring.datasource.password=change_me",
        "spring.flyway.enabled=true"
})
@Transactional
class GovernanceCalculationRepositoryTest {

    @Autowired
    private GovernanceCalculationRepository calculationRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private ProjectRepository projectRepository;

    private UUID parcelBhopal1;
    private UUID parcelBhopal2;
    private UUID parcelBhopal3;
    private UUID parcelIndore1;
    private UUID projectAId;
    private UUID projectBId;

    private String testState;
    private String testDistrictBhopal;
    private String testDistrictIndore;
    private String testTehsilHuzur;
    private String testTehsilBerasia;
    private String testTehsilSanwer;
    private String testVillageKolar;
    private String testVillageBairagarh;
    private String testVillageBerasia;
    private String testVillageChandravatiganj;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        testState = "State-" + suffix;
        testDistrictBhopal = "Bhopal-" + suffix;
        testDistrictIndore = "Indore-" + suffix;
        testTehsilHuzur = "Huzur-" + suffix;
        testTehsilBerasia = "Berasia-" + suffix;
        testTehsilSanwer = "Sanwer-" + suffix;
        testVillageKolar = "Kolar-" + suffix;
        testVillageBairagarh = "Bairagarh-" + suffix;
        testVillageBerasia = "Berasia_Village-" + suffix;
        testVillageChandravatiganj = "Chandravatiganj-" + suffix;

        parcelBhopal1 = UUID.randomUUID();
        parcelBhopal2 = UUID.randomUUID();
        parcelBhopal3 = UUID.randomUUID();
        parcelIndore1 = UUID.randomUUID();

        // 1. Insert Bhopal - Huzur - Kolar parcel (ACTIVE, RESIDENTIAL, 1000 m2)
        insertLandRecord(parcelBhopal1, "PARCEL-BHP-1-" + suffix, testState, testDistrictBhopal, testTehsilHuzur, testVillageKolar,
                new BigDecimal("1000.00"), "RESIDENTIAL", "INDIVIDUAL", "ACTIVE");

        // 2. Insert Bhopal - Huzur - Bairagarh parcel (DISPUTED, COMMERCIAL, 2000 m2)
        insertLandRecord(parcelBhopal2, "PARCEL-BHP-2-" + suffix, testState, testDistrictBhopal, testTehsilHuzur, testVillageBairagarh,
                new BigDecimal("2000.00"), "COMMERCIAL", "COMMUNITY", "DISPUTED");

        // 3. Insert Bhopal - Berasia - Berasia_Village parcel (ACTIVE, AGRICULTURAL, 3000 m2)
        insertLandRecord(parcelBhopal3, "PARCEL-BHP-3-" + suffix, testState, testDistrictBhopal, testTehsilBerasia, testVillageBerasia,
                new BigDecimal("3000.00"), "AGRICULTURAL", "GOVERNMENT", "ACTIVE");

        // 4. Insert Indore - Sanwer - Chandravatiganj parcel (ACTIVE, AGRICULTURAL, 4000 m2)
        insertLandRecord(parcelIndore1, "PARCEL-IND-1-" + suffix, testState, testDistrictIndore, testTehsilSanwer, testVillageChandravatiganj,
                new BigDecimal("4000.00"), "AGRICULTURAL", "INDIVIDUAL", "ACTIVE");

        // 5. Setup Project A and Project B for isolation testing
        User user = User.registerLocal("Project Owner " + suffix, "owner-" + suffix + "@bhoomi.gov.in", "hash");
        user.changeRole(Role.ADMIN);
        user = userRepository.save(user);

        Workspace ws = new Workspace("Gov Workspace " + suffix, "gov-ws-" + suffix, "Description", "Institution", WorkspaceVisibility.PUBLIC, user);
        ws = workspaceRepository.save(ws);

        Project projA = new Project(ws, "Project A " + suffix, "proj-a-" + suffix, "Description", ProjectVisibility.PUBLIC, user);
        projA = projectRepository.save(projA);
        projectAId = projA.getId();

        Project projB = new Project(ws, "Project B " + suffix, "proj-b-" + suffix, "Description", ProjectVisibility.PUBLIC, user);
        projB = projectRepository.save(projB);
        projectBId = projB.getId();
        projectRepository.flush();

        // Link Parcel 1 to Project A
        jdbcTemplate.update(
                "INSERT INTO project_land_records (project_id, land_record_id, added_by, added_at) VALUES (?, ?, ?, now())",
                projectAId, parcelBhopal1, user.getId());

        // Link Parcel 2 to Project B
        jdbcTemplate.update(
                "INSERT INTO project_land_records (project_id, land_record_id, added_by, added_at) VALUES (?, ?, ?, now())",
                projectBId, parcelBhopal2, user.getId());
    }

    private void insertLandRecord(
            UUID id, String parcelNum, String state, String district, String tehsil, String village,
            BigDecimal area, String landUse, String ownership, String status) {
        jdbcTemplate.update("""
                INSERT INTO land_records (
                    id, parcel_number, survey_number, state, district, tehsil, village,
                    land_area_sq_meters, land_use_type, ownership_type, owner_name, owner_identifier,
                    status, boundary, created_at, updated_at
                ) VALUES (
                    ?, ?, 'SURV-01', ?, ?, ?, ?,
                    ?, ?, ?, 'Test Owner', 'OWNER-01',
                    ?, ST_GeomFromText('POLYGON((77.4 23.2, 77.41 23.2, 77.41 23.21, 77.4 23.21, 77.4 23.2))', 4326),
                    now(), now()
                )
                """,
                id, parcelNum, state, district, tehsil, village,
                area, landUse, ownership, status);
    }

    // =========================================================================
    // GEOGRAPHIC CORRECTNESS & ISOLATION TESTS
    // =========================================================================

    @Test
    @DisplayName("District query for Bhopal includes only Bhopal parcels and excludes Indore")
    void testDistrictQueryBhopal() {
        CalculationResult result = calculationRepository.calculateIndicator(
                "ACTIVE_PARCEL_COUNT",
                GovernanceScopeType.DISTRICT,
                testState,
                testDistrictBhopal,
                null,
                null,
                null);

        // Bhopal has 2 ACTIVE parcels (parcelBhopal1, parcelBhopal3) and 1 DISPUTED (parcelBhopal2) = total 3
        assertThat(result.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(2));
        assertThat(result.denominator()).isEqualByComparingTo(BigDecimal.valueOf(3));
        assertThat(result.breakdownJson()).contains("\"activeParcels\":2");
        assertThat(result.breakdownJson()).contains("\"totalParcels\":3");
    }

    @Test
    @DisplayName("District query for Indore includes only Indore parcels and excludes Bhopal")
    void testDistrictQueryIndore() {
        CalculationResult result = calculationRepository.calculateIndicator(
                "ACTIVE_PARCEL_COUNT",
                GovernanceScopeType.DISTRICT,
                testState,
                testDistrictIndore,
                null,
                null,
                null);

        // Indore has 1 ACTIVE parcel
        assertThat(result.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(1));
        assertThat(result.denominator()).isEqualByComparingTo(BigDecimal.valueOf(1));
    }

    @Test
    @DisplayName("Tehsil query for Huzur includes only Huzur parcels and excludes Berasia & Indore")
    void testTehsilQueryHuzur() {
        CalculationResult result = calculationRepository.calculateIndicator(
                "AREA_BY_LAND_USE",
                GovernanceScopeType.TEHSIL,
                testState,
                testDistrictBhopal,
                testTehsilHuzur,
                null,
                null);

        // Huzur contains parcelBhopal1 (1000) + parcelBhopal2 (2000) = 3000
        assertThat(result.numericValue()).isEqualByComparingTo(new BigDecimal("3000.00"));
    }

    @Test
    @DisplayName("Village query for Kolar includes only Kolar parcel and excludes other villages")
    void testVillageQueryKolar() {
        CalculationResult result = calculationRepository.calculateIndicator(
                "PARCEL_COUNT_BY_LAND_USE",
                GovernanceScopeType.VILLAGE,
                testState,
                testDistrictBhopal,
                testTehsilHuzur,
                testVillageKolar,
                null);

        // Kolar contains only parcelBhopal1
        assertThat(result.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(1));
        assertThat(result.breakdownJson()).contains("\"RESIDENTIAL\":1");
    }

    @Test
    @DisplayName("All 10 Phase 9A governance indicator calculations execute successfully against PostgreSQL")
    void testAllTenPhase9AIndicatorsExecuteAgainstDatabase() {
        // 1. PARCEL_COUNT_BY_LAND_USE
        CalculationResult r1 = calculationRepository.calculateIndicator(
                "PARCEL_COUNT_BY_LAND_USE", GovernanceScopeType.DISTRICT, testState, testDistrictBhopal, null, null, null);
        assertThat(r1.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(3));
        assertThat(r1.breakdownJson()).contains("\"RESIDENTIAL\":1").contains("\"COMMERCIAL\":1").contains("\"AGRICULTURAL\":1");

        // 2. AREA_BY_LAND_USE
        CalculationResult r2 = calculationRepository.calculateIndicator(
                "AREA_BY_LAND_USE", GovernanceScopeType.DISTRICT, testState, testDistrictBhopal, null, null, null);
        assertThat(r2.numericValue()).isEqualByComparingTo(new BigDecimal("6000.00"));

        // 3. LAND_USE_SHARE
        CalculationResult r3 = calculationRepository.calculateIndicator(
                "LAND_USE_SHARE", GovernanceScopeType.DISTRICT, testState, testDistrictBhopal, null, null, null);
        assertThat(r3.numericValue()).isEqualByComparingTo(new BigDecimal("50.00"));
        assertThat(r3.denominator()).isEqualByComparingTo(new BigDecimal("6000.00"));

        // 4. PARCEL_COUNT_BY_OWNERSHIP
        CalculationResult r4 = calculationRepository.calculateIndicator(
                "PARCEL_COUNT_BY_OWNERSHIP", GovernanceScopeType.DISTRICT, testState, testDistrictBhopal, null, null, null);
        assertThat(r4.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(3));
        assertThat(r4.breakdownJson()).contains("\"INDIVIDUAL\":1").contains("\"COMMUNITY\":1").contains("\"GOVERNMENT\":1");

        // 5. AREA_BY_OWNERSHIP
        CalculationResult r5 = calculationRepository.calculateIndicator(
                "AREA_BY_OWNERSHIP", GovernanceScopeType.DISTRICT, testState, testDistrictBhopal, null, null, null);
        assertThat(r5.numericValue()).isEqualByComparingTo(new BigDecimal("6000.00"));

        // 6. OWNERSHIP_SHARE
        CalculationResult r6 = calculationRepository.calculateIndicator(
                "OWNERSHIP_SHARE", GovernanceScopeType.DISTRICT, testState, testDistrictBhopal, null, null, null);
        assertThat(r6.numericValue()).isEqualByComparingTo(new BigDecimal("50.00"));
        assertThat(r6.denominator()).isEqualByComparingTo(new BigDecimal("6000.00"));

        // 7. ACTIVE_PARCEL_COUNT
        CalculationResult r7 = calculationRepository.calculateIndicator(
                "ACTIVE_PARCEL_COUNT", GovernanceScopeType.DISTRICT, testState, testDistrictBhopal, null, null, null);
        assertThat(r7.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(2));
        assertThat(r7.denominator()).isEqualByComparingTo(BigDecimal.valueOf(3));

        // 8. DISPUTED_PARCEL_COUNT
        CalculationResult r8 = calculationRepository.calculateIndicator(
                "DISPUTED_PARCEL_COUNT", GovernanceScopeType.DISTRICT, testState, testDistrictBhopal, null, null, null);
        assertThat(r8.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(1));
        assertThat(r8.denominator()).isEqualByComparingTo(BigDecimal.valueOf(3));

        // 9. PENDING_VERIFICATION_COUNT
        CalculationResult r9 = calculationRepository.calculateIndicator(
                "PENDING_VERIFICATION_COUNT", GovernanceScopeType.DISTRICT, testState, testDistrictBhopal, null, null, null);
        assertThat(r9.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(0));
        assertThat(r9.denominator()).isEqualByComparingTo(BigDecimal.valueOf(3));

        // 10. INACTIVE_PARCEL_COUNT
        CalculationResult r10 = calculationRepository.calculateIndicator(
                "INACTIVE_PARCEL_COUNT", GovernanceScopeType.DISTRICT, testState, testDistrictBhopal, null, null, null);
        assertThat(r10.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(0));
        assertThat(r10.denominator()).isEqualByComparingTo(BigDecimal.valueOf(3));
    }

    // =========================================================================
    // PROJECT ISOLATION TESTS
    // =========================================================================

    @Test
    @DisplayName("Project A calculation includes only Project A records with zero leakage from Project B")
    void testProjectIsolation() {
        // Project A has parcelBhopal1 (ACTIVE)
        CalculationResult resultA = calculationRepository.calculateIndicator(
                "ACTIVE_PARCEL_COUNT",
                GovernanceScopeType.PROJECT,
                null,
                null,
                null,
                null,
                projectAId);

        assertThat(resultA.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(1));
        assertThat(resultA.denominator()).isEqualByComparingTo(BigDecimal.valueOf(1));

        // Project B has parcelBhopal2 (DISPUTED)
        CalculationResult resultB = calculationRepository.calculateIndicator(
                "DISPUTED_PARCEL_COUNT",
                GovernanceScopeType.PROJECT,
                null,
                null,
                null,
                null,
                projectBId);

        assertThat(resultB.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(1));
        assertThat(resultB.denominator()).isEqualByComparingTo(BigDecimal.valueOf(1));

        // Active parcels in Project B must be 0
        CalculationResult resultBActive = calculationRepository.calculateIndicator(
                "ACTIVE_PARCEL_COUNT",
                GovernanceScopeType.PROJECT,
                null,
                null,
                null,
                null,
                projectBId);
        assertThat(resultBActive.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(0));
    }

    // =========================================================================
    // VALIDATION FAILURE TESTS
    // =========================================================================

    @Test
    @DisplayName("calculateIndicator throws exception for missing required parameters")
    void testValidationFailures() {
        // Missing scopeType
        assertThatThrownBy(() -> calculationRepository.calculateIndicator(
                "ACTIVE_PARCEL_COUNT", null, "MP", "Bhopal", null, null, null))
                .hasMessageContaining("scopeType is required");

        // Missing district in DISTRICT scope
        assertThatThrownBy(() -> calculationRepository.calculateIndicator(
                "ACTIVE_PARCEL_COUNT", GovernanceScopeType.DISTRICT, "MP", null, null, null, null))
                .hasMessageContaining("state and district are required for DISTRICT scope");

        // Missing tehsil in TEHSIL scope
        assertThatThrownBy(() -> calculationRepository.calculateIndicator(
                "ACTIVE_PARCEL_COUNT", GovernanceScopeType.TEHSIL, "MP", "Bhopal", null, null, null))
                .hasMessageContaining("state, district, and tehsil are required for TEHSIL scope");

        // Missing village in VILLAGE scope
        assertThatThrownBy(() -> calculationRepository.calculateIndicator(
                "ACTIVE_PARCEL_COUNT", GovernanceScopeType.VILLAGE, "MP", "Bhopal", "Huzur", null, null))
                .hasMessageContaining("state, district, tehsil, and village are required for VILLAGE scope");

        // Missing projectId in PROJECT scope
        assertThatThrownBy(() -> calculationRepository.calculateIndicator(
                "ACTIVE_PARCEL_COUNT", GovernanceScopeType.PROJECT, null, null, null, null, null))
                .hasMessageContaining("projectId is required for PROJECT scope");

        // Unsupported indicator
        assertThatThrownBy(() -> calculationRepository.calculateIndicator(
                "UNKNOWN_INDICATOR", GovernanceScopeType.STATE, "MP", null, null, null, null))
                .hasMessageContaining("Unsupported calculation for indicator code");
    }
}
