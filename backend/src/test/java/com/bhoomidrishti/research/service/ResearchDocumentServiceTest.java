package com.bhoomidrishti.research.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.exception.LandRecordNotFoundException;
import com.bhoomidrishti.exception.ResearchDocumentNotFoundException;
import com.bhoomidrishti.landrecord.entity.LandRecord;
import com.bhoomidrishti.landrecord.repository.LandRecordRepository;
import com.bhoomidrishti.research.dto.CreateResearchDocumentRequest;
import com.bhoomidrishti.research.dto.ResearchDocumentResponse;
import com.bhoomidrishti.research.dto.UpdateResearchDocumentRequest;
import com.bhoomidrishti.research.entity.DocumentType;
import com.bhoomidrishti.research.entity.ResearchDocument;
import com.bhoomidrishti.research.entity.ResearchDocumentStatus;
import com.bhoomidrishti.research.repository.ResearchDocumentRepository;
import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ResearchDocumentServiceTest {

    @Mock
    private ResearchDocumentRepository repository;

    @Mock
    private LandRecordRepository landRecordRepository;

    @Mock
    private UserRepository userRepository;

    private ResearchDocumentService service;

    @BeforeEach
    void setUp() {
        service = new ResearchDocumentService(repository, landRecordRepository, userRepository);
    }

    @Test
    void publicUserCannotReadDraftDocument() {
        UUID docId = UUID.randomUUID();
        ResearchDocument draftDoc = new ResearchDocument(
                "Draft Document", "Desc", DocumentType.RESEARCH_PAPER, "Author",
                "Org", LocalDate.now(), null, null, "en", "kw", "abstract",
                ResearchDocumentStatus.DRAFT, null);
        ReflectionTestUtils.setField(draftDoc, "id", docId);

        when(repository.findById(docId)).thenReturn(Optional.of(draftDoc));

        assertThatThrownBy(() -> service.getById(docId, null))
                .isInstanceOf(ResearchDocumentNotFoundException.class)
                .hasMessageContaining(docId.toString());
    }

    @Test
    void publicUserCannotReadArchivedDocument() {
        UUID docId = UUID.randomUUID();
        ResearchDocument archivedDoc = new ResearchDocument(
                "Archived Document", "Desc", DocumentType.POLICY_DOCUMENT, "Author",
                "Org", LocalDate.now(), null, null, "en", "kw", "abstract",
                ResearchDocumentStatus.ARCHIVED, null);
        ReflectionTestUtils.setField(archivedDoc, "id", docId);

        when(repository.findById(docId)).thenReturn(Optional.of(archivedDoc));

        Authentication publicAuth = authFor(createUser(UUID.randomUUID(), Role.PUBLIC));

        assertThatThrownBy(() -> service.getById(docId, publicAuth))
                .isInstanceOf(ResearchDocumentNotFoundException.class)
                .hasMessageContaining(docId.toString());
    }

    @Test
    void creatorCanReadOwnDraftDocument() {
        UUID creatorId = UUID.randomUUID();
        User creator = createUser(creatorId, Role.RESEARCHER);
        UUID docId = UUID.randomUUID();

        ResearchDocument draftDoc = new ResearchDocument(
                "Draft Document", "Desc", DocumentType.RESEARCH_PAPER, "Author",
                "Org", LocalDate.now(), null, null, "en", "kw", "abstract",
                ResearchDocumentStatus.DRAFT, creator);
        ReflectionTestUtils.setField(draftDoc, "id", docId);

        when(repository.findById(docId)).thenReturn(Optional.of(draftDoc));

        Authentication creatorAuth = authFor(creator);
        ResearchDocumentResponse response = service.getById(docId, creatorAuth);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(docId);
        assertThat(response.status()).isEqualTo(ResearchDocumentStatus.DRAFT);
    }

    @Test
    void researcherCannotUpdateAnotherUsersDocument() {
        UUID ownerId = UUID.randomUUID();
        User owner = createUser(ownerId, Role.RESEARCHER);

        UUID docId = UUID.randomUUID();
        ResearchDocument doc = new ResearchDocument(
                "Original Title", "Desc", DocumentType.RESEARCH_PAPER, "Author",
                "Org", LocalDate.now(), null, null, "en", "kw", "abstract",
                ResearchDocumentStatus.DRAFT, owner);
        ReflectionTestUtils.setField(doc, "id", docId);

        when(repository.findById(docId)).thenReturn(Optional.of(doc));

        UUID attackerId = UUID.randomUUID();
        User attacker = createUser(attackerId, Role.RESEARCHER);
        Authentication attackerAuth = authFor(attacker);

        UpdateResearchDocumentRequest updateReq = new UpdateResearchDocumentRequest(
                "New Title", "New Desc", DocumentType.RESEARCH_PAPER, "Author",
                "Org", LocalDate.now(), null, null, "en", "kw", "abstract",
                ResearchDocumentStatus.PUBLISHED);

        assertThatThrownBy(() -> service.update(docId, updateReq, attackerAuth))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("You can only modify documents you created");
    }

    @Test
    void academiaCannotUpdateAnotherUsersDocument() {
        UUID ownerId = UUID.randomUUID();
        User owner = createUser(ownerId, Role.ACADEMIA);

        UUID docId = UUID.randomUUID();
        ResearchDocument doc = new ResearchDocument(
                "Original Academic Title", "Desc", DocumentType.ACADEMIC_PUBLICATION, "Author",
                "Org", LocalDate.now(), null, null, "en", "kw", "abstract",
                ResearchDocumentStatus.DRAFT, owner);
        ReflectionTestUtils.setField(doc, "id", docId);

        when(repository.findById(docId)).thenReturn(Optional.of(doc));

        UUID otherAcademicId = UUID.randomUUID();
        User otherAcademic = createUser(otherAcademicId, Role.ACADEMIA);
        Authentication otherAuth = authFor(otherAcademic);

        UpdateResearchDocumentRequest updateReq = new UpdateResearchDocumentRequest(
                "Modified Title", "New Desc", DocumentType.ACADEMIC_PUBLICATION, "Author",
                "Org", LocalDate.now(), null, null, "en", "kw", "abstract",
                ResearchDocumentStatus.DRAFT);

        assertThatThrownBy(() -> service.update(docId, updateReq, otherAuth))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("You can only modify documents you created");
    }

    @Test
    void researcherCanUpdateOwnDocument() {
        UUID ownerId = UUID.randomUUID();
        User owner = createUser(ownerId, Role.RESEARCHER);

        UUID docId = UUID.randomUUID();
        ResearchDocument doc = new ResearchDocument(
                "Original Title", "Desc", DocumentType.RESEARCH_PAPER, "Author",
                "Org", LocalDate.now(), null, null, "en", "kw", "abstract",
                ResearchDocumentStatus.DRAFT, owner);
        ReflectionTestUtils.setField(doc, "id", docId);

        when(repository.findById(docId)).thenReturn(Optional.of(doc));
        when(repository.save(any(ResearchDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Authentication ownerAuth = authFor(owner);

        UpdateResearchDocumentRequest updateReq = new UpdateResearchDocumentRequest(
                "Updated Title", "Updated Desc", DocumentType.RESEARCH_PAPER, "New Author",
                "New Org", LocalDate.now(), null, null, "en", "kw", "abstract",
                ResearchDocumentStatus.PUBLISHED);

        ResearchDocumentResponse updated = service.update(docId, updateReq, ownerAuth);

        assertThat(updated.title()).isEqualTo("Updated Title");
        assertThat(updated.status()).isEqualTo(ResearchDocumentStatus.PUBLISHED);
    }

    @Test
    void governmentOfficialCanUpdateAnyDocument() {
        UUID ownerId = UUID.randomUUID();
        User owner = createUser(ownerId, Role.RESEARCHER);

        UUID docId = UUID.randomUUID();
        ResearchDocument doc = new ResearchDocument(
                "Researcher Title", "Desc", DocumentType.RESEARCH_PAPER, "Author",
                "Org", LocalDate.now(), null, null, "en", "kw", "abstract",
                ResearchDocumentStatus.DRAFT, owner);
        ReflectionTestUtils.setField(doc, "id", docId);

        when(repository.findById(docId)).thenReturn(Optional.of(doc));
        when(repository.save(any(ResearchDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User official = createUser(UUID.randomUUID(), Role.GOVERNMENT_OFFICIAL);
        Authentication officialAuth = authFor(official);

        UpdateResearchDocumentRequest updateReq = new UpdateResearchDocumentRequest(
                "Official Review Title", "Desc", DocumentType.RESEARCH_PAPER, "Author",
                "Org", LocalDate.now(), null, null, "en", "kw", "abstract",
                ResearchDocumentStatus.PUBLISHED);

        ResearchDocumentResponse result = service.update(docId, updateReq, officialAuth);
        assertThat(result.title()).isEqualTo("Official Review Title");
    }

    @Test
    void nonAdminCannotDeleteDocument() {
        UUID docId = UUID.randomUUID();
        User official = createUser(UUID.randomUUID(), Role.GOVERNMENT_OFFICIAL);
        Authentication officialAuth = authFor(official);

        assertThatThrownBy(() -> service.delete(docId, officialAuth))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only ADMIN can delete research documents");
    }

    @Test
    void adminCanDeleteDocument() {
        UUID docId = UUID.randomUUID();
        ResearchDocument doc = new ResearchDocument(
                "To Delete", "Desc", DocumentType.RESEARCH_PAPER, "Author",
                "Org", LocalDate.now(), null, null, "en", "kw", "abstract",
                ResearchDocumentStatus.DRAFT, null);
        ReflectionTestUtils.setField(doc, "id", docId);

        when(repository.findById(docId)).thenReturn(Optional.of(doc));

        User admin = createUser(UUID.randomUUID(), Role.ADMIN);
        Authentication adminAuth = authFor(admin);

        service.delete(docId, adminAuth);

        verify(repository).delete(doc);
    }

    @Test
    void linkingThrowsWhenLandRecordNotFound() {
        UUID docId = UUID.randomUUID();
        UUID lrId = UUID.randomUUID();

        ResearchDocument doc = new ResearchDocument(
                "Doc", "Desc", DocumentType.RESEARCH_PAPER, "Author",
                "Org", LocalDate.now(), null, null, "en", "kw", "abstract",
                ResearchDocumentStatus.DRAFT, null);
        ReflectionTestUtils.setField(doc, "id", docId);

        when(repository.findById(docId)).thenReturn(Optional.of(doc));
        when(landRecordRepository.findById(lrId)).thenReturn(Optional.empty());

        User admin = createUser(UUID.randomUUID(), Role.ADMIN);
        Authentication adminAuth = authFor(admin);

        assertThatThrownBy(() -> service.linkLandRecord(docId, lrId, adminAuth))
                .isInstanceOf(LandRecordNotFoundException.class)
                .hasMessageContaining(lrId.toString());
    }

    @Test
    void linkingThrowsWhenResearchDocumentNotFound() {
        UUID docId = UUID.randomUUID();
        UUID lrId = UUID.randomUUID();

        when(repository.findById(docId)).thenReturn(Optional.empty());

        User admin = createUser(UUID.randomUUID(), Role.ADMIN);
        Authentication adminAuth = authFor(admin);

        assertThatThrownBy(() -> service.linkLandRecord(docId, lrId, adminAuth))
                .isInstanceOf(ResearchDocumentNotFoundException.class)
                .hasMessageContaining(docId.toString());
    }

    @Test
    void researcherCanLinkAndUnlinkLandRecordToOwnDocument() {
        UUID researcherId = UUID.randomUUID();
        User researcher = createUser(researcherId, Role.RESEARCHER);

        UUID docId = UUID.randomUUID();
        ResearchDocument doc = new ResearchDocument(
                "Doc", "Desc", DocumentType.RESEARCH_PAPER, "Author",
                "Org", LocalDate.now(), null, null, "en", "kw", "abstract",
                ResearchDocumentStatus.DRAFT, researcher);
        ReflectionTestUtils.setField(doc, "id", docId);

        UUID lrId = UUID.randomUUID();
        LandRecord lr = new LandRecord();
        ReflectionTestUtils.setField(lr, "id", lrId);

        when(repository.findById(docId)).thenReturn(Optional.of(doc));
        when(landRecordRepository.findById(lrId)).thenReturn(Optional.of(lr));
        when(repository.save(any(ResearchDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Authentication auth = authFor(researcher);

        ResearchDocumentResponse linked = service.linkLandRecord(docId, lrId, auth);
        assertThat(doc.getLinkedLandRecords()).contains(lr);

        ResearchDocumentResponse unlinked = service.unlinkLandRecord(docId, lrId, auth);
        assertThat(doc.getLinkedLandRecords()).doesNotContain(lr);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private User createUser(UUID id, Role role) {
        User u = User.registerLocal("User " + role.name(), role.name().toLowerCase() + "@test.org", "pwd");
        ReflectionTestUtils.setField(u, "id", id);
        u.changeRole(role);
        return u;
    }

    private Authentication authFor(User user) {
        return new UsernamePasswordAuthenticationToken(user, null, user.getRole().authorities());
    }
}
