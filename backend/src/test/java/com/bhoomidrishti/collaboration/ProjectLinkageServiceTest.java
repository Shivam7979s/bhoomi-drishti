package com.bhoomidrishti.collaboration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.dto.LinkLandRecordRequest;
import com.bhoomidrishti.collaboration.dto.LinkResearchDocumentRequest;
import com.bhoomidrishti.collaboration.dto.ProjectLandRecordResponse;
import com.bhoomidrishti.collaboration.dto.ProjectResearchDocumentResponse;
import com.bhoomidrishti.collaboration.dto.ProjectSharedDatasetResponse;
import com.bhoomidrishti.collaboration.entity.DatasetFormat;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.entity.ProjectLandRecord;
import com.bhoomidrishti.collaboration.entity.ProjectResearchDocument;
import com.bhoomidrishti.collaboration.entity.ProjectSharedDataset;
import com.bhoomidrishti.collaboration.entity.SharedDataset;
import com.bhoomidrishti.collaboration.entity.Workspace;
import com.bhoomidrishti.collaboration.entity.WorkspaceVisibility;
import com.bhoomidrishti.collaboration.repository.ProjectLandRecordRepository;
import com.bhoomidrishti.collaboration.repository.ProjectRepository;
import com.bhoomidrishti.collaboration.repository.ProjectResearchDocumentRepository;
import com.bhoomidrishti.collaboration.repository.ProjectSharedDatasetRepository;
import com.bhoomidrishti.collaboration.repository.SharedDatasetRepository;
import com.bhoomidrishti.collaboration.service.CollaborationSecurityService;
import com.bhoomidrishti.collaboration.service.ProjectLinkageService;
import com.bhoomidrishti.landrecord.entity.LandRecord;
import com.bhoomidrishti.landrecord.repository.LandRecordRepository;
import com.bhoomidrishti.research.entity.DocumentType;
import com.bhoomidrishti.research.entity.ResearchDocument;
import com.bhoomidrishti.research.repository.ResearchDocumentRepository;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ProjectLinkageServiceTest {

    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectLandRecordRepository projectLandRecordRepository;
    @Mock
    private ProjectResearchDocumentRepository projectResearchDocumentRepository;
    @Mock
    private ProjectSharedDatasetRepository projectSharedDatasetRepository;
    @Mock
    private LandRecordRepository landRecordRepository;
    @Mock
    private ResearchDocumentRepository researchDocumentRepository;
    @Mock
    private SharedDatasetRepository sharedDatasetRepository;
    @Mock
    private CollaborationSecurityService securityService;

    private ProjectLinkageService linkageService;

    private User user;
    private Authentication auth;
    private Workspace workspaceA;
    private Workspace workspaceB;
    private Project project;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        linkageService = new ProjectLinkageService(
                projectRepository,
                projectLandRecordRepository,
                projectResearchDocumentRepository,
                projectSharedDatasetRepository,
                landRecordRepository,
                researchDocumentRepository,
                sharedDatasetRepository,
                securityService
        );

        user = User.registerLocal("Researcher", "res@gov.in", "hash");
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        auth = new UsernamePasswordAuthenticationToken(user, null);

        workspaceA = new Workspace("Workspace A", "ws-a", "desc", "inst", WorkspaceVisibility.PRIVATE, user);
        ReflectionTestUtils.setField(workspaceA, "id", UUID.randomUUID());

        workspaceB = new Workspace("Workspace B", "ws-b", "desc", "inst", WorkspaceVisibility.PRIVATE, user);
        ReflectionTestUtils.setField(workspaceB, "id", UUID.randomUUID());

        projectId = UUID.randomUUID();
        project = new Project(workspaceA, "Project", "proj", "desc", null, user);
        ReflectionTestUtils.setField(project, "id", projectId);
    }

    @Test
    void linkDataset_successWhenSameWorkspace() {
        UUID datasetId = UUID.randomUUID();
        SharedDataset dataset = new SharedDataset(
                workspaceA, "Soil Dataset", "Desc", DatasetFormat.GEOJSON, "http://", "Delhi", "2024", "MIT", 100L, 1024L, user);
        ReflectionTestUtils.setField(dataset, "id", datasetId);

        when(securityService.requireAuthenticatedUser(auth)).thenReturn(user);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(projectSharedDatasetRepository.existsByProjectIdAndSharedDatasetId(projectId, datasetId)).thenReturn(false);
        when(sharedDatasetRepository.findById(datasetId)).thenReturn(Optional.of(dataset));

        when(projectSharedDatasetRepository.save(any(ProjectSharedDataset.class))).thenAnswer(inv -> inv.getArgument(0));

        ProjectSharedDatasetResponse response = linkageService.linkDataset(projectId, datasetId, auth);

        assertThat(response).isNotNull();
        assertThat(response.sharedDatasetId()).isEqualTo(datasetId);
        verify(projectSharedDatasetRepository).save(any(ProjectSharedDataset.class));
    }

    @Test
    void linkDataset_rejectWhenDifferentWorkspace() {
        UUID datasetId = UUID.randomUUID();
        SharedDataset dataset = new SharedDataset(
                workspaceB, "Different WS Dataset", "Desc", DatasetFormat.CSV, "http://", "Delhi", "2024", "MIT", 100L, 1024L, user);
        ReflectionTestUtils.setField(dataset, "id", datasetId);

        when(securityService.requireAuthenticatedUser(auth)).thenReturn(user);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(projectSharedDatasetRepository.existsByProjectIdAndSharedDatasetId(projectId, datasetId)).thenReturn(false);
        when(sharedDatasetRepository.findById(datasetId)).thenReturn(Optional.of(dataset));

        assertThatThrownBy(() -> linkageService.linkDataset(projectId, datasetId, auth))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Dataset does not belong to this project's workspace");
    }

    @Test
    void linkLandRecord_success() {
        UUID landRecordId = UUID.randomUUID();
        LandRecord lr = new LandRecord();
        ReflectionTestUtils.setField(lr, "id", landRecordId);
        ReflectionTestUtils.setField(lr, "parcelNumber", "K-101");
        ReflectionTestUtils.setField(lr, "state", "Delhi");
        ReflectionTestUtils.setField(lr, "district", "North");
        ReflectionTestUtils.setField(lr, "tehsil", "Alipur");
        ReflectionTestUtils.setField(lr, "village", "Bakhtawarpur");
        ReflectionTestUtils.setField(lr, "landAreaSqMeters", new BigDecimal("4046.86"));

        when(securityService.requireAuthenticatedUser(auth)).thenReturn(user);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(projectLandRecordRepository.existsByProjectIdAndLandRecordId(projectId, landRecordId)).thenReturn(false);
        when(landRecordRepository.findById(landRecordId)).thenReturn(Optional.of(lr));

        when(projectLandRecordRepository.save(any(ProjectLandRecord.class))).thenAnswer(inv -> inv.getArgument(0));

        LinkLandRecordRequest request = new LinkLandRecordRequest(landRecordId, "Encroachment risk identified");
        ProjectLandRecordResponse response = linkageService.linkLandRecord(projectId, request, auth);

        assertThat(response).isNotNull();
        assertThat(response.landRecordId()).isEqualTo(landRecordId);
        assertThat(response.parcelNumber()).isEqualTo("K-101");
        assertThat(response.contextNotes()).isEqualTo("Encroachment risk identified");
    }

    @Test
    void linkResearchDoc_success() {
        UUID docId = UUID.randomUUID();
        ResearchDocument doc = new ResearchDocument(
                "Urban Policy Review", "Desc", DocumentType.POLICY_DOCUMENT, "Dr. Rao",
                "MoHUA", null, null, null, "en", "urban,policy", "Abstract", null, user);
        ReflectionTestUtils.setField(doc, "id", docId);

        when(securityService.requireAuthenticatedUser(auth)).thenReturn(user);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(projectResearchDocumentRepository.existsByProjectIdAndResearchDocumentId(projectId, docId)).thenReturn(false);
        when(researchDocumentRepository.findById(docId)).thenReturn(Optional.of(doc));

        when(projectResearchDocumentRepository.save(any(ProjectResearchDocument.class))).thenAnswer(inv -> inv.getArgument(0));

        LinkResearchDocumentRequest request = new LinkResearchDocumentRequest(docId, "Supporting literature");
        ProjectResearchDocumentResponse response = linkageService.linkResearchDocument(projectId, request, auth);

        assertThat(response).isNotNull();
        assertThat(response.researchDocumentId()).isEqualTo(docId);
        assertThat(response.title()).isEqualTo("Urban Policy Review");
    }
}
