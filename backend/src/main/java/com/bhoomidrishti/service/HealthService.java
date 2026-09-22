package com.bhoomidrishti.service;

import com.bhoomidrishti.dto.HealthResponse;
import org.springframework.stereotype.Service;

/**
 * Reports the health of the backend.
 *
 * <p>Kept as a service (and not inlined in the controller) so that future checks - for example
 * database connectivity - have an obvious home and can be unit tested without the web layer.
 */
@Service
public class HealthService {

    /** Name exposed to clients so they can verify which service answered. */
    public static final String SERVICE_NAME = "bhoomi-drishti-backend";

    private static final String STATUS_UP = "UP";

    public HealthResponse currentHealth() {
        return new HealthResponse(STATUS_UP, SERVICE_NAME);
    }
}
