package com.bhoomidrishti.controller;

import com.bhoomidrishti.auth.entity.Role;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * TEMPORARY development/test endpoints for Phase 2.
 *
 * <p>They exist only to prove that role-based access control works end to end (issue a token for a
 * role, call an endpoint, observe 200/401/403). They return static messages, contain no business
 * logic and will be deleted when the real modules arrive.
 *
 * <p>The authorization rules live as URL rules in {@code SecurityConfig} - this class carries no
 * security annotations of its own.
 */
@RestController
@RequestMapping("/api/test")
public class TestAccessController {

    public record TestAccessResponse(String endpoint, String message, Role requiredRole) {}

    /** Open to everyone - mirrors the public pages of later phases. */
    @GetMapping("/public")
    public TestAccessResponse publicEndpoint() {
        return new TestAccessResponse(
                "public", "Open to everyone - no authentication required.", null);
    }

    /** Any signed-in user, whatever their role. */
    @GetMapping("/authenticated")
    @PreAuthorize("isAuthenticated()")
    public TestAccessResponse authenticatedEndpoint() {
        return new TestAccessResponse(
                "authenticated", "Any authenticated user may call this endpoint.", null);
    }

    /** Research-facing functionality (RESEARCHER, ACADEMIA; ADMIN may also pass). */
    @GetMapping("/researcher")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'ACADEMIA', 'ADMIN')")
    public TestAccessResponse researcherEndpoint() {
        return new TestAccessResponse(
                "researcher", "Requires RESEARCHER or ACADEMIA (ADMIN also allowed).", null);
    }

    /** Government/policy functionality (GOVERNMENT_OFFICIAL; ADMIN may also pass). */
    @GetMapping("/government")
    @PreAuthorize("hasAnyRole('GOVERNMENT_OFFICIAL', 'ADMIN')")
    public TestAccessResponse governmentEndpoint() {
        return new TestAccessResponse(
                "government", "Requires GOVERNMENT_OFFICIAL (ADMIN also allowed).", null);
    }

    /** Full administrative access. */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public TestAccessResponse adminEndpoint() {
        return new TestAccessResponse("admin", "Requires ADMIN.", Role.ADMIN);
    }
}