package com.bhoomidrishti.auth.oauth;

import com.bhoomidrishti.auth.entity.AuthProvider;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.common.EmailNormalizer;
import com.bhoomidrishti.exception.OAuthAccountLinkingException;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Maps a Google identity onto a local account. Called during the Google callback, before the JWT
 * is issued.
 *
 * <p>Account-linking rules (documented in docs/architecture/authentication.md):
 *
 * <ol>
 *   <li>Known Google {@code sub} → same account, always. Profile image is refreshed.
 *   <li>Email matches an existing account → only a <b>verified</b> Google email may link. A LOCAL
 *       account keeps its password, provider and role and gains the Google id ("soft link").
 *   <li>Google email belongs to a <i>different</i> Google account → rejected (no takeover).
 *   <li>Otherwise → new GOOGLE account with the default registration role.
 * </ol>
 *
 * An unverified Google email can never link to, or create, an account.
 */
@Service
public class GoogleAccountService {

    private static final Logger log = LoggerFactory.getLogger(GoogleAccountService.class);

    private final UserRepository userRepository;

    public GoogleAccountService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User findOrCreate(
            String googleId, String email, boolean emailVerified, String name, String profileImageUrl) {
        if (googleId == null || googleId.isBlank()) {
            throw new OAuthAccountLinkingException("missing_google_id", "Google did not provide an identity");
        }

        // 1) Same Google subject -> same account.
        Optional<User> byGoogleId = userRepository.findByGoogleId(googleId);
        if (byGoogleId.isPresent()) {
            User user = byGoogleId.get();
            user.linkGoogle(googleId, profileImageUrl);
            return userRepository.save(user);
        }

        if (email == null || email.isBlank()) {
            throw new OAuthAccountLinkingException("missing_email", "Google did not provide an email address");
        }
        String normalizedEmail = EmailNormalizer.normalize(email);

        // Everything below is email-based, so the email must be verified by Google.
        if (!emailVerified) {
            throw new OAuthAccountLinkingException(
                    "email_not_verified", "Google reported an unverified email address");
        }

        // 2) Existing account with this email -> link, never duplicate.
        Optional<User> byEmail = userRepository.findByEmail(normalizedEmail);
        if (byEmail.isPresent()) {
            User existing = byEmail.get();
            if (existing.getProvider() == AuthProvider.GOOGLE
                    && existing.getGoogleId() != null
                    && !existing.getGoogleId().equals(googleId)) {
                throw new OAuthAccountLinkingException(
                        "account_conflict", "This email is already linked to a different Google account");
            }
            // LOCAL account (or a GOOGLE row still missing its id): link while password, provider
            // and role stay untouched - never a duplicate row, never a takeover.
            existing.linkGoogle(googleId, profileImageUrl);
            log.info("Linked Google identity to existing {} account for {}", existing.getProvider(), normalizedEmail);
            return userRepository.save(existing);
        }

        // 3) Brand new account.
        String displayName = (name == null || name.isBlank()) ? normalizedEmail : name.trim();
        return userRepository.save(User.registerGoogle(displayName, normalizedEmail, googleId, profileImageUrl));
    }

    /** Extracts the standard OIDC attributes used above, tolerating absent values. */
    public static GoogleIdentity identityFrom(Map<String, Object> attributes) {
        return new GoogleIdentity(
                asText(attributes.get("sub")),
                asText(attributes.get("email")),
                Boolean.TRUE.equals(attributes.get("email_verified")),
                asText(attributes.get("name")),
                asText(attributes.get("picture")));
    }

    private static String asText(Object value) {
        return value instanceof String text ? text : null;
    }

    /** Identity attributes read from the Google OpenID Connect userinfo response. */
    public record GoogleIdentity(String googleId, String email, boolean emailVerified, String name, String picture) {}
}