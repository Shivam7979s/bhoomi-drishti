package com.bhoomidrishti.controller;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.auth.security.JwtService;
import com.bhoomidrishti.config.AuthProperties;
import com.bhoomidrishti.testconfig.SecurityTestConfiguration;
import jakarta.servlet.http.Cookie;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Temporary diagnostic test (deleted before finishing Phase 2). Prints which link of the
 * cookie -> authentication chain fails so the 401 cause can be seen directly instead of guessed.
 */
@WebMvcTest({TestAccessController.class, HealthController.class})
@Import(SecurityTestConfiguration.class)
class TemporaryAuthDiagnosticTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthProperties authProperties;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void diagnoseCookieAuthenticationChain() throws Exception {
        System.out.println("DIAG cookieName from AuthProperties: '" + authProperties.cookieName() + "'");
        System.out.println("DIAG same JwtService instance? filter vs test checked below via token roundtrip");

        User user = User.registerLocal(
                "Test User", "public@example.com", passwordEncoder.encode("x-password1"));
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        System.out.println("DIAG user id: " + user.getId() + " enabled: " + user.isEnabled());

        String token = jwtService.generateToken(user);
        System.out.println("DIAG generated token length: " + token.length());

        System.out.println("DIAG parse of own token: " + jwtService.parse(token));

        org.mockito.Mockito.when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        System.out.println("DIAG direct findById lookup: " + userRepository.findById(user.getId()));

        var result = mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/test/authenticated")
                        .cookie(new Cookie("bhoomi_auth", token)))
                .andReturn();
        var response = result.getResponse();
        System.out.println("DIAG request cookie header: " + result.getRequest().getHeader("Cookie"));
        System.out.println("DIAG response status: " + response.getStatus());
        System.out.println("DIAG response body: " + response.getContentAsString());

        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext()
                        .getAuthentication();
        System.out.println("DIAG SecurityContext after request (test thread): " + auth);
    }
}