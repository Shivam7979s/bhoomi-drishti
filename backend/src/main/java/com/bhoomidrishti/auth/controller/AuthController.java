package com.bhoomidrishti.auth.controller;

import com.bhoomidrishti.auth.dto.AuthResponse;
import com.bhoomidrishti.auth.dto.LoginRequest;
import com.bhoomidrishti.auth.dto.MessageResponse;
import com.bhoomidrishti.auth.dto.RegisterRequest;
import com.bhoomidrishti.auth.dto.UserResponse;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.security.AuthCookieService;
import com.bhoomidrishti.auth.service.AuthService;
import com.bhoomidrishti.exception.InvalidCredentialsException;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseCookie;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Email/password authentication endpoints. Business rules live in {@link AuthService}; this class
 * only validates input, maps status codes and manages the session cookie.
 *
 * <p>Google login does not pass through here - it uses Spring Security's
 * {@code /oauth2/authorization/google} entry point.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService cookieService;

    public AuthController(AuthService authService, AuthCookieService cookieService) {
        this.authService = authService;
        this.cookieService = cookieService;
    }

    /** Creates a {@code PUBLIC} account. The request cannot specify a role. */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        AuthResponse body = authService.register(request);
        addSessionCookie(response, body.accessToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    /** Verifies credentials and starts a session. Always answers 401 on bad credentials. */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthResponse body = authService.login(request);
        addSessionCookie(response, body.accessToken());
        return ResponseEntity.ok(body);
    }

    /** The signed-in account as seen by the API. Never includes password hash or Google id. */
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal User user) {
        if (user == null) {
            // Reached only if the filter authenticated the request without an entity principal.
            throw new InvalidCredentialsException("Authentication required");
        }
        return UserResponse.from(user);
    }

    /**
     * Stateless JWT: clearing the cookie is what ends the browser session. Idempotent, so no
     * authentication is required (a session that is already gone still gets a clean response).
     */
    @PostMapping("/logout")
    public MessageResponse logout(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookieService.createClearedCookie().toString());
        return new MessageResponse("Signed out");
    }

    private void addSessionCookie(HttpServletResponse response, String accessToken) {
        ResponseCookie cookie = cookieService.createAuthCookie(accessToken);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}