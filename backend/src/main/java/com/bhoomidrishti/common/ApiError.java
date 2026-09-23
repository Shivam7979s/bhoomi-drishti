package com.bhoomidrishti.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpStatus;

/**
 * Consistent error body returned by every failing request.
 *
 * <pre>
 * {
 *   "timestamp": "2026-01-01T10:15:30Z",
 *   "status": 401,
 *   "error": "UNAUTHORIZED",
 *   "message": "Authentication required",
 *   "path": "/api/auth/me"
 * }
 * </pre>
 *
 * <p>{@code fieldErrors} is added for validation failures only and is omitted otherwise. Internal
 * details (stack traces, exception class names, SQL) are never exposed.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fieldErrors) {

    public static ApiError of(HttpStatus status, String message, String path) {
        return new ApiError(Instant.now(), status.value(), status.name(), message, path, Map.of());
    }

    public static ApiError of(HttpStatus status, String message, String path, Map<String, String> fieldErrors) {
        return new ApiError(Instant.now(), status.value(), status.name(), message, path, fieldErrors);
    }

    /** The {@code error} value is derived from the status so both stay in sync. */
    public static ApiError unauthorized(String message, String path) {
        return of(HttpStatus.UNAUTHORIZED, message, path);
    }

    public static ApiError forbidden(String message, String path) {
        return of(HttpStatus.FORBIDDEN, message, path);
    }
}
