package com.bhoomidrishti.auth.oauth;

import com.bhoomidrishti.config.AuthProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

/**
 * Sends a failed Google login back to {@code <frontend>/auth/callback?error=...} with a small
 * allow-listed error code - never with exception details, tokens or provider messages.
 */
@Component
public class GoogleLoginFailureHandler implements AuthenticationFailureHandler {

    private static final Logger log = LoggerFactory.getLogger(GoogleLoginFailureHandler.class);

    /** Codes the frontend maps to human-readable messages. Anything else becomes login_failed. */
    private static final Set<String> SAFE_ERROR_CODES = Set.of(
            "login_failed",
            "access_denied",
            "missing_email",
            "missing_google_id",
            "email_not_verified",
            "account_conflict");

    private final AuthProperties authProperties;

    public GoogleLoginFailureHandler(AuthProperties authProperties) {
        this.authProperties = authProperties;
    }

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request, HttpServletResponse response, AuthenticationException exception)
            throws IOException {
        String code = "login_failed";
        if (exception instanceof OAuth2AuthenticationException oauth2Exception
                && oauth2Exception.getError() != null
                && SAFE_ERROR_CODES.contains(oauth2Exception.getError().getErrorCode())) {
            code = oauth2Exception.getError().getErrorCode();
        }
        log.warn("Google login failed ({}): {}", code, exception.getMessage());
        response.sendRedirect(authProperties.frontendBaseUrl() + "/auth/callback?error=" + code);
    }
}
