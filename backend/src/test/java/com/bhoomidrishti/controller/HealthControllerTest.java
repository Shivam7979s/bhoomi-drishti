package com.bhoomidrishti.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.auth.security.JwtService;
import com.bhoomidrishti.service.HealthService;
import com.bhoomidrishti.testconfig.SecurityTestConfiguration;
import java.util.UUID;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Verifies the Phase 1 health endpoint still works now that Spring Security is active (backward
 * compatibility), plus the CORS behaviour the frontend health check relies on.
 *
 * <p>{@code @WebMvcTest} loads controllers only, so the shared security wiring comes from
 * {@link SecurityTestConfiguration} and the repository is mocked.
 */
@WebMvcTest(HealthController.class)
@Import(SecurityTestConfiguration.class)
class HealthControllerTest {

    /** Default Vite development origin from application.yml, kept in sync with the root .env file. */
    private static final String ALLOWED_DEV_ORIGIN = "http://localhost:5173";
    private static final String SESSION_COOKIE = "bhoomi_auth";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /** Replaces the JPA repository, which is not part of the web slice. */
    @MockitoBean
    private UserRepository userRepository;

    @Test
    void healthEndpointReportsServiceUp() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value(HealthService.SERVICE_NAME));
    }

    @Test
    void healthEndpointAllowsTheViteDevelopmentOrigin() throws Exception {
        mockMvc.perform(options("/api/health")
                        .header(HttpHeaders.ORIGIN, ALLOWED_DEV_ORIGIN)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, ALLOWED_DEV_ORIGIN));
    }

    @Test
    void healthEndpointAlsoWorksWithAnAuthenticatedSessionCookie() throws Exception {
        User user = User.registerLocal("Health Checker", "health@example.com", passwordEncoder.encode("pw-12345678"));
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        String token = jwtService.generateToken(user);

        mockMvc.perform(get("/api/health").cookie(new Cookie(SESSION_COOKIE, token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}

