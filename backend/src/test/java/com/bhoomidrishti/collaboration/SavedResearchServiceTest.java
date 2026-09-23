package com.bhoomidrishti.collaboration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.collaboration.dto.CreateSavedResearchRequest;
import com.bhoomidrishti.collaboration.dto.SavedResearchResponse;
import com.bhoomidrishti.collaboration.entity.SavedResearch;
import com.bhoomidrishti.collaboration.repository.SavedResearchRepository;
import com.bhoomidrishti.collaboration.service.CollaborationSecurityService;
import com.bhoomidrishti.collaboration.service.SavedResearchService;
import com.bhoomidrishti.exception.ResourceNotFoundException;
import com.bhoomidrishti.research.entity.DocumentType;
import com.bhoomidrishti.research.entity.ResearchDocument;
import com.bhoomidrishti.research.repository.ResearchDocumentRepository;
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
class SavedResearchServiceTest {

    @Mock
    private SavedResearchRepository savedResearchRepository;
    @Mock
    private ResearchDocumentRepository researchDocumentRepository;
    @Mock
    private CollaborationSecurityService securityService;

    private SavedResearchService savedResearchService;

    private User userA;
    private User userB;
    private Authentication authA;

    @BeforeEach
    void setUp() {
        savedResearchService = new SavedResearchService(
                savedResearchRepository,
                researchDocumentRepository,
                securityService
        );

        userA = User.registerLocal("User A", "usera@gov.in", "hash");
        ReflectionTestUtils.setField(userA, "id", UUID.randomUUID());

        userB = User.registerLocal("User B", "userb@gov.in", "hash");
        ReflectionTestUtils.setField(userB, "id", UUID.randomUUID());

        authA = new UsernamePasswordAuthenticationToken(userA, null);
    }

    @Test
    void saveResearch_withDocumentSuccess() {
        UUID docId = UUID.randomUUID();
        ResearchDocument doc = new ResearchDocument(
                "Survey Doc", "Desc", DocumentType.GOVERNMENT_REPORT, "Author",
                "Org", null, null, null, "en", "tags", "Abstract", null, userA);
        ReflectionTestUtils.setField(doc, "id", docId);

        when(securityService.requireAuthenticatedUser(authA)).thenReturn(userA);
        when(researchDocumentRepository.findById(docId)).thenReturn(Optional.of(doc));

        when(savedResearchRepository.save(any(SavedResearch.class))).thenAnswer(inv -> {
            SavedResearch sr = inv.getArgument(0);
            ReflectionTestUtils.setField(sr, "id", UUID.randomUUID());
            return sr;
        });

        CreateSavedResearchRequest request = new CreateSavedResearchRequest(
                docId, null, "Interesting Survey", "Review later", "survey,gis");
        SavedResearchResponse response = savedResearchService.saveResearch(request, authA);

        assertThat(response).isNotNull();
        assertThat(response.title()).isEqualTo("Interesting Survey");
        assertThat(response.researchDocumentId()).isEqualTo(docId);
        verify(savedResearchRepository).save(any(SavedResearch.class));
    }

    @Test
    void saveResearch_withChunkOnlySuccess() {
        UUID chunkId = UUID.randomUUID();
        when(securityService.requireAuthenticatedUser(authA)).thenReturn(userA);

        when(savedResearchRepository.save(any(SavedResearch.class))).thenAnswer(inv -> {
            SavedResearch sr = inv.getArgument(0);
            ReflectionTestUtils.setField(sr, "id", UUID.randomUUID());
            return sr;
        });

        CreateSavedResearchRequest request = new CreateSavedResearchRequest(
                null, chunkId, "Key Finding on Alipur", "Check parcel 101", "chunk");
        SavedResearchResponse response = savedResearchService.saveResearch(request, authA);

        assertThat(response).isNotNull();
        assertThat(response.documentChunkId()).isEqualTo(chunkId);
    }

    @Test
    void saveResearch_rejectWhenBothNull() {
        when(securityService.requireAuthenticatedUser(authA)).thenReturn(userA);

        CreateSavedResearchRequest request = new CreateSavedResearchRequest(
                null, null, "Empty Target", "Notes", "tag");

        assertThatThrownBy(() -> savedResearchService.saveResearch(request, authA))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("At least one of researchDocumentId or documentChunkId must be provided");
    }

    @Test
    void getSavedResearch_userIsolation_userACannotReadUserBResearch() {
        UUID srId = UUID.randomUUID();
        when(securityService.requireAuthenticatedUser(authA)).thenReturn(userA);

        // Repository findByIdAndUserId with userA's ID returns empty because it belongs to userB!
        when(savedResearchRepository.findByIdAndUserId(srId, userA.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> savedResearchService.getSavedResearch(srId, authA))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Saved research not found");
    }
}
