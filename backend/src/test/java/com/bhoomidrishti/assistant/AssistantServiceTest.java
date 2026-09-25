package com.bhoomidrishti.assistant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bhoomidrishti.assistant.dto.AssistantQueryRequestDTO;
import com.bhoomidrishti.assistant.dto.AssistantQueryResponseDTO;
import com.bhoomidrishti.assistant.dto.CitationDTO;
import com.bhoomidrishti.assistant.dto.GroundingStatus;
import com.bhoomidrishti.assistant.service.AssistantService;
import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.exception.AiServiceUnavailableException;
import com.bhoomidrishti.knowledge.client.AiServiceClient;
import com.bhoomidrishti.research.entity.DocumentType;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;

@ExtendWith(MockitoExtension.class)
class AssistantServiceTest {

    @Mock
    private AiServiceClient aiServiceClient;

    private AssistantService assistantService;

    @BeforeEach
    void setUp() {
        assistantService = new AssistantService(aiServiceClient);
    }

    @Test
    void query_blankQuery_throwsIllegalArgumentException() {
        AssistantQueryRequestDTO request = new AssistantQueryRequestDTO("   ", 5, null, null);
        assertThatThrownBy(() -> assistantService.query(request, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Query must not be blank");
    }

    @Test
    void query_nullRequest_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> assistantService.query(null, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void query_anonymousUser_enforcesOnlyPublishedTrue() {
        AssistantQueryRequestDTO request = new AssistantQueryRequestDTO(
                "What are the tribal land transfer restrictions in MP?",
                5,
                DocumentType.LEGAL_DOCUMENT,
                null
        );

        AssistantQueryResponseDTO expectedResponse = new AssistantQueryResponseDTO(
                request.query(),
                "Section 165 restricts transfers [1].",
                GroundingStatus.GROUNDED,
                List.of(new CitationDTO(
                        1,
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        "MP Land Revenue Code 1959",
                        "LEGAL_DOCUMENT",
                        45,
                        "Section 165",
                        "Govt of MP",
                        "Revenue Dept",
                        LocalDate.of(1959, 11, 1),
                        "https://revenue.mp.gov.in",
                        0.85,
                        "Govt of MP (1959). MP Land Revenue Code 1959, p. 45",
                        "Section 165 transfer rules"
                )),
                "Statutory advisory disclaimer",
                Map.of("providerUsed", "extractive_fallback")
        );

        when(aiServiceClient.queryAssistant(eq(request), eq(true), any())).thenReturn(expectedResponse);

        AssistantQueryResponseDTO response = assistantService.query(request, null);

        assertThat(response).isNotNull();
        assertThat(response.groundingStatus()).isEqualTo(GroundingStatus.GROUNDED);
        assertThat(response.citations()).hasSize(1);
        verify(aiServiceClient).queryAssistant(eq(request), eq(true), any());
    }

    @Test
    void query_regularAuthenticatedUser_enforcesOnlyPublishedTrue() {
        AssistantQueryRequestDTO request = new AssistantQueryRequestDTO("General query", 5, null, null);
        Authentication auth = new TestingAuthenticationToken("user@example.com", "pass", Role.RESEARCHER.authority());

        AssistantQueryResponseDTO dummy = new AssistantQueryResponseDTO(
                request.query(), "Answer", GroundingStatus.GROUNDED, List.of(), "", Map.of()
        );
        when(aiServiceClient.queryAssistant(eq(request), eq(true), any())).thenReturn(dummy);

        assistantService.query(request, auth);

        verify(aiServiceClient).queryAssistant(eq(request), eq(true), any());
    }

    @Test
    void query_adminUser_permitsOnlyPublishedFalse() {
        AssistantQueryRequestDTO request = new AssistantQueryRequestDTO("Admin query across drafts", 5, null, null);
        Authentication auth = new TestingAuthenticationToken("admin@example.com", "pass", Role.ADMIN.authority());

        AssistantQueryResponseDTO dummy = new AssistantQueryResponseDTO(
                request.query(), "Answer", GroundingStatus.GROUNDED, List.of(), "", Map.of()
        );
        when(aiServiceClient.queryAssistant(eq(request), eq(false), any())).thenReturn(dummy);

        assistantService.query(request, auth);

        verify(aiServiceClient).queryAssistant(eq(request), eq(false), any());
    }

    @Test
    void query_governmentOfficial_permitsOnlyPublishedFalse() {
        AssistantQueryRequestDTO request = new AssistantQueryRequestDTO("Gov query across drafts", 5, null, null);
        Authentication auth = new TestingAuthenticationToken("gov@example.com", "pass", Role.GOVERNMENT_OFFICIAL.authority());

        AssistantQueryResponseDTO dummy = new AssistantQueryResponseDTO(
                request.query(), "Answer", GroundingStatus.GROUNDED, List.of(), "", Map.of()
        );
        when(aiServiceClient.queryAssistant(eq(request), eq(false), any())).thenReturn(dummy);

        assistantService.query(request, auth);

        verify(aiServiceClient).queryAssistant(eq(request), eq(false), any());
    }

    @Test
    void query_publicUser_enforcesOnlyPublishedTrue() {
        AssistantQueryRequestDTO request = new AssistantQueryRequestDTO("Public land query", 5, null, null);
        Authentication auth = new TestingAuthenticationToken("citizen@example.com", "pass", Role.PUBLIC.authority());

        AssistantQueryResponseDTO dummy = new AssistantQueryResponseDTO(
                request.query(), "Answer", GroundingStatus.GROUNDED, List.of(), "", Map.of()
        );
        when(aiServiceClient.queryAssistant(eq(request), eq(true), any())).thenReturn(dummy);

        assistantService.query(request, auth);

        verify(aiServiceClient).queryAssistant(eq(request), eq(true), any());
    }

    @Test
    void query_academiaUser_enforcesOnlyPublishedTrue() {
        AssistantQueryRequestDTO request = new AssistantQueryRequestDTO("Academic research query", 5, null, null);
        Authentication auth = new TestingAuthenticationToken("prof@university.edu", "pass", Role.ACADEMIA.authority());

        AssistantQueryResponseDTO dummy = new AssistantQueryResponseDTO(
                request.query(), "Answer", GroundingStatus.GROUNDED, List.of(), "", Map.of()
        );
        when(aiServiceClient.queryAssistant(eq(request), eq(true), any())).thenReturn(dummy);

        assistantService.query(request, auth);

        verify(aiServiceClient).queryAssistant(eq(request), eq(true), any());
    }

    @Test
    void query_aiServiceUnavailable_propagatesException() {
        AssistantQueryRequestDTO request = new AssistantQueryRequestDTO("Valid query", 5, null, null);
        when(aiServiceClient.queryAssistant(any(), any(Boolean.class), any()))
                .thenThrow(new AiServiceUnavailableException("AI Knowledge Service is currently unavailable."));

        assertThatThrownBy(() -> assistantService.query(request, null))
                .isInstanceOf(AiServiceUnavailableException.class)
                .hasMessageContaining("AI Knowledge Service is currently unavailable");
    }
}
