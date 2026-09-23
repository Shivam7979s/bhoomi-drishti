package com.bhoomidrishti.policy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
import com.bhoomidrishti.landrecord.entity.LandRecord;
import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.entity.LandUseType;
import com.bhoomidrishti.policy.entity.EvidenceType;
import com.bhoomidrishti.policy.entity.PolicyScenario;
import com.bhoomidrishti.policy.entity.ScenarioAffectedParcel;
import com.bhoomidrishti.policy.entity.ScenarioAffectedParcelId;
import com.bhoomidrishti.policy.entity.ScenarioEvidence;
import com.bhoomidrishti.policy.entity.ScenarioResult;
import com.bhoomidrishti.policy.entity.ScenarioStatus;
import com.bhoomidrishti.policy.entity.ScenarioType;
import com.bhoomidrishti.research.entity.DocumentType;
import com.bhoomidrishti.research.entity.ResearchDocument;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class PolicyDomainEntityTest {

    private User user;
    private Project project;
    private PolicyScenario scenario;

    @BeforeEach
    void setUp() {
        user = User.registerLocal("Researcher", "res@test.com", "hash");
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());

        Workspace ws = new Workspace("WS", "ws", "desc", "inst", WorkspaceVisibility.PRIVATE, user);
        ReflectionTestUtils.setField(ws, "id", UUID.randomUUID());

        project = new Project(ws, "Project", "proj", "desc", null, user);
        ReflectionTestUtils.setField(project, "id", UUID.randomUUID());

        scenario = new PolicyScenario(project, user, "Scenario", "scenario", "desc", ScenarioType.LAND_USE_CONVERSION);
        ReflectionTestUtils.setField(scenario, "id", UUID.randomUUID());
    }

    @Test
    void scenarioEvidence_rejectWhenBothDocumentAndChunkAreNull() {
        assertThatThrownBy(() -> new ScenarioEvidence(
                scenario, null, null, EvidenceType.STATUTORY_AUTHORITY, "Rationale", null, user
        )).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("At least one of researchDocument or documentChunkId must be provided");
    }

    @Test
    void scenarioEvidence_successWithDocumentOnly() {
        ResearchDocument doc = new ResearchDocument(
                "MP Revenue Manual", "Desc", DocumentType.GOVERNMENT_REPORT, "Dept of Revenue",
                "MP Govt", null, null, null, "en", "revenue,manual", "Abstract", null, user
        );
        ReflectionTestUtils.setField(doc, "id", UUID.randomUUID());

        ScenarioEvidence evidence = new ScenarioEvidence(
                scenario, doc, null, EvidenceType.STATUTORY_AUTHORITY,
                "Section 172 allows conversion of bhumiswami land", new BigDecimal("0.8920"), user
        );

        assertThat(evidence.getResearchDocument()).isNotNull();
        assertThat(evidence.getDocumentChunkId()).isNull();
        assertThat(evidence.getEvidenceType()).isEqualTo(EvidenceType.STATUTORY_AUTHORITY);
        assertThat(evidence.getRationale()).contains("Section 172");
    }

    @Test
    void scenarioEvidence_successWithChunkOnly() {
        UUID chunkId = UUID.randomUUID();

        ScenarioEvidence evidence = new ScenarioEvidence(
                scenario, null, chunkId, EvidenceType.DISPUTE_PRECEDENT,
                "Arbitration standard precedent for Rau village", new BigDecimal("0.9150"), user
        );

        assertThat(evidence.getResearchDocument()).isNull();
        assertThat(evidence.getDocumentChunkId()).isEqualTo(chunkId);
        assertThat(evidence.getEvidenceType()).isEqualTo(EvidenceType.DISPUTE_PRECEDENT);
    }

    @Test
    void scenarioAffectedParcelId_equalsAndHashCode() {
        UUID resultId1 = UUID.randomUUID();
        UUID landRecordId1 = UUID.randomUUID();

        ScenarioAffectedParcelId id1 = new ScenarioAffectedParcelId(resultId1, landRecordId1);
        ScenarioAffectedParcelId id2 = new ScenarioAffectedParcelId(resultId1, landRecordId1);
        ScenarioAffectedParcelId id3 = new ScenarioAffectedParcelId(UUID.randomUUID(), landRecordId1);

        assertThat(id1).isEqualTo(id2);
        assertThat(id1.hashCode()).isEqualTo(id2.hashCode());
        assertThat(id1).isNotEqualTo(id3);
    }

    @Test
    void scenarioAffectedParcel_creationAndMapping() {
        ScenarioResult result = new ScenarioResult(scenario, user);
        ReflectionTestUtils.setField(result, "id", UUID.randomUUID());

        LandRecord record = new LandRecord();
        ReflectionTestUtils.setField(record, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(record, "parcelNumber", "MP-IND-001");

        ScenarioAffectedParcel parcel = new ScenarioAffectedParcel(
                result, record, LandUseType.AGRICULTURAL, LandUseType.RESIDENTIAL,
                new BigDecimal("4046.86"), LandRecordStatus.ACTIVE
        );

        assertThat(parcel.getScenarioResult()).isEqualTo(result);
        assertThat(parcel.getLandRecord()).isEqualTo(record);
        assertThat(parcel.getBaselineLandUse()).isEqualTo(LandUseType.AGRICULTURAL);
        assertThat(parcel.getSimulatedLandUse()).isEqualTo(LandUseType.RESIDENTIAL);
        assertThat(parcel.getParcelAreaSqm()).isEqualTo(new BigDecimal("4046.86"));
        assertThat(parcel.getStatus()).isEqualTo(LandRecordStatus.ACTIVE);
    }

    @Test
    void scenarioStatus_lifecycleEnumValues() {
        assertThat(ScenarioStatus.valueOf("DRAFT")).isEqualTo(ScenarioStatus.DRAFT);
        assertThat(ScenarioStatus.valueOf("RUNNING")).isEqualTo(ScenarioStatus.RUNNING);
        assertThat(ScenarioStatus.valueOf("COMPLETED")).isEqualTo(ScenarioStatus.COMPLETED);
        assertThat(ScenarioStatus.valueOf("ARCHIVED")).isEqualTo(ScenarioStatus.ARCHIVED);
    }

    @Test
    void scenarioType_domainEnumValues() {
        assertThat(ScenarioType.valueOf("LAND_USE_CONVERSION")).isEqualTo(ScenarioType.LAND_USE_CONVERSION);
        assertThat(ScenarioType.valueOf("LAND_CEILING_REDISTRIBUTION")).isEqualTo(ScenarioType.LAND_CEILING_REDISTRIBUTION);
        assertThat(ScenarioType.valueOf("DISPUTE_RISK_ASSESSMENT")).isEqualTo(ScenarioType.DISPUTE_RISK_ASSESSMENT);
        assertThat(ScenarioType.valueOf("CORRIDOR_BUFFER_INTERVENTION")).isEqualTo(ScenarioType.CORRIDOR_BUFFER_INTERVENTION);
        assertThat(ScenarioType.valueOf("PROJECT_PARCEL_EVALUATION")).isEqualTo(ScenarioType.PROJECT_PARCEL_EVALUATION);
    }
}
