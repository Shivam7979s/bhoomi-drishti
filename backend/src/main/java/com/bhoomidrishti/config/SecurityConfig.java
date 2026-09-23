package com.bhoomidrishti.config;

import com.bhoomidrishti.auth.oauth.GoogleLoginFailureHandler;
import com.bhoomidrishti.auth.oauth.GoogleLoginSuccessHandler;
import com.bhoomidrishti.auth.oauth.GoogleOidcUserService;
import com.bhoomidrishti.auth.security.JwtAuthenticationFilter;
import com.bhoomidrishti.auth.security.RestAccessDeniedHandler;
import com.bhoomidrishti.auth.security.RestAuthenticationEntryPoint;
import com.bhoomidrishti.auth.entity.Role;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Central security policy for the whole API (Phase 2: authentication + RBAC).
 *
 * <p>Layers that cooperate: the URL rules below answer 401/403, the JWT filter populates the
 * {@code SecurityContext}, OAuth2 login handles the Google handshake, and the temporary test
 * endpoints additionally carry {@code @PreAuthorize} annotations.
 *
 * <p>CSRF is disabled because the API is stateless - each request authenticates through the signed
 * token itself, and the session cookie is {@code SameSite=Lax}, so cross-site writes never present
 * credentials. Full rationale: docs/architecture/authentication.md.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableConfigurationProperties(AuthProperties.class)
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            RestAuthenticationEntryPoint authenticationEntryPoint,
            RestAccessDeniedHandler accessDeniedHandler,
            GoogleOidcUserService googleOidcUserService,
            GoogleLoginSuccessHandler successHandler,
            GoogleLoginFailureHandler failureHandler)
            throws Exception {
        http
                // Stateless JWT session: no server-side session exists to protect.
                .csrf(AbstractHttpConfigurer::disable)
                // Applies the CorsConfigurationSource bean (explicit origins, credentials allowed).
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Open endpoints: health, email/password auth (logout is idempotent and
                        // only clears a cookie), the Google handshake and the Phase 2 test page.
                        .requestMatchers(
                                "/api/health",
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/logout",
                                "/api/test/public",
                                "/error")
                                .permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**")
                                .permitAll()
                        // Temporary Phase 2 verification endpoints (TestAccessController).
                        .requestMatchers("/api/test/admin")
                                .hasRole(Role.ADMIN.name())
                        .requestMatchers("/api/test/government")
                                .hasAnyRole(Role.GOVERNMENT_OFFICIAL.name(), Role.ADMIN.name())
                        .requestMatchers("/api/test/researcher")
                                .hasAnyRole(Role.RESEARCHER.name(), Role.ACADEMIA.name(), Role.ADMIN.name())
                        .requestMatchers("/api/auth/me", "/api/test/authenticated")
                                .authenticated()
                        // Everything else needs a signed-in user. Fine-grained rules for the
                        // modules of later phases are added here as those endpoints appear.
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .oauth2Login(oauth -> oauth
                        // Google is OpenID Connect: the OIDC user service is the hook that
                        // finds/creates the local account while the callback is processed.
                        .userInfoEndpoint(endpoint -> endpoint.oidcUserService(googleOidcUserService))
                        .successHandler(successHandler)
                        .failureHandler(failureHandler))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    /** Hashes local passwords (strength 10 by default) and verifies them at login. */
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Exposed for email/password login and tests. Spring Security 7 no longer auto-configures an
     * {@code AuthenticationManager}, so it is assembled from the user details service explicitly.
     */
    @Bean
    AuthenticationManager authenticationManager(
            UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }
}
