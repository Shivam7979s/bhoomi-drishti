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
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
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
                        // Phase 3: land records. Anyone signed in can read/search/spatial-query;
                        // only GOVERNMENT_OFFICIAL and ADMIN can create or modify; DELETE is ADMIN-only.
                        // These URL rules are backed by @PreAuthorize annotations on the controller.
                        .requestMatchers("/api/land-records/spatial/**")
                                .authenticated()
                        .requestMatchers("/api/land-records/{id}")
                                .authenticated()
                        .requestMatchers("/api/land-records")
                                .authenticated()
                        // Phase 4: Research Hub.
                        // Public access is strictly limited to GET operations (service enforces PUBLISHED only for public).
                        // Writes, updates, deletes, and linking endpoints require authentication and RBAC.
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/research-documents", "/api/research-documents/**")
                                .permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/land-records/*/research-documents")
                                .permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/research-documents/**")
                                .authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/research-documents/**")
                                .authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/research-documents/**")
                                .authenticated()
                        // Everything else needs a signed-in user. Fine-grained rules for the
                        // modules of later phases are added here as those endpoints appear.
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(userInfo -> userInfo
                                .oidcUserService(googleOidcUserService))
                        .successHandler(successHandler)
                        .failureHandler(failureHandler))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }
}
