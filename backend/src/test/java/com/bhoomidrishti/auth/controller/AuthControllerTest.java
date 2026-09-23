package com.bhoomidrishti.auth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.auth.security.JwtService;
import com.bhoomidrishti.testconfig.SecurityTestConfiguration;
import java.util.Optional;
import java.util.UUID;
import jakarta.servlet.http.Cookie;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * HTTP-level tests for registration, login and the current-user endpoint (Phase 2 test list
 * items 1-5, 11 and 12). Password verification uses the real BCrypt encoder and the real
 * {@code AuthenticationManager}; only the database is mocked.
 */
@WebMvcTest(AuthController.class)
@Import(SecurityTestConfiguration.class)
class AuthControllerTest {

    private static final String SESSION_COOKIE = "bhoomi_auth";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    // ---------------------------------------------------------------- registration

    @Test
    void registrationSucceedsAndReturnsASafeBody() throws Exception {
        when(userRepository.existsByEmail("shivam@example.com")).thenReturn(false);
        stubSaveWithGeneratedId();

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Shivam","email":"Shivam@Example.com","password":"securePass123"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, Matchers.containsString(SESSION_COOKIE + "=")))
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("shivam@example.com"))
                .andExpect(jsonPath("$.user.role").value("PUBLIC"))
                .andExpect(jsonPath("$.user.provider").value("LOCAL"))
                .andExpect(jsonPath("$.user.password").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).doesNotContain("securePass123");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        String storedHash = captor.getValue().getPasswordHash();
        assertThat(storedHash).startsWith("$2");
        assertThat(storedHash).doesNotContain("securePass123");
        assertThat(passwordEncoder.matches("securePass123", storedHash)).isTrue();
    }

    @Test
    void duplicateEmailIsRejectedWith409() throws Exception {
        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Someone","email":"taken@example.com","password":"securePass123"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("CONFLICT"));

        verify(userRepository, never()).save(any());
    }

    @Test
    void invalidRegistrationPayloadIsRejectedWith400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"","email":"not-an-email","password":"short"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.fieldErrors.name").exists())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    @Test
    void registrationNeverAcceptsARoleFromTheClient() throws Exception {
        when(userRepository.existsByEmail("sneaky@example.com")).thenReturn(false);
        stubSaveWithGeneratedId();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Sneaky","email":"sneaky@example.com","password":"securePass123",
                                 "role":"ADMIN"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("PUBLIC"));
    }

    // ---------------------------------------------------------------- login

    @Test
    void loginSucceedsWithCorrectCredentials() throws Exception {
        when(userRepository.findByEmail("shivam@example.com"))
                .thenReturn(Optional.of(newLocalUser("securePass123")));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"shivam@example.com","password":"securePass123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, Matchers.containsString(SESSION_COOKIE + "=")))
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("shivam@example.com"))
                .andExpect(jsonPath("$.user.role").value("PUBLIC"));
    }

    @Test
    void loginFailsWithIncorrectCredentials() throws Exception {
        when(userRepository.findByEmail("shivam@example.com"))
                .thenReturn(Optional.of(newLocalUser("securePass123")));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"shivam@example.com","password":"wrong-password"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void loginFailsForUnknownEmail() throws Exception {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"ghost@example.com","password":"securePass123"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }
    // ------------------------------------------------ current user / logout

    @Test
    void meReturnsTheAuthenticatedUserWithoutSensitiveFields() throws Exception {
        User user = newLocalUser("securePass123");
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        MvcResult result = mockMvc.perform(get("/api/auth/me")
                        .cookie(new Cookie(SESSION_COOKIE, jwtService.generateToken(user))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(user.getId().toString()))
                .andExpect(jsonPath("$.name").value(user.getName()))
                .andExpect(jsonPath("$.email").value(user.getEmail()))
                .andExpect(jsonPath("$.role").value("PUBLIC"))
                .andExpect(jsonPath("$.provider").value("LOCAL"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.googleId").doesNotExist())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertThat(body).doesNotContain("passwordHash").doesNotContain(user.getPasswordHash());
    }

    @Test
    void meRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Authentication required"));
    }

    @Test
    void logoutClearsTheSessionCookie() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, Matchers.containsString(SESSION_COOKIE + "=;")))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, Matchers.containsString("Max-Age=0")))
                .andExpect(jsonPath("$.message").value("Signed out"));
    }

    // ---------------------------------------------------------------- helpers

    /** The save stub that gives newly registered users an id (normally assigned by Postgres). */
    private void stubSaveWithGeneratedId() {
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
            return user;
        });
    }

    private User newLocalUser(String rawPassword) {
        User user = User.registerLocal("Shivam", "shivam@example.com", passwordEncoder.encode(rawPassword));
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        return user;
    }
}
