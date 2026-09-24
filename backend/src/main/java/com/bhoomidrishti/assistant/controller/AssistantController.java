package com.bhoomidrishti.assistant.controller;

import com.bhoomidrishti.assistant.dto.AssistantQueryRequestDTO;
import com.bhoomidrishti.assistant.dto.AssistantQueryResponseDTO;
import com.bhoomidrishti.assistant.service.AssistantService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller exposing the Evidence-Grounded Statutory AI Assistant.
 *
 * <p>Permits public queries while strictly restricting anonymous callers
 * to PUBLISHED research and statutory documents via service-level authorization.
 */
@RestController
@RequestMapping("/api/ai/assistant")
public class AssistantController {

    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    /**
     * Executes evidence-grounded statutory query with quality gate and citation validation.
     */
    @PostMapping("/query")
    public ResponseEntity<AssistantQueryResponseDTO> query(
            @Valid @RequestBody AssistantQueryRequestDTO request,
            Authentication auth) {
        return ResponseEntity.ok(assistantService.query(request, auth));
    }
}
