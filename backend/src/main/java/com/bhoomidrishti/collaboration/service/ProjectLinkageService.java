package com.bhoomidrishti.collaboration.service;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.dto.LinkLandRecordRequest;
import com.bhoomidrishti.collaboration.dto.LinkResearchDocumentRequest;
import com.bhoomidrishti.collaboration.dto.ProjectLandRecordResponse;
import com.bhoomidrishti.collaboration.dto.ProjectResearchDocumentResponse;
import com.bhoomidrishti.collaboration.dto.ProjectSharedDatasetResponse;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.entity.ProjectLandRecord;
import com.bhoomidrishti.collaboration.entity.ProjectResearchDocument;
import com.bhoomidrishti.collaboration.entity.ProjectSharedDataset;
import com.bhoomidrishti.collaboration.entity.SharedDataset;
import com.bhoomidrishti.collaboration.repository.ProjectLandRecordRepository;
import com.bhoomidrishti.collaboration.repository.ProjectRepository;
import com.bhoomidrishti.collaboration.repository.ProjectResearchDocumentRepository;
import com.bhoomidrishti.collaboration.repository.ProjectSharedDatasetRepository;
import com.bhoomidrishti.collaboration.repository.SharedDatasetRepository;
import com.bhoomidrishti.exception.LandRecordNotFoundException;
import com.bhoomidrishti.exception.ResearchDocumentNotFoundException;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.landrecord.entity.LandRecord;
import com.bhoomidrishti.landrecord.repository.LandRecordRepository;
import com.bhoomidrishti.research.entity.ResearchDocument;
import com.bhoomidrishti.research.repository.ResearchDocumentRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProjectLinkageService {

    private final ProjectRepository projectRepository;
    private final ProjectLandRecordRepository projectLandRecordRepository;
    private final ProjectResearchDocumentRepository projectResearchDocumentRepository;
    private final ProjectSharedDatasetRepository projectSharedDatasetRepository;
    private final LandRecordRepository landRecordRepository;
    private final ResearchDocumentRepository researchDocumentRepository;
    private final SharedDatasetRepository sharedDatasetRepository;
    private final CollaborationSecurityService securityService;

    public ProjectLinkageService(
            ProjectRepository projectRepository,
            ProjectLandRecordRepository projectLandRecordRepository,
            ProjectResearchDocumentRepository projectResearchDocumentRepository,
            ProjectSharedDatasetRepository projectSharedDatasetRepository,
            LandRecordRepository landRecordRepository,
            ResearchDocumentRepository researchDocumentRepository,
            SharedDatasetRepository sharedDatasetRepository,
            CollaborationSecurityService securityService) {
        this.projectRepository = projectRepository;
        this.projectLandRecordRepository = projectLandRecordRepository;
        this.projectResearchDocumentRepository = projectResearchDocumentRepository;
        this.projectSharedDatasetRepository = projectSharedDatasetRepository;
        this.landRecordRepository = landRecordRepository;
        this.researchDocumentRepository = researchDocumentRepository;
        this.sharedDatasetRepository = sharedDatasetRepository;
        this.securityService = securityService;
    }

    // --- Land Records ---

    @Transactional(readOnly = true)
    public List<ProjectLandRecordResponse> listLandRecords(UUID projectId, Authentication auth) {
        Project project = getProject(projectId);
        Optional<User> user = securityService.resolveCurrentUser(auth);
        securityService.checkCanViewProject(project, user.orElse(null));

        return projectLandRecordRepository.findByProjectId(projectId).stream()
                .map(plr -> ProjectLandRecordResponse.from(plr, user.isPresent()))
                .toList();
    }

    public ProjectLandRecordResponse linkLandRecord(UUID projectId, LinkLandRecordRequest request, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        Project project = getProject(projectId);
        securityService.checkCanContributeToProject(project, user);

        if (projectLandRecordRepository.existsByProjectIdAndLandRecordId(projectId, request.landRecordId())) {
            throw new IllegalArgumentException("Land record is already linked to this project");
        }

        LandRecord landRecord = landRecordRepository.findById(request.landRecordId())
                .orElseThrow(() -> new LandRecordNotFoundException(request.landRecordId()));

        ProjectLandRecord plr = new ProjectLandRecord(project, landRecord, request.contextNotes(), user);
        plr = projectLandRecordRepository.save(plr);

        return ProjectLandRecordResponse.from(plr, true);
    }

    public void unlinkLandRecord(UUID projectId, UUID landRecordId, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        Project project = getProject(projectId);
        securityService.checkCanContributeToProject(project, user);

        if (!projectLandRecordRepository.existsByProjectIdAndLandRecordId(projectId, landRecordId)) {
            throw new ResourceNotFoundException("Land record linkage not found");
        }

        projectLandRecordRepository.deleteByProjectIdAndLandRecordId(projectId, landRecordId);
    }

    // --- Research Documents ---

    @Transactional(readOnly = true)
    public List<ProjectResearchDocumentResponse> listResearchDocuments(UUID projectId, Authentication auth) {
        Project project = getProject(projectId);
        Optional<User> user = securityService.resolveCurrentUser(auth);
        securityService.checkCanViewProject(project, user.orElse(null));

        return projectResearchDocumentRepository.findByProjectId(projectId).stream()
                .map(prd -> ProjectResearchDocumentResponse.from(prd, user.isPresent()))
                .toList();
    }

    public ProjectResearchDocumentResponse linkResearchDocument(
            UUID projectId, LinkResearchDocumentRequest request, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        Project project = getProject(projectId);
        securityService.checkCanContributeToProject(project, user);

        if (projectResearchDocumentRepository.existsByProjectIdAndResearchDocumentId(projectId, request.researchDocumentId())) {
            throw new IllegalArgumentException("Research document is already linked to this project");
        }

        ResearchDocument doc = researchDocumentRepository.findById(request.researchDocumentId())
                .orElseThrow(() -> new ResearchDocumentNotFoundException(request.researchDocumentId()));

        ProjectResearchDocument prd = new ProjectResearchDocument(project, doc, request.relevanceNotes(), user);
        prd = projectResearchDocumentRepository.save(prd);

        return ProjectResearchDocumentResponse.from(prd, true);
    }

    public void unlinkResearchDocument(UUID projectId, UUID researchDocumentId, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        Project project = getProject(projectId);
        securityService.checkCanContributeToProject(project, user);

        if (!projectResearchDocumentRepository.existsByProjectIdAndResearchDocumentId(projectId, researchDocumentId)) {
            throw new ResourceNotFoundException("Research document linkage not found");
        }

        projectResearchDocumentRepository.deleteByProjectIdAndResearchDocumentId(projectId, researchDocumentId);
    }

    // --- Shared Datasets ---

    @Transactional(readOnly = true)
    public List<ProjectSharedDatasetResponse> listDatasets(UUID projectId, Authentication auth) {
        Project project = getProject(projectId);
        Optional<User> user = securityService.resolveCurrentUser(auth);
        securityService.checkCanViewProject(project, user.orElse(null));

        return projectSharedDatasetRepository.findByProjectId(projectId).stream()
                .map(ProjectSharedDatasetResponse::from)
                .toList();
    }

    public ProjectSharedDatasetResponse linkDataset(UUID projectId, UUID datasetId, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        Project project = getProject(projectId);
        securityService.checkCanContributeToProject(project, user);

        if (projectSharedDatasetRepository.existsByProjectIdAndSharedDatasetId(projectId, datasetId)) {
            throw new IllegalArgumentException("Dataset is already linked to this project");
        }

        SharedDataset dataset = sharedDatasetRepository.findById(datasetId)
                .orElseThrow(() -> new ResourceNotFoundException("Shared dataset not found"));

        // Validate dataset belongs to the same workspace as the project
        if (!dataset.getWorkspace().getId().equals(project.getWorkspace().getId())) {
            throw new IllegalArgumentException("Dataset does not belong to this project's workspace");
        }

        ProjectSharedDataset psd = new ProjectSharedDataset(project, dataset);
        psd = projectSharedDatasetRepository.save(psd);

        return ProjectSharedDatasetResponse.from(psd);
    }

    public void unlinkDataset(UUID projectId, UUID datasetId, Authentication auth) {
        User user = securityService.requireAuthenticatedUser(auth);
        Project project = getProject(projectId);
        securityService.checkCanContributeToProject(project, user);

        if (!projectSharedDatasetRepository.existsByProjectIdAndSharedDatasetId(projectId, datasetId)) {
            throw new ResourceNotFoundException("Dataset linkage not found");
        }

        projectSharedDatasetRepository.deleteByProjectIdAndSharedDatasetId(projectId, datasetId);
    }

    private Project getProject(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }
}
