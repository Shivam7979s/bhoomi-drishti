package com.bhoomidrishti.auth.security;

import com.bhoomidrishti.auth.entity.User;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Creates and verifies the application's HS256 access tokens (Nimbus JOSE + JWT, the library that
 * ships with Spring Security OAuth2).
 *
 * <p>Configuration comes from the environment ({@code JWT_SECRET}, {@code JWT_EXPIRATION}) via
 * {@code app.jwt.*} in {@code application.yml}. Startup fails fast if the secret is missing or
 * shorter than 32 bytes, because a weak signing key would let anyone forge tokens.
 *
 * <p>Claims: {@code sub} = user id (UUID), {@code email}, {@code name}, {@code role}, {@code iat},
 * {@code exp}. Verification checks the signature and the expiry; anything unreadable is reported as
 * {@code empty} rather than thrown, so a bad token simply means "not authenticated".
 */
@Component
public class JwtService {

    /** 256-bit minimum for HMAC-SHA256. */
    private static final int MIN_SECRET_LENGTH_BYTES = 32;

    private final SecretKeySpec signingKey;
    private final long expirationSeconds;

    public JwtService(
            @Value("${app.jwt.secret:}") String secret,
            @Value("${app.jwt.expiration-seconds:86400}") long expirationSeconds) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "app.jwt.secret (JWT_SECRET) is not configured. Set JWT_SECRET in the .env file - "
                            + "see .env.example.");
        }
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < MIN_SECRET_LENGTH_BYTES) {
            throw new IllegalStateException(
                    "app.jwt.secret (JWT_SECRET) must be at least 32 characters long. Generate a random "
                            + "value, for example: powershell -c \"[guid]::NewGuid().ToString('N')+"
                            + "[guid]::NewGuid().ToString('N')\"");
        }
        if (expirationSeconds <= 0) {
            throw new IllegalStateException("app.jwt.expiration-seconds (JWT_EXPIRATION) must be positive");
        }
        this.signingKey = new SecretKeySpec(secretBytes, "HmacSHA256");
        this.expirationSeconds = expirationSeconds;
    }

    /** Issues a token for an account. Only called after the account was authenticated. */
    public String generateToken(User user) {
        Instant now = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("name", user.getName())
                .claim("role", user.getRole().name())
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusSeconds(expirationSeconds)))
                .build();
        try {
            SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
            jwt.sign(new MACSigner(signingKey.getEncoded()));
            return jwt.serialize();
        } catch (JOSEException e) {
            throw new IllegalStateException("Could not sign the authentication token", e);
        }
    }

    /** Returns the claims of a valid, unexpired token, or empty if anything is wrong with it. */
    public Optional<JwtClaims> parse(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        try {
            SignedJWT jwt = SignedJWT.parse(token);
            if (!jwt.verify(new MACVerifier(signingKey.getEncoded()))) {
                return Optional.empty();
            }
            JWTClaimsSet claims = jwt.getJWTClaimsSet();
            Date expiresAt = claims.getExpirationTime();
            if (expiresAt == null || expiresAt.before(new Date())) {
                return Optional.empty();
            }
            String subject = claims.getSubject();
            String role = asString(claims.getClaim("role"));
            if (subject == null || role == null) {
                return Optional.empty();
            }

            return Optional.of(new JwtClaims(UUID.fromString(subject), asString(claims.getClaim("email")), role));
        } catch (ParseException | JOSEException | IllegalArgumentException ex) {
            // Malformed, wrongly signed or expired token: treat as unauthenticated.
            return Optional.empty();
        }
    }

    /** Token lifetime in seconds; used for the session cookie's Max-Age. */
    public long getExpirationSeconds() {
        return expirationSeconds;
    }

    private static String asString(Object value) {
        return value instanceof String text ? text : null;
    }
}