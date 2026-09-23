package com.bhoomidrishti.research.service;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.common.EmailNormalizer;
import com.bhoomidrishti.common.PageResponse;
import com.bhoomidrishti.exception.LandRecordNotFoundException;
import com.bhoomidrishti.exception.ResearchDocumentNotFoundException;
import com.bhoomidrishti.landrecord.dto.LandRecordResponse;
import com.bhoomidrishti.landrecord.entity.LandRecord;
import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.landrecord.repository.LandRecordRepository;
import com.bhoomidrishti.research.dto.CreateResearchDocumentRequest;
import com.bhoomidrishti.research.dto.ResearchDocumentResponse;
import com.bhoomidrishti.research.dto.UpdateResearchDocumentRequest;
import com.bhoomidrishti.research.entity.DocumentType;
import com.bhoomidrishti.research.entity.ResearchDocument;
import com.bhoomidrishti.research.entity.ResearchDocumentStatus;
import com.bhoomidrishti.research.repository.ResearchDocumentRepository;
import jakarta.annotation.Nullable;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ResearchDocumentService {

    static final int DEFAULT_PAGE_SIZE = 20;
    static final int MAX_PAGE_SIZE = 100;

    private final ResearchDocumentRepository repository;
    private final LandRecordRepository landRecordRepository;
    private final UserRepository userRepository;

    public ResearchDocumentService(
            ResearchDocumentRepository repository,
            LandRecordRepository landRecordRepository,
            UserRepository userRepository) {
        this.repository = repository;
        this.landRecordRepository = landRecordRepository;
        this.userRepository = userRepository;
    }

    public ResearchDocumentResponse getById(UUID id, Authentication auth) {
        ResearchDocument doc = repository.findById(id)
                .orElseThrow(() -> new ResearchDocumentNotFoundException(id));
        if (!canRead(doc, auth)) {
            // Throw 404 to avoid leaking existence of DRAFT or ARCHIVED documents to unauthorized users
            throw new ResearchDocumentNotFoundException(id);
        }
        return ResearchDocumentResponse.from(doc);
    }

    public PageResponse<ResearchDocumentResponse> list(
            @Nullable String title,
            @Nullable String documentType,
            @Nullable String status,
            @Nullable String organization,
            @Nullable String author,
            @Nullable String language,
            @Nullable LocalDate startDate,
            @Nullable LocalDate endDate,
            @Nullable String search,
            int page,
            int size,
            Authentication auth) {

        Pageable pageable = PageRequest.of(page, clampSize(size), Sort.by("createdAt").descending());

        Specification<ResearchDocument> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Text Search across 7 fields: title, description, abstractText, authors, organization, keywords, language
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate searchPred = cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern),
                        cb.like(cb.lower(root.get("authors")), pattern),
                        cb.like(cb.lower(root.get("organization")), pattern),
                        cb.like(cb.lower(root.get("keywords")), pattern),
                        cb.like(cb.lower(root.get("language")), pattern),
                        cb.like(cb.lower(root.get("abstractText")), pattern)
                );
                predicates.add(searchPred);
            }

            // 2. Specific filters
            if (title != null && !title.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + title.trim().toLowerCase() + "%"));
            }
            if (documentType != null && !documentType.isBlank()) {
                try {
                    DocumentType typeEnum = DocumentType.valueOf(documentType.trim().toUpperCase());
                    predicates.add(cb.equal(root.get("documentType"), typeEnum));
                } catch (IllegalArgumentException ignored) {
                }
            }
            if (organization != null && !organization.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("organization")), "%" + organization.trim().toLowerCase() + "%"));
            }
            if (author != null && !author.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("authors")), "%" + author.trim().toLowerCase() + "%"));
            }
            if (language != null && !language.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("language")), language.trim().toLowerCase()));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("publicationDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("publicationDate"), endDate));
            }

            // 3. Status filter with RBAC enforcement
            ResearchDocumentStatus requestedStatus = null;
            if (status != null && !status.isBlank()) {
                try {
                    requestedStatus = ResearchDocumentStatus.valueOf(status.trim().toUpperCase());
                } catch (IllegalArgumentException ignored) {
                }
            }

            if (isPublic(auth)) {
                // PUBLIC users can ONLY ever see PUBLISHED documents
                predicates.add(cb.equal(root.get("status"), ResearchDocumentStatus.PUBLISHED));
            } else if (isResearcherOrAcademia(auth)) {
                UUID currentUserId = resolveUserId(auth).orElse(null);
                if (requestedStatus != null) {
                    if (requestedStatus == ResearchDocumentStatus.PUBLISHED) {
                        predicates.add(cb.equal(root.get("status"), ResearchDocumentStatus.PUBLISHED));
                    } else {
                        // For DRAFT or ARCHIVED, researchers only see their own
                        predicates.add(cb.and(
                                cb.equal(root.get("status"), requestedStatus),
                                currentUserId != null
                                        ? cb.equal(root.get("createdBy").get("id"), currentUserId)
                                        : cb.disjunction()
                        ));
                    }
                } else {
                    // All published PLUS their own drafts/archived
                    Predicate publishedPred = cb.equal(root.get("status"), ResearchDocumentStatus.PUBLISHED);
                    if (currentUserId != null) {
                        Predicate ownPred = cb.equal(root.get("createdBy").get("id"), currentUserId);
                        predicates.add(cb.or(publishedPred, ownPred));
                    } else {
                        predicates.add(publishedPred);
                    }
                }
            } else {
                // GOVERNMENT_OFFICIAL or ADMIN
                if (requestedStatus != null) {
                    predicates.add(cb.equal(root.get("status"), requestedStatus));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ResearchDocument> pageResult = repository.findAll(spec, pageable);
        List<ResearchDocumentResponse> items = pageResult.getContent().stream()
                .map(ResearchDocumentResponse::from)
                .collect(Collectors.toList());

        return new PageResponse<>(
                items,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages(),
                pageResult.isFirst(),
                pageResult.isLast()
        );
    }

    @Transactional
    public ResearchDocumentResponse create(CreateResearchDocumentRequest request, Authentication auth) {
        assertCanCreate(auth);
        User creator = resolveUser(auth).orElse(null);

        ResearchDocumentStatus docStatus = request.status() != null
                ? request.status()
                : ResearchDocumentStatus.DRAFT;

        ResearchDocument doc = new ResearchDocument(
                request.title(),
                request.description(),
                request.documentType(),
                request.authors(),
                request.organization(),
                request.publicationDate(),
                request.sourceUrl(),
                request.fileUrl(),
                request.language(),
                request.keywords(),
                request.abstractText(),
                docStatus,
                creator
        );

        if (request.linkedLandRecordIds() != null && !request.linkedLandRecordIds().isEmpty()) {
            Set<LandRecord> records = new HashSet<>();
            for (UUID lrId : request.linkedLandRecordIds()) {
                LandRecord lr = landRecordRepository.findById(lrId)
                        .orElseThrow(() -> new LandRecordNotFoundException(lrId));
                records.add(lr);
            }
            doc.setLinkedLandRecords(records);
        }

        ResearchDocument saved = repository.save(doc);
        return ResearchDocumentResponse.from(saved);
    }

    @Transactional
    public ResearchDocumentResponse update(UUID id, UpdateResearchDocumentRequest request, Authentication auth) {
        ResearchDocument doc = repository.findById(id)
                .orElseThrow(() -> new ResearchDocumentNotFoundException(id));

        assertCanUpdate(doc, auth);

        doc.setTitle(request.title());
        doc.setDescription(request.description());
        doc.setDocumentType(request.documentType());
        doc.setAuthors(request.authors());
        doc.setOrganization(request.organization());
        doc.setPublicationDate(request.publicationDate());
        doc.setSourceUrl(request.sourceUrl());
        doc.setFileUrl(request.fileUrl());
        doc.setLanguage(request.language());
        doc.setKeywords(request.keywords());
        doc.setAbstractText(request.abstractText());
        doc.setStatus(request.status());

        ResearchDocument saved = repository.save(doc);
        return ResearchDocumentResponse.from(saved);
    }

    @Transactional
    public void delete(UUID id, Authentication auth) {
        assertCanDelete(auth);
        ResearchDocument doc = repository.findById(id)
                .orElseThrow(() -> new ResearchDocumentNotFoundException(id));
        repository.delete(doc);
    }

    @Transactional
    public ResearchDocumentResponse linkLandRecord(UUID documentId, UUID landRecordId, Authentication auth) {
        ResearchDocument doc = repository.findById(documentId)
                .orElseThrow(() -> new ResearchDocumentNotFoundException(documentId));
        LandRecord lr = landRecordRepository.findById(landRecordId)
                .orElseThrow(() -> new LandRecordNotFoundException(landRecordId));

        assertCanLink(doc, auth);

        doc.getLinkedLandRecords().add(lr);
        ResearchDocument saved = repository.save(doc);
        return ResearchDocumentResponse.from(saved);
    }

    @Transactional
    public ResearchDocumentResponse unlinkLandRecord(UUID documentId, UUID landRecordId, Authentication auth) {
        ResearchDocument doc = repository.findById(documentId)
                .orElseThrow(() -> new ResearchDocumentNotFoundException(documentId));
        LandRecord lr = landRecordRepository.findById(landRecordId)
                .orElseThrow(() -> new LandRecordNotFoundException(landRecordId));

        assertCanLink(doc, auth);

        doc.getLinkedLandRecords().remove(lr);
        ResearchDocument saved = repository.save(doc);
        return ResearchDocumentResponse.from(saved);
    }

    public List<LandRecordResponse> getLinkedLandRecords(UUID documentId, Authentication auth) {
        ResearchDocument doc = repository.findById(documentId)
                .orElseThrow(() -> new ResearchDocumentNotFoundException(documentId));
        if (!canRead(doc, auth)) {
            throw new ResearchDocumentNotFoundException(documentId);
        }

        boolean publicUser = isPublic(auth);
        return doc.getLinkedLandRecords().stream()
                .filter(lr -> !publicUser || lr.getStatus() == LandRecordStatus.ACTIVE)
                .map(LandRecordResponse::from)
                .collect(Collectors.toList());
    }

    public PageResponse<ResearchDocumentResponse> getLinkedResearchDocuments(
            UUID landRecordId, int page, int size, Authentication auth) {
        if (!landRecordRepository.existsById(landRecordId)) {
            throw new LandRecordNotFoundException(landRecordId);
        }

        Pageable pageable = PageRequest.of(page, clampSize(size), Sort.by("createdAt").descending());
        Page<ResearchDocument> pageResult;

        if (isPublic(auth)) {
            pageResult = repository.findByLinkedLandRecordIdAndStatus(
                    landRecordId, ResearchDocumentStatus.PUBLISHED, pageable);
        } else {
            pageResult = repository.findByLinkedLandRecordId(landRecordId, pageable);
        }

        List<ResearchDocumentResponse> items = pageResult.getContent().stream()
                .filter(doc -> canRead(doc, auth))
                .map(ResearchDocumentResponse::from)
                .collect(Collectors.toList());

        return new PageResponse<>(
                items,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages(),
                pageResult.isFirst(),
                pageResult.isLast()
        );
    }

    // -------------------------------------------------------------------------
    // Helper / Security Methods
    // -------------------------------------------------------------------------

    private static int clampSize(int size) {
        if (size < 1) return DEFAULT_PAGE_SIZE;
        return Math.min(size, MAX_PAGE_SIZE);
    }

    public boolean isPublic(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth.getAuthorities() == null) {
            return true;
        }
        return auth.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals(Role.ADMIN.authority())
                        || a.getAuthority().equals(Role.RESEARCHER.authority())
                        || a.getAuthority().equals(Role.ACADEMIA.authority())
                        || a.getAuthority().equals(Role.GOVERNMENT_OFFICIAL.authority()));
    }

    private boolean isResearcherOrAcademia(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth.getAuthorities() == null) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(Role.RESEARCHER.authority())
                        || a.getAuthority().equals(Role.ACADEMIA.authority()));
    }

    public boolean canRead(ResearchDocument doc, Authentication auth) {
        if (doc.getStatus() == ResearchDocumentStatus.PUBLISHED) {
            return true;
        }
        if (isPublic(auth)) {
            return false;
        }
        if (auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(Role.ADMIN.authority())
                        || a.getAuthority().equals(Role.GOVERNMENT_OFFICIAL.authority()))) {
            return true;
        }
        if (isResearcherOrAcademia(auth)) {
            UUID currentUserId = resolveUserId(auth).orElse(null);
            return currentUserId != null
                    && doc.getCreatedBy() != null
                    && doc.getCreatedBy().getId().equals(currentUserId);
        }
        return false;
    }

    private void assertCanCreate(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        boolean ok = auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(Role.ADMIN.authority())
                        || a.getAuthority().equals(Role.GOVERNMENT_OFFICIAL.authority())
                        || a.getAuthority().equals(Role.RESEARCHER.authority())
                        || a.getAuthority().equals(Role.ACADEMIA.authority()));
        if (!ok) {
            throw new AccessDeniedException("Insufficient permissions to create research documents");
        }
    }

    private void assertCanUpdate(ResearchDocument doc, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        // ADMIN and GOVERNMENT_OFFICIAL can update any document
        boolean isOfficialOrAdmin = auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(Role.ADMIN.authority())
                        || a.getAuthority().equals(Role.GOVERNMENT_OFFICIAL.authority()));
        if (isOfficialOrAdmin) {
            return;
        }

        // RESEARCHER and ACADEMIA can ONLY update documents they created
        if (isResearcherOrAcademia(auth)) {
            UUID currentUserId = resolveUserId(auth).orElse(null);
            if (currentUserId != null
                    && doc.getCreatedBy() != null
                    && doc.getCreatedBy().getId().equals(currentUserId)) {
                return;
            }
            throw new AccessDeniedException("You can only modify documents you created");
        }

        throw new AccessDeniedException("Insufficient permissions to update this document");
    }

    private void assertCanDelete(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(Role.ADMIN.authority()));
        if (!isAdmin) {
            throw new AccessDeniedException("Only ADMIN can delete research documents");
        }
    }

    private void assertCanLink(ResearchDocument doc, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        boolean isOfficialOrAdmin = auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(Role.ADMIN.authority())
                        || a.getAuthority().equals(Role.GOVERNMENT_OFFICIAL.authority()));
        if (isOfficialOrAdmin) {
            return;
        }
        if (isResearcherOrAcademia(auth)) {
            UUID currentUserId = resolveUserId(auth).orElse(null);
            if (currentUserId != null
                    && doc.getCreatedBy() != null
                    && doc.getCreatedBy().getId().equals(currentUserId)) {
                return;
            }
            throw new AccessDeniedException("You can only link land records to documents you created");
        }
        throw new AccessDeniedException("Insufficient permissions to link land records");
    }

    public Optional<UUID> resolveUserId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        if (auth.getPrincipal() instanceof User user) {
            return Optional.ofNullable(user.getId());
        }
        if (auth.getPrincipal() instanceof UserDetails userDetails) {
            return userRepository.findByEmail(EmailNormalizer.normalize(userDetails.getUsername()))
                    .map(User::getId);
        }
        if (auth.getName() != null) {
            return userRepository.findByEmail(EmailNormalizer.normalize(auth.getName()))
                    .map(User::getId);
        }
        return Optional.empty();
    }

    private Optional<User> resolveUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        if (auth.getPrincipal() instanceof User user) {
            return Optional.of(user);
        }
        if (auth.getPrincipal() instanceof UserDetails userDetails) {
            return userRepository.findByEmail(EmailNormalizer.normalize(userDetails.getUsername()));
        }
        if (auth.getName() != null) {
            return userRepository.findByEmail(EmailNormalizer.normalize(auth.getName()));
        }
        return Optional.empty();
    }
}
