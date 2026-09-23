package com.bhoomidrishti.policy.service;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.entity.Project;
import com.bhoomidrishti.collaboration.repository.ProjectRepository;
import com.bhoomidrishti.common.PageResponse;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.policy.dto.CreatePolicyScenarioRequest;
import com.bhoomidrishti.policy.dto.PolicyScenarioResponse;
import com.bhoomidrishti.policy.dto.ScenarioParameterRequest;
import com.bhoomidrishti.policy.dto.ScenarioParameterResponse;
import com.bhoomidrishti.policy.dto.ScenarioResultResponse;
import com.bhoomidrishti.policy.dto.UpdatePolicyScenarioRequest;
import com.bhoomidrishti.policy.entity.PolicyScenario;
import com.bhoomidrishti.policy.entity.ScenarioParameter;
import com.bhoomidrishti.policy.entity.ScenarioResult;
import com.bhoomidrishti.policy.entity.ScenarioStatus;
import com.bhoomidrishti.policy.repository.PolicyScenarioRepository;
import com.bhoomidrishti.policy.repository.ScenarioEvidenceRepository;
import com.bhoomidrishti.policy.repository.ScenarioParameterRepository;
import com.bhoomidrishti.policy.repository.ScenarioResultRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKTReader;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PolicyScenarioService {

    private final PolicyScenarioRepository scenarioRepository;
    private final ScenarioParameterRepository parameterRepository;
    private final ScenarioResultRepository resultRepository;
    private final ScenarioEvidenceRepository evidenceRepository;
    private final ProjectRepository projectRepository;

    public PolicyScenarioService(
            PolicyScenarioRepository scenarioRepository,
            ScenarioParameterRepository parameterRepository,
            ScenarioResultRepository resultRepository,
            ScenarioEvidenceRepository evidenceRepository,
            ProjectRepository projectRepository) {
        this.scenarioRepository = scenarioRepository;
        this.parameterRepository = parameterRepository;
        this.resultRepository = resultRepository;
        this.evidenceRepository = evidenceRepository;
        this.projectRepository = projectRepository;
    }

    public PolicyScenarioResponse createScenario(
            UUID projectId, CreatePolicyScenarioRequest request, User creator) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        String slug = generateUniqueSlug(projectId, request.slug(), request.name());

        PolicyScenario scenario = new PolicyScenario(
                project,
                creator,
                request.name().trim(),
                slug,
                request.description(),
                request.scenarioType()
        );

        scenario = scenarioRepository.save(scenario);

        ScenarioParameter params = null;
        if (request.parameters() != null) {
            params = applyParameters(new ScenarioParameter(scenario), request.parameters());
            params = parameterRepository.save(params);
            scenario.setParameters(params);
        }

        return PolicyScenarioResponse.from(
                scenario,
                ScenarioParameterResponse.from(params),
                null,
                0L
        );
    }

    @Transactional(readOnly = true)
    public PolicyScenarioResponse getScenario(UUID scenarioId) {
        PolicyScenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found: " + scenarioId));

        return toResponse(scenario);
    }

    @Transactional(readOnly = true)
    public PageResponse<PolicyScenarioResponse> listScenarios(UUID projectId, Pageable pageable) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project not found: " + projectId);
        }

        Page<PolicyScenario> p = scenarioRepository.findByProjectIdOrderByCreatedAtDesc(projectId, pageable);
        List<PolicyScenarioResponse> content = p.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PageResponse<>(
                content,
                p.getNumber(),
                p.getSize(),
                p.getTotalElements(),
                p.getTotalPages(),
                p.isFirst(),
                p.isLast()
        );
    }

    public PolicyScenarioResponse updateScenario(UUID scenarioId, UpdatePolicyScenarioRequest request) {
        PolicyScenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found: " + scenarioId));

        if (scenario.getStatus() == ScenarioStatus.ARCHIVED) {
            throw new IllegalStateException("Cannot modify an archived scenario");
        }

        if (request.name() != null && !request.name().isBlank()) {
            scenario.setName(request.name().trim());
        }
        if (request.description() != null) {
            scenario.setDescription(request.description());
        }
        if (request.status() != null) {
            scenario.setStatus(request.status());
        }

        if (request.parameters() != null) {
            ScenarioParameter params = parameterRepository.findByScenarioId(scenarioId)
                    .orElseGet(() -> new ScenarioParameter(scenario));
            params = applyParameters(params, request.parameters());
            params = parameterRepository.save(params);
            scenario.setParameters(params);
        }

        PolicyScenario saved = scenarioRepository.save(scenario);
        return toResponse(saved);
    }

    public void archiveScenario(UUID scenarioId) {
        PolicyScenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found: " + scenarioId));

        scenario.setStatus(ScenarioStatus.ARCHIVED);
        scenarioRepository.save(scenario);
    }

    public void deleteScenario(UUID scenarioId) {
        PolicyScenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found: " + scenarioId));

        scenarioRepository.delete(scenario);
    }

    private ScenarioParameter applyParameters(ScenarioParameter target, ScenarioParameterRequest req) {
        validateParameterConsistency(req);

        target.setTargetState(req.targetState());
        target.setTargetDistrict(req.targetDistrict());
        target.setTargetTehsil(req.targetTehsil());
        target.setTargetVillage(req.targetVillage());
        target.setSourceLandUse(req.sourceLandUse());
        target.setTargetLandUse(req.targetLandUse());
        target.setConversionPercentage(req.conversionPercentage());
        target.setMaxOwnershipArea(req.maxOwnershipArea());
        target.setTargetOwnershipType(req.targetOwnershipType());
        target.setBufferDistanceMeters(req.bufferDistanceMeters());
        target.setCustomParameters(req.customParametersJson());

        if (req.interventionGeometryWkt() != null && !req.interventionGeometryWkt().isBlank()) {
            try {
                Geometry geom = new WKTReader().read(req.interventionGeometryWkt());
                geom.setSRID(4326);
                target.setInterventionGeometry(geom);
            } catch (ParseException e) {
                throw new IllegalArgumentException("Invalid WKT geometry: " + e.getMessage(), e);
            }
        }

        return target;
    }

    private void validateParameterConsistency(ScenarioParameterRequest req) {
        if (req.conversionPercentage() != null) {
            if (req.conversionPercentage().compareTo(BigDecimal.ZERO) < 0
                    || req.conversionPercentage().compareTo(new BigDecimal("100.00")) > 0) {
                throw new IllegalArgumentException("Conversion percentage must be between 0 and 100");
            }
        }
        if (req.maxOwnershipArea() != null && req.maxOwnershipArea().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Max ownership area cannot be negative");
        }
        if (req.bufferDistanceMeters() != null && req.bufferDistanceMeters().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Buffer distance cannot be negative");
        }
    }

    private PolicyScenarioResponse toResponse(PolicyScenario s) {
        ScenarioParameterResponse params = parameterRepository.findByScenarioId(s.getId())
                .map(ScenarioParameterResponse::from)
                .orElse(null);

        ScenarioResultResponse latestResult = resultRepository
                .findFirstByScenarioIdOrderByExecutedAtDesc(s.getId())
                .map(ScenarioResultResponse::from)
                .orElse(null);

        long evidenceCount = evidenceRepository.countByScenarioId(s.getId());

        return PolicyScenarioResponse.from(s, params, latestResult, evidenceCount);
    }

    private String generateUniqueSlug(UUID projectId, String requestedSlug, String name) {
        String base = (requestedSlug != null && !requestedSlug.isBlank())
                ? requestedSlug
                : name;
        String slug = base.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (slug.isBlank()) {
            slug = "scenario";
        }
        if (slug.length() > 100) {
            slug = slug.substring(0, 100);
        }
        String candidate = slug;
        int counter = 1;
        while (scenarioRepository.existsByProjectIdAndSlug(projectId, candidate)) {
            candidate = slug + "-" + counter++;
        }
        return candidate;
    }
}
