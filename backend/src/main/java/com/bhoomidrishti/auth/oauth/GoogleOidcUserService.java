package com.bhoomidrishti.auth.oauth;

import com.bhoomidrishti.auth.oauth.GoogleAccountService.GoogleIdentity;
import com.bhoomidrishti.exception.OAuthAccountLinkingException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.stereotype.Component;

/**
 * Google login uses OpenID Connect, so the OIDC user service is the hook Spring Security calls
 * after the callback ({@code userInfoEndpoint().oidcUserService(...)} in {@code SecurityConfig}).
 *
 * <p>Extending {@link OidcUserService} keeps all framework behaviour (ID token validation,
 * userinfo retrieval) and adds one step: resolve or create the local {@code app_user} before the
 * principal is built. Linking problems are rethrown as {@link OAuth2AuthenticationException} so the
 * configured failure handler can turn them into a safe redirect to the frontend.
 */
@Component
public class GoogleOidcUserService extends OidcUserService {

    private final GoogleAccountService googleAccountService;

    public GoogleOidcUserService(GoogleAccountService googleAccountService) {
        this.googleAccountService = googleAccountService;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) {
        // Validates the ID token and loads the Google userinfo response.
        OidcUser oidcUser = super.loadUser(userRequest);
        GoogleIdentity identity = GoogleAccountService.identityFrom(oidcUser.getAttributes());
        try {
            googleAccountService.findOrCreate(
                    identity.googleId(),
                    identity.email(),
                    identity.emailVerified(),
                    identity.name(),
                    identity.picture());
        } catch (OAuthAccountLinkingException ex) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error(ex.getErrorCode(), ex.getMessage(), null), ex.getMessage());
        }
        return oidcUser;
    }
}
