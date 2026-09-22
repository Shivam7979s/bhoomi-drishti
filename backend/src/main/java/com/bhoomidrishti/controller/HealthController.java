package com.bhoomidrishti.controller;

import com.bhoomidrishti.dto.HealthResponse;
import com.bhoomidrishti.service.HealthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Read-only endpoints that describe the state of the backend. */
@RestController
@RequestMapping("/api")
public class HealthController {

    private final HealthService healthService;

    public HealthController(HealthService healthService) {
        this.healthService = healthService;
    }

    /**
     * Liveness probe used by the frontend and by local developers.
     *
     * @return always {@code 200 OK} while the application is running
     */
    @GetMapping("/health")
    public HealthResponse health() {
        return healthService.currentHealth();
    }
}
