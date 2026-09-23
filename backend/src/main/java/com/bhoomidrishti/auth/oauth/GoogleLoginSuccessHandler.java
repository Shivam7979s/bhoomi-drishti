package com.bhoomidrishti.auth.oauth;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.oauth.GoogleAccountService.GoogleIdentity;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.auth.security.AuthCookieService;
import com.bhoomidrishti.auth.security.JwtService;
import com.bhoomidrishti.config.AuthProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

/**
 * After a successful Google callback: issue the application JWT as an HttpOnly cookie and redirect
 * the browser to {@code <frontend>/auth/callback}.
 *
 * <p>Only a short-lived, SameSite=Lax cookie travels back - the JWT is never placed in the redirect
 * URL, so it cannot leak through browser history, the {@code Referer} header or server logs. The
 * redirect target is fixed in configuration, not controllable by the request.
 */
@Component
public class GoogleLoginSuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(GoogleLoginSuccessHandler.class);

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthCookieService cookieService;
    private final AuthProperties authProperties;

    public GoogleLoginSuccessHandler(
            UserRepository userRepository,
            JwtService jwtService,
            AuthCookieService cookieService,
            AuthProperties authProperties) {
        this.userRepository = userRepository;
        this.cookieService = cookieService;
        this.authProperties = authProperties;
        this.jwtService = jwtService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException {
        Optional<User> user = findUser(authentication);
        if (user.isEmpty()) {
            // Should be impossible: GoogleOidcUserService created/linked the account first.
            log.error("Google login succeeded but no local account was found for {}",
                    authentication.getName());
            redirectWithError(response, "login_failed");
            return;
        }
        String token = jwtService.generateToken(user.get());
        response.addHeader(HttpHeaders.SET_COOKIE, cookieService.createAuthCookie(token).toString());
        // Keep the callback page out of the referrer chain of any subsequent navigation.
        response.setHeader("Referrer-Policy", "no-referrer");
        response.sendRedirect(authProperties.frontendBaseUrl() + "/auth/callback");
    }

    private Optional<User> findUser(Authentication authentication) {
        if (authentication.getPrincipal() instanceof OAuth2User oauth2User) {
            GoogleIdentity identity = GoogleAccountService.identityFrom(oauth2User.getAttributes());
            if (identity.googleId() != null) {
                return userRepository.findByGoogleId(identity.googleId());
            }
        }
        return Optional.empty();
    }

    private void redirectWithError(HttpServletResponse response, String code) throws IOException {
        response.sendRedirect(
                authProperties.frontendBaseUrl() + "/auth/callback?error=" + code);
    }
}