package com.bhoomidrishti.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Session-cookie settings bound from the {@code app.auth.*} properties in {@code application.yml}.
 *
 * @param cookieName name of the HttpOnly cookie that carries the access token
 * @param cookieSecure must be {@code true} once the API is served over HTTPS; browsers drop
 *                     Secure cookies on plain http:// so it stays {@code false} for localhost
 * @param cookieSameSite {@code Lax} keeps the cookie on same-site traffic while blocking
 *                       cross-site writes - see docs/architecture/authentication.md
 * @param frontendBaseUrl base URL of the SPA; the Google callback redirects here
 */
@ConfigurationProperties(prefix = "app.auth")
public record AuthProperties(String cookieName, boolean cookieSecure, String cookieSameSite, String frontendBaseUrl) {

    private static final String DEFAULT_COOKIE_NAME = "bhoomi_auth";
    private static final String DEFAULT_SAME_SITE = "Lax";
    private static final String DEFAULT_FRONTEND_BASE_URL = "http://localhost:5173";

    public AuthProperties {
        cookieName = isBlank(cookieName) ? DEFAULT_COOKIE_NAME : cookieName.trim();
        cookieSameSite = isBlank(cookieSameSite) ? DEFAULT_SAME_SITE : cookieSameSite.trim();
        String base = isBlank(frontendBaseUrl) ? DEFAULT_FRONTEND_BASE_URL : frontendBaseUrl.trim();
        frontendBaseUrl = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
