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
import com.bhoomidrishti.collaboration.entity.ProjectMember;
import com.bhoomidrishti.collaboration.entity.ProjectRole;
import com.bhoomidrishti.collaboration.repository.ProjectMemberRepository;
import com.bhoomidrishti.collaboration.repository.ProjectRepository;
import com.bhoomidrishti.collaboration.repository.WorkspaceRepository;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.governance.dto.GovernanceAdministrativeSummaryResponse;
import com.bhoomidrishti.governance.dto.GovernanceScopeQuery;
import com.bhoomidrishti.governance.dto.GovernanceSummaryIndicatorItemResponse;
import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import com.bhoomidrishti.governance.entity.IndicatorCategory;
import com.bhoomidrishti.governance.service.GovernanceQueryService;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
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
class GovernanceSummaryIntegrationTest {

    @Autowired
    private GovernanceQueryService governanceQueryService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    private UUID parcelBhopal1;
    private UUID parcelBhopal2;
    private UUID parcelBhopal3;
    private UUID parcelIndore1;
    private UUID projectAId;
    private UUID projectBId;
    private User projectOwner;
    private User outsiderUser;
    private User memberUser;
    private Authentication ownerAuth;
    private Authentication outsiderAuth;
    private Authentication memberAuth;

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

        // 1. Bhopal - Huzur - Kolar parcel (ACTIVE, RESIDENTIAL, 1000 m2)
        insertLandRecord(parcelBhopal1, "PARCEL-BHP-1-" + suffix, testState, testDistrictBhopal, testTehsilHuzur, testVillageKolar,
                new BigDecimal("1000.00"), "RESIDENTIAL", "INDIVIDUAL", "ACTIVE");

        // 2. Bhopal - Huzur - Bairagarh parcel (DISPUTED, COMMERCIAL, 2000 m2)
        insertLandRecord(parcelBhopal2, "PARCEL-BHP-2-" + suffix, testState, testDistrictBhopal, testTehsilHuzur, testVillageBairagarh,
                new BigDecimal("2000.00"), "COMMERCIAL", "COMMUNITY", "DISPUTED");

        // 3. Bhopal - Berasia - Berasia_Village parcel (ACTIVE, AGRICULTURAL, 3000 m2)
        insertLandRecord(parcelBhopal3, "PARCEL-BHP-3-" + suffix, testState, testDistrictBhopal, testTehsilBerasia, testVillageBerasia,
                new BigDecimal("3000.00"), "AGRICULTURAL", "GOVERNMENT", "ACTIVE");

        // 4. Indore - Sanwer - Chandravatiganj parcel (ACTIVE, AGRICULTURAL, 4000 m2)
        insertLandRecord(parcelIndore1, "PARCEL-IND-1-" + suffix, testState, testDistrictIndore, testTehsilSanwer, testVillageChandravatiganj,
                new BigDecimal("4000.00"), "AGRICULTURAL", "INDIVIDUAL", "ACTIVE");

        // Setup users
        projectOwner = User.registerLocal("Project Owner " + suffix, "owner-" + suffix + "@bhoomi.gov.in", "hash");
        projectOwner.changeRole(Role.ADMIN);
        projectOwner = userRepository.save(projectOwner);
        ownerAuth = new UsernamePasswordAuthenticationToken(projectOwner, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        outsiderUser = User.registerLocal("Outsider " + suffix, "outsider-" + suffix + "@bhoomi.gov.in", "hash");
        outsiderUser = userRepository.save(outsiderUser);
        outsiderAuth = new UsernamePasswordAuthenticationToken(outsiderUser, null, List.of(new SimpleGrantedAuthority("ROLE_RESEARCHER")));

        memberUser = User.registerLocal("Member " + suffix, "member-" + suffix + "@bhoomi.gov.in", "hash");
        memberUser = userRepository.save(memberUser);
        memberAuth = new UsernamePasswordAuthenticationToken(memberUser, null, List.of(new SimpleGrantedAuthority("ROLE_RESEARCHER")));

        Workspace ws = new Workspace("Workspace " + suffix, "ws-" + suffix, "Desc", "Inst", WorkspaceVisibility.PRIVATE, projectOwner);
        ws = workspaceRepository.save(ws);

        Project projA = new Project(ws, "Project A " + suffix, "proj-a-" + suffix, "Desc", ProjectVisibility.PRIVATE_TO_PROJECT_MEMBERS, projectOwner);
        projA = projectRepository.save(projA);
        projectAId = projA.getId();

        projectMemberRepository.save(new ProjectMember(projA, memberUser, ProjectRole.VIEWER));

        Project projB = new Project(ws, "Project B " + suffix, "proj-b-" + suffix, "Desc", ProjectVisibility.PRIVATE_TO_PROJECT_MEMBERS, projectOwner);
        projB = projectRepository.save(projB);
        projectBId = projB.getId();
        projectRepository.flush();

        // Link Parcel 1 to Project A
        jdbcTemplate.update(
                "INSERT INTO project_land_records (project_id, land_record_id, added_by, added_at) VALUES (?, ?, ?, now())",
                projectAId, parcelBhopal1, projectOwner.getId());

        // Link Parcel 2 to Project B
        jdbcTemplate.update(
                "INSERT INTO project_land_records (project_id, land_record_id, added_by, added_at) VALUES (?, ?, ?, now())",
                projectBId, parcelBhopal2, projectOwner.getId());
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
                    ?, ?, ?, 'Owner', 'ID-01',
                    ?, ST_GeomFromText('POLYGON((77.4 23.2, 77.41 23.2, 77.41 23.21, 77.4 23.21, 77.4 23.2))', 4326),
                    now(), now()
                )
                """,
                id, parcelNum, state, district, tehsil, village,
                area, landUse, ownership, status);
    }

    @Test
    @DisplayName("STATE scope summary calculates all 10 indicators across all districts in state")
    void testLiveSummaryState() {
        GovernanceScopeQuery query = GovernanceScopeQuery.ofState(testState);
        GovernanceAdministrativeSummaryResponse summary = governanceQueryService.generateAdministrativeSummary(
                query, null, null, null);

        assertThat(summary.summaryMode()).isEqualTo("LIVE");
        assertThat(summary.scope().scopeType()).isEqualTo(GovernanceScopeType.STATE);
        assertThat(summary.scope().state()).isEqualTo(testState);
        assertThat(summary.totalIndicatorsEvaluated()).isEqualTo(10);
        assertThat(summary.indicators()).hasSize(10);

        // State has total 4 parcels (3 in Bhopal + 1 in Indore)
        GovernanceSummaryIndicatorItemResponse activeItem = summary.indicators().stream()
                .filter(i -> i.indicatorCode().equals("ACTIVE_PARCEL_COUNT"))
                .findFirst().orElseThrow();
        // 3 ACTIVE (Bhopal 1, Bhopal 3, Indore 1) out of 4 total
        assertThat(activeItem.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(3));
        assertThat(activeItem.denominator()).isEqualByComparingTo(BigDecimal.valueOf(4));
    }

    @Test
    @DisplayName("DISTRICT scope summary for Bhopal excludes Indore parcels")
    void testLiveSummaryDistrictIsolation() {
        GovernanceScopeQuery query = GovernanceScopeQuery.ofDistrict(testState, testDistrictBhopal);
        GovernanceAdministrativeSummaryResponse summary = governanceQueryService.generateAdministrativeSummary(
                query, null, null, null);

        assertThat(summary.summaryMode()).isEqualTo("LIVE");
        assertThat(summary.scope().scopeType()).isEqualTo(GovernanceScopeType.DISTRICT);
        assertThat(summary.scope().district()).isEqualTo(testDistrictBhopal);
        assertThat(summary.totalIndicatorsEvaluated()).isEqualTo(10);

        // Bhopal has 3 parcels (2 ACTIVE, 1 DISPUTED)
        GovernanceSummaryIndicatorItemResponse activeItem = summary.indicators().stream()
                .filter(i -> i.indicatorCode().equals("ACTIVE_PARCEL_COUNT"))
                .findFirst().orElseThrow();
        assertThat(activeItem.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(2));
        assertThat(activeItem.denominator()).isEqualByComparingTo(BigDecimal.valueOf(3));

        GovernanceSummaryIndicatorItemResponse disputedItem = summary.indicators().stream()
                .filter(i -> i.indicatorCode().equals("DISPUTED_PARCEL_COUNT"))
                .findFirst().orElseThrow();
        assertThat(disputedItem.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(1));
    }

    @Test
    @DisplayName("TEHSIL scope summary for Huzur excludes Berasia parcels")
    void testLiveSummaryTehsilIsolation() {
        GovernanceScopeQuery query = GovernanceScopeQuery.ofTehsil(testState, testDistrictBhopal, testTehsilHuzur);
        GovernanceAdministrativeSummaryResponse summary = governanceQueryService.generateAdministrativeSummary(
                query, null, null, null);

        assertThat(summary.scope().scopeType()).isEqualTo(GovernanceScopeType.TEHSIL);
        assertThat(summary.scope().tehsil()).isEqualTo(testTehsilHuzur);

        // Huzur has 2 parcels (1000 m2 + 2000 m2 = 3000 m2)
        GovernanceSummaryIndicatorItemResponse areaItem = summary.indicators().stream()
                .filter(i -> i.indicatorCode().equals("AREA_BY_LAND_USE"))
                .findFirst().orElseThrow();
        assertThat(areaItem.numericValue()).isEqualByComparingTo(new BigDecimal("3000.00"));
    }

    @Test
    @DisplayName("VILLAGE scope summary for Kolar includes only Kolar parcel")
    void testLiveSummaryVillageIsolation() {
        GovernanceScopeQuery query = GovernanceScopeQuery.ofVillage(
                testState, testDistrictBhopal, testTehsilHuzur, testVillageKolar);
        GovernanceAdministrativeSummaryResponse summary = governanceQueryService.generateAdministrativeSummary(
                query, null, null, null);

        assertThat(summary.scope().scopeType()).isEqualTo(GovernanceScopeType.VILLAGE);
        assertThat(summary.scope().village()).isEqualTo(testVillageKolar);

        GovernanceSummaryIndicatorItemResponse parcelCountItem = summary.indicators().stream()
                .filter(i -> i.indicatorCode().equals("PARCEL_COUNT_BY_LAND_USE"))
                .findFirst().orElseThrow();
        assertThat(parcelCountItem.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(1));
    }

    @Test
    @DisplayName("PROJECT scope summary calculates project records with projectName and zero leakage")
    void testLiveSummaryProjectIsolation() {
        GovernanceScopeQuery query = GovernanceScopeQuery.ofProject(projectAId);
        GovernanceAdministrativeSummaryResponse summary = governanceQueryService.generateAdministrativeSummary(
                query, null, null, ownerAuth);

        assertThat(summary.scope().scopeType()).isEqualTo(GovernanceScopeType.PROJECT);
        assertThat(summary.scope().projectId()).isEqualTo(projectAId);
        assertThat(summary.scope().projectName()).startsWith("Project A ");

        // Project A has 1 ACTIVE parcel (parcelBhopal1)
        GovernanceSummaryIndicatorItemResponse activeItem = summary.indicators().stream()
                .filter(i -> i.indicatorCode().equals("ACTIVE_PARCEL_COUNT"))
                .findFirst().orElseThrow();
        assertThat(activeItem.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(1));

        // Disputed in Project A is 0
        GovernanceSummaryIndicatorItemResponse disputedItem = summary.indicators().stream()
                .filter(i -> i.indicatorCode().equals("DISPUTED_PARCEL_COUNT"))
                .findFirst().orElseThrow();
        assertThat(disputedItem.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(0));
    }

    @Test
    @DisplayName("PROJECT scope summary fails with 404 IDOR protection for unauthorized user")
    void testLiveSummaryProjectUnauthorizedIdor() {
        GovernanceScopeQuery query = GovernanceScopeQuery.ofProject(projectAId);
        assertThatThrownBy(() -> governanceQueryService.generateAdministrativeSummary(query, null, null, outsiderAuth))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Project not found");
    }

    @Test
    @DisplayName("PROJECT scope summary fails with 404 IDOR protection for anonymous user on private project")
    void testLiveSummaryProjectAnonymousIdor() {
        GovernanceScopeQuery query = GovernanceScopeQuery.ofProject(projectAId);
        assertThatThrownBy(() -> governanceQueryService.generateAdministrativeSummary(query, null, null, null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Project not found");
    }

    @Test
    @DisplayName("PROJECT scope summary succeeds for authorized non-admin project member")
    void testLiveSummaryProjectMemberAccess() {
        GovernanceScopeQuery query = GovernanceScopeQuery.ofProject(projectAId);
        GovernanceAdministrativeSummaryResponse summary = governanceQueryService.generateAdministrativeSummary(
                query, null, null, memberAuth);

        assertThat(summary.scope().scopeType()).isEqualTo(GovernanceScopeType.PROJECT);
        assertThat(summary.scope().projectId()).isEqualTo(projectAId);
        assertThat(summary.scope().projectName()).startsWith("Project A ");
        assertThat(summary.totalIndicatorsEvaluated()).isEqualTo(10);
    }

    @Test
    @DisplayName("Category filter returns only indicators belonging to specified category")
    void testLiveSummaryCategoryFilter() {
        GovernanceScopeQuery query = GovernanceScopeQuery.ofDistrict(testState, testDistrictBhopal);
        GovernanceAdministrativeSummaryResponse summary = governanceQueryService.generateAdministrativeSummary(
                query, IndicatorCategory.LAND_USE, null, null);

        assertThat(summary.totalIndicatorsEvaluated()).isEqualTo(3);
        assertThat(summary.indicators()).extracting(GovernanceSummaryIndicatorItemResponse::indicatorCode)
                .containsExactlyInAnyOrder("PARCEL_COUNT_BY_LAND_USE", "AREA_BY_LAND_USE", "LAND_USE_SHARE");
    }

    @Test
    @DisplayName("Explicit indicators list returns only requested indicators")
    void testLiveSummaryExplicitIndicators() {
        GovernanceScopeQuery query = GovernanceScopeQuery.ofDistrict(testState, testDistrictBhopal);
        List<String> explicit = List.of("ACTIVE_PARCEL_COUNT", "DISPUTED_PARCEL_COUNT");
        GovernanceAdministrativeSummaryResponse summary = governanceQueryService.generateAdministrativeSummary(
                query, null, explicit, null);

        assertThat(summary.totalIndicatorsEvaluated()).isEqualTo(2);
        assertThat(summary.indicators()).extracting(GovernanceSummaryIndicatorItemResponse::indicatorCode)
                .containsExactlyInAnyOrder("ACTIVE_PARCEL_COUNT", "DISPUTED_PARCEL_COUNT");
    }

    @Test
    @DisplayName("Empty data scope returns zeroed/null values gracefully without errors")
    void testLiveSummaryEmptyData() {
        String nonExistentDistrict = "GhostDistrict-" + UUID.randomUUID().toString().substring(0, 8);
        GovernanceScopeQuery query = GovernanceScopeQuery.ofDistrict(testState, nonExistentDistrict);
        GovernanceAdministrativeSummaryResponse summary = governanceQueryService.generateAdministrativeSummary(
                query, null, null, null);

        assertThat(summary.totalIndicatorsEvaluated()).isEqualTo(10);
        assertThat(summary.summaryMode()).isEqualTo("LIVE");

        GovernanceSummaryIndicatorItemResponse activeItem = summary.indicators().stream()
                .filter(i -> i.indicatorCode().equals("ACTIVE_PARCEL_COUNT"))
                .findFirst().orElseThrow();
        assertThat(activeItem.numericValue()).isEqualByComparingTo(BigDecimal.valueOf(0));
        assertThat(activeItem.denominator()).isEqualByComparingTo(BigDecimal.valueOf(0));
    }
}
