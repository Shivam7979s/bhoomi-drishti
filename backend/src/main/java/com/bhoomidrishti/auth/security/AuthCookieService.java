package com.bhoomidrishti.auth.security;

import com.bhoomidrishti.config.AuthProperties;
import java.time.Duration;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * Builds the HttpOnly session cookie used to carry the access token to the browser.
 *
 * <p>HttpOnly keeps the token unreadable from JavaScript (mitigates XSS token theft) and
 * {@code SameSite=Lax} stops cross-site requests from presenting it (mitigates CSRF) - see
 * docs/architecture/authentication.md for the full trade-off analysis.
 */
@Component
public class AuthCookieService {

    private final AuthProperties authProperties;
    private final JwtService jwtService;

    public AuthCookieService(AuthProperties authProperties, JwtService jwtService) {
        this.authProperties = authProperties;
        this.jwtService = jwtService;
    }

    /** Cookie that carries the token for as long as the token itself is valid. */
    public ResponseCookie createAuthCookie(String accessToken) {
        return ResponseCookie.from(authProperties.cookieName(), accessToken)
                .httpOnly(true)
                .secure(authProperties.cookieSecure())
                .sameSite(authProperties.cookieSameSite())
                .path("/")
                .maxAge(Duration.ofSeconds(jwtService.getExpirationSeconds()))
                .build();
    }

    /** Expired cookie that makes the browser drop the session on logout. */
    public ResponseCookie createClearedCookie() {
        return ResponseCookie.from(authProperties.cookieName(), "")
                .httpOnly(true)
                .secure(authProperties.cookieSecure())
                .sameSite(authProperties.cookieSameSite())
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
    }
}
