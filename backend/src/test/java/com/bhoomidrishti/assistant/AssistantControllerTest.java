package com.bhoomidrishti.assistant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bhoomidrishti.assistant.controller.AssistantController;
import com.bhoomidrishti.assistant.dto.AssistantQueryRequestDTO;
import com.bhoomidrishti.assistant.dto.AssistantQueryResponseDTO;
import com.bhoomidrishti.assistant.dto.CitationDTO;
import com.bhoomidrishti.assistant.dto.GroundingStatus;
import com.bhoomidrishti.assistant.service.AssistantService;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.auth.security.JwtService;
import com.bhoomidrishti.exception.AiServiceUnavailableException;
import com.bhoomidrishti.testconfig.SecurityTestConfiguration;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AssistantController.class)
@Import(SecurityTestConfiguration.class)
class AssistantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private AssistantService assistantService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void query_anonymousCaller_success() throws Exception {
        CitationDTO citation = new CitationDTO(
                1,
                UUID.randomUUID(),
                UUID.randomUUID(),
                "MP Land Revenue Code 1959",
                "LEGAL_DOCUMENT",
                45,
                "Section 165",
                "Government of MP",
                "Revenue Department",
                LocalDate.of(1959, 11, 1),
                "https://revenue.mp.gov.in",
                0.8523,
                "Government of MP (1959). MP Land Revenue Code 1959, p. 45",
                "Section 165 regulates transfers."
        );

        AssistantQueryResponseDTO responseDTO = new AssistantQueryResponseDTO(
                "What are tribal transfer restrictions in MP?",
                "Under Section 165, tribal land transfers require prior collector permission [1].",
                GroundingStatus.GROUNDED,
                List.of(citation),
                "Informational statutory advisory",
                Map.of(
                        "retrievalDurationMs", 25,
                        "synthesisDurationMs", 120,
                        "totalDurationMs", 145,
                        "providerUsed", "extractive_fallback",
                        "citationCount", 1
                )
        );

        when(assistantService.query(any(AssistantQueryRequestDTO.class), any())).thenReturn(responseDTO);

        mockMvc.perform(post("/api/ai/assistant/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "query": "What are tribal transfer restrictions in MP?",
                                    "topK": 5
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.query").value("What are tribal transfer restrictions in MP?"))
                .andExpect(jsonPath("$.answer").value("Under Section 165, tribal land transfers require prior collector permission [1]."))
                .andExpect(jsonPath("$.groundingStatus").value("GROUNDED"))
                .andExpect(jsonPath("$.citations").isArray())
                .andExpect(jsonPath("$.citations[0].citationIndex").value(1))
                .andExpect(jsonPath("$.citations[0].documentTitle").value("MP Land Revenue Code 1959"))
                .andExpect(jsonPath("$.citations[0].sectionTitle").value("Section 165"))
                .andExpect(jsonPath("$.disclaimer").value("Informational statutory advisory"))
                .andExpect(jsonPath("$.retrievalMetadata.providerUsed").value("extractive_fallback"))
                .andExpect(jsonPath("$.confidenceScore").doesNotExist()); // STRICT REQUIREMENT: No fake confidence score
    }

    @Test
    void query_blankQuery_returns400BadRequest() throws Exception {
        mockMvc.perform(post("/api/ai/assistant/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "query": "   ",
                                    "topK": 5
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void query_tooShortQuery_returns400BadRequest() throws Exception {
        mockMvc.perform(post("/api/ai/assistant/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "query": "a",
                                    "topK": 5
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void query_tooLongQuery_returns400BadRequest() throws Exception {
        String longQuery = "a".repeat(501);
        mockMvc.perform(post("/api/ai/assistant/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"query\": \"%s\"}", longQuery)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void query_aiServiceUnavailable_returns503ServiceUnavailable() throws Exception {
        when(assistantService.query(any(), any()))
                .thenThrow(new AiServiceUnavailableException("AI Knowledge Service is currently unavailable."));

        mockMvc.perform(post("/api/ai/assistant/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "query": "Valid statutory question?"
                                }
                                """))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("SERVICE_UNAVAILABLE"))
                .andExpect(jsonPath("$.message").value("AI Knowledge Service is currently unavailable."));
    }
}
