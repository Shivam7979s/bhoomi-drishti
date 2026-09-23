package com.bhoomidrishti.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.auth.security.JwtService;
import com.bhoomidrishti.testconfig.SecurityTestConfiguration;
import java.util.Optional;
import java.util.UUID;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Proves role-based access control end to end with real tokens (Phase 2 test list items 6-10).
 *
 * <p>Each test signs a JWT for one role, sends it as the session cookie and checks the status the
 * rules in {@code SecurityConfig} produce: 401 without a token, 403 with the wrong role, 200 with
 * the right one.
 */
@WebMvcTest({TestAccessController.class, HealthController.class})
@Import(SecurityTestConfiguration.class)
class RbacEndpointTest {

    private static final String SESSION_COOKIE = "bhoomi_auth";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void publicEndpointWorksWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/test/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endpoint").value("public"));
    }

    @Test
    void protectedEndpointRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/test/authenticated"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.path").value("/api/test/authenticated"));
    }

    @Test
    void protectedEndpointAcceptsAnyAuthenticatedRole() throws Exception {
        mockMvc.perform(get("/api/test/authenticated").cookie(sessionCookieFor(Role.PUBLIC)))
                .andExpect(status().isOk());
    }

    @Test
    void forgedOrMalformedTokenIsTreatedAsUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/test/authenticated").cookie(new Cookie(SESSION_COOKIE, "not.a.valid.jwt")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void researcherEndpointRejectsPublicUser() throws Exception {
        mockMvc.perform(get("/api/test/researcher").cookie(sessionCookieFor(Role.PUBLIC)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("Insufficient permissions"));
    }

    @Test
    void researcherEndpointAcceptsResearcher() throws Exception {
        mockMvc.perform(get("/api/test/researcher").cookie(sessionCookieFor(Role.RESEARCHER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endpoint").value("researcher"));
    }

    @Test
    void governmentEndpointRejectsResearcherButAcceptsOfficial() throws Exception {
        mockMvc.perform(get("/api/test/government").cookie(sessionCookieFor(Role.RESEARCHER)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/test/government").cookie(sessionCookieFor(Role.GOVERNMENT_OFFICIAL)))
                .andExpect(status().isOk());
    }

    @Test
    void adminEndpointRejectsNonAdminButAcceptsAdmin() throws Exception {
        mockMvc.perform(get("/api/test/admin").cookie(sessionCookieFor(Role.GOVERNMENT_OFFICIAL)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
        mockMvc.perform(get("/api/test/admin").cookie(sessionCookieFor(Role.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endpoint").value("admin"));
    }

    /**
     * Signs a token for an in-memory user; the repository mock answers {@code findById} with the
     * same user, exactly what the JWT filter does at runtime.
     */
    private Cookie sessionCookieFor(Role role) {
        User user = User.registerLocal(
                "Test User", role.name().toLowerCase() + "@example.com", passwordEncoder.encode("x-password1"));
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        user.changeRole(role);
        org.mockito.Mockito.when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        return new Cookie(SESSION_COOKIE, jwtService.generateToken(user));
    }
}
