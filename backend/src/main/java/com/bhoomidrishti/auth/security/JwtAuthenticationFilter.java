package com.bhoomidrishti.auth.security;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.config.AuthProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.security.web.context.DelegatingSecurityContextRepository;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Reads the access token from the HttpOnly session cookie (browser) or the {@code Authorization:
 * Bearer} header (API clients), verifies it, loads the account and puts the authentication into the
 * {@code SecurityContext}.
 *
 * <p>Stateless: nothing is stored server side between requests, the signed token is the whole
 * session. Any problem with a token (bad signature, expired, unknown user, disabled account) just
 * leaves the request unauthenticated - the endpoint's authorization rules then answer with 401.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AuthProperties authProperties;
    private final SecurityContextRepository securityContextRepository =
            new DelegatingSecurityContextRepository(
                    new RequestAttributeSecurityContextRepository(), new HttpSessionSecurityContextRepository());

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository, AuthProperties authProperties) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.authProperties = authProperties;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            resolveToken(request)
                    .flatMap(jwtService::parse)
                    .ifPresent(claims -> authenticate(request, response, claims));
        } catch (Exception ex) {
            // A broken token must never break the request; it simply stays unauthenticated.
            logger.debug("Skipping invalid authentication token", ex);
            SecurityContextHolder.clearContext();
        }
        filterChain.doFilter(request, response);
    }

    private void authenticate(HttpServletRequest request, HttpServletResponse response, JwtClaims claims) {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            return;
        }
        Optional<User> user = userRepository.findById(claims.userId());
        if (user.isEmpty() || !user.get().isEnabled()) {
            return;
        }
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                user.get(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.get().getRole().name())));
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        // Store the context through the repository, not only in the holder: since Spring Security 6
        // the SecurityContextHolderFilter owns a deferred context and overwrites a direct write on
        // its way out. Saving through the repository updates both, so downstream authorization and
        // @PreAuthorize checks see this authentication.
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
    }

    /** Session cookie first (SPA), then the standard bearer header (clients and tests). */
    private Optional<String> resolveToken(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (authProperties.cookieName().equals(cookie.getName())
                        && cookie.getValue() != null
                        && !cookie.getValue().isBlank()) {
                    return Optional.of(cookie.getValue());
                }
            }
        }
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            String token = header.substring(BEARER_PREFIX.length()).trim();
            if (!token.isEmpty()) {
                return Optional.of(token);
            }
        }
        return Optional.empty();
    }
}
