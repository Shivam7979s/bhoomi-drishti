package com.bhoomidrishti.auth.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

/** JWT generation/verification without a database or network. */
class JwtServiceTest {

    /** Test-only value (public, >= 32 chars). Real secrets live in the git-ignored .env. */
    private static final String TEST_SECRET = "unit-test-only-secret-0123456789-abcdef";

    private final JwtService jwtService = new JwtService(TEST_SECRET, 3600);

    @Test
    void generatesATokenThatParsesBackToTheSameIdentity() {
        User user = User.registerLocal("Shivam", "user@example.com", "$2a$10$examplehashexamplehashexamplehashexamplehashexampleh");
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());

        String token = jwtService.generateToken(user);
        Optional<JwtClaims> claims = jwtService.parse(token);

        assertThat(claims).isPresent();
        assertThat(claims.get().userId()).isEqualTo(user.getId());
        assertThat(claims.get().email()).isEqualTo("user@example.com");
        assertThat(claims.get().role()).isEqualTo(Role.PUBLIC.name());
    }

    @Test
    void rejectsATamperedToken() {
        User user = User.registerLocal("Shivam", "user@example.com", "$2a$10$examplehashexamplehashexamplehashexamplehashexampleh");
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        String token = jwtService.generateToken(user);

        // Corrupt the payload segment (middle part): flip its first character to a different
        // valid Base64URL character. This always changes the signed content, so signature
        // verification must fail even though the token shape stays intact.
        int firstDot = token.indexOf('.');
        char first = token.charAt(firstDot + 1);
        char replacement = first == 'A' ? 'B' : 'A';
        String tampered = token.substring(0, firstDot + 1) + replacement + token.substring(firstDot + 2);

        assertThat(jwtService.parse(tampered)).isEmpty();
    }

    @Test
    void rejectsATokenSignedWithADifferentSecret() {
        User user = User.registerLocal("Shivam", "user@example.com", "$2a$10$examplehashexamplehashexamplehashexamplehashexampleh");
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        String foreignToken = new JwtService("a-completely-different-secret-value-123456", 3600)
                .generateToken(user);

        assertThat(jwtService.parse(foreignToken)).isEmpty();
    }

    @Test
    void rejectsGarbageAndEmptyTokens() {
        assertThat(jwtService.parse(null)).isEmpty();
        assertThat(jwtService.parse("")).isEmpty();
        assertThat(jwtService.parse("not-a-jwt-at-all")).isEmpty();
    }

    @Test
    void refusesToStartWithAMissingOrWeakSecret() {
        assertThatThrownBy(() -> new JwtService("", 3600))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
        assertThatThrownBy(() -> new JwtService("too-short", 3600))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32");
    }

    @Test
    void refusesNonPositiveExpiration() {
        assertThatThrownBy(() -> new JwtService(TEST_SECRET, 0))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("expiration");
    }
}
