package com.bhoomidrishti.dto;

/**
 * Payload returned by {@code GET /api/health}.
 *
 * @param status  current state of the service, {@code UP} when it is able to answer requests
 * @param service logical name of this service, used by the frontend to confirm that it reached
 *                the right backend
 */
public record HealthResponse(String status, String service) {
}
