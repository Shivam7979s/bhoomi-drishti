package com.bhoomidrishti.exception;

import com.bhoomidrishti.common.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Converts every handled failure into the single {@link ApiError} structure used by the whole API.
 *
 * <p>Status mapping: 400 invalid request, 401 unauthenticated, 403 not allowed, 409 duplicate
 * account, 500 everything else. Stack traces are logged but never sent to the client.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(
                    fieldError.getField(),
                    Optional.ofNullable(fieldError.getDefaultMessage()).orElse("is invalid"));
        }
        return respond(HttpStatus.BAD_REQUEST, "Validation failed", request, fieldErrors);
    }


    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            org.springframework.http.converter.HttpMessageConversionException.class
    })
    public ResponseEntity<ApiError> handleUnreadableBody(Exception ex, HttpServletRequest request) {
        Throwable cause = ex.getCause();
        while (cause != null) {
            if (cause instanceof InvalidGeometryException ige) {
                return respond(HttpStatus.BAD_REQUEST, ige.getMessage(), request, null);
            }
            cause = cause.getCause();
        }
        return respond(HttpStatus.BAD_REQUEST, "Request body is missing or malformed", request, null);
    }

    @ExceptionHandler(InvalidGeometryException.class)
    public ResponseEntity<ApiError> handleInvalidGeometry(InvalidGeometryException ex, HttpServletRequest request) {
        return respond(HttpStatus.BAD_REQUEST, ex.getMessage(), request, null);
    }

    @ExceptionHandler(LandRecordNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(LandRecordNotFoundException ex, HttpServletRequest request) {
        return respond(HttpStatus.NOT_FOUND, ex.getMessage(), request, null);
    }

    @ExceptionHandler(ResearchDocumentNotFoundException.class)
    public ResponseEntity<ApiError> handleResearchDocumentNotFound(ResearchDocumentNotFoundException ex, HttpServletRequest request) {
        return respond(HttpStatus.NOT_FOUND, ex.getMessage(), request, null);
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiError> handleDuplicateEmail(EmailAlreadyExistsException ex, HttpServletRequest request) {
        return respond(HttpStatus.CONFLICT, ex.getMessage(), request, null);
    }

    /** The unique constraint on {@code app_user.email} is the authority when registrations race. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Data integrity violation on {}: {}", request.getRequestURI(), ex.getMostSpecificCause().getMessage());
        return respond(HttpStatus.CONFLICT, "The resource already exists", request, null);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiError> handleInvalidCredentials(InvalidCredentialsException ex, HttpServletRequest request) {
        return respond(HttpStatus.UNAUTHORIZED, ex.getMessage(), request, null);
    }

    /** Security failures that reach the advice instead of the security filter chain. */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthenticationException(AuthenticationException ex, HttpServletRequest request) {
        return respond(HttpStatus.UNAUTHORIZED, "Authentication required", request, null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return respond(HttpStatus.FORBIDDEN, "Insufficient permissions", request, null);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> handleMethodNotAllowed(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        return respond(HttpStatus.METHOD_NOT_ALLOWED, "Method not allowed", request, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled error on {} {}", request.getMethod(), safePath(request), ex);
        return respond(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", request, null);
    }

    private ResponseEntity<ApiError> respond(
            HttpStatus status, String message, HttpServletRequest request, Map<String, String> fieldErrors) {
        String path = safePath(request);
        ApiError body = fieldErrors == null || fieldErrors.isEmpty()
                ? ApiError.of(status, message, path)
                : ApiError.of(status, message, path, fieldErrors);
        return ResponseEntity.status(status).body(body);
    }

    /** Drops the query string so reflected values can never end up in the error body. */
    private String safePath(HttpServletRequest request) {
        return UriComponentsBuilder.fromPath(request.getRequestURI()).build().toUriString();
    }
}
