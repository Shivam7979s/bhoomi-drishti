package com.bhoomidrishti.auth.oauth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bhoomidrishti.auth.entity.AuthProvider;
import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.exception.OAuthAccountLinkingException;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

/** Account-linking rules with stubbed Google userinfo data: no live login, no network, no DB. */
class GoogleAccountServiceTest {

    private static final String GOOGLE_ID = "google-sub-1";
    private static final String EMAIL = "user@example.com";
    private static final String HASH = "$2a$10$examplehashexamplehashexamplehashexamplehashexampleh";

    private UserRepository userRepository;
    private GoogleAccountService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        service = new GoogleAccountService(userRepository);
    }

    @Test
    void createsANewGoogleAccountWhenNothingMatches() {
        when(userRepository.findByGoogleId(GOOGLE_ID)).thenReturn(Optional.empty());
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        stubSaveWithGeneratedId();

        User user = service.findOrCreate(GOOGLE_ID, "User@Example.com", true, "User Name", "https://img/pic.png");

        assertThat(user.getProvider()).isEqualTo(AuthProvider.GOOGLE);
        assertThat(user.getRole()).isEqualTo(Role.PUBLIC);
        assertThat(user.getEmail()).isEqualTo(EMAIL);
        assertThat(user.getGoogleId()).isEqualTo(GOOGLE_ID);
        assertThat(user.getPasswordHash()).isNull();
        assertThat(user.getProfileImageUrl()).isEqualTo("https://img/pic.png");
    }

    @Test
    void linksGoogleToExistingLocalAccountSafely() {
        User local = localUser();
        when(userRepository.findByGoogleId(GOOGLE_ID)).thenReturn(Optional.empty());
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(local));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User linked = service.findOrCreate(GOOGLE_ID, EMAIL, true, "Google Display Name", "https://img/pic.png");

        assertThat(linked).isSameAs(local);
        assertThat(linked.getGoogleId()).isEqualTo(GOOGLE_ID);
        assertThat(linked.getProvider()).isEqualTo(AuthProvider.LOCAL);
        assertThat(linked.getPasswordHash()).isEqualTo(local.getPasswordHash());
        assertThat(linked.getRole()).isEqualTo(Role.PUBLIC);
    }

    @Test
    void refusesToLinkWhenTheGoogleEmailIsUnverified() {
        User local = localUser();
        when(userRepository.findByGoogleId(GOOGLE_ID)).thenReturn(Optional.empty());
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(local));

        assertThatThrownBy(() -> service.findOrCreate(GOOGLE_ID, EMAIL, false, "Someone", null))
                .isInstanceOf(OAuthAccountLinkingException.class)
                .extracting(ex -> ((OAuthAccountLinkingException) ex).getErrorCode())
                .isEqualTo("email_not_verified");

        verify(userRepository, never()).save(any());
    }

    @Test
    void refusesEmailOwnedByAnotherGoogleAccount() {
        User otherGoogle = localUser();
        ReflectionTestUtils.setField(otherGoogle, "provider", AuthProvider.GOOGLE);
        ReflectionTestUtils.setField(otherGoogle, "googleId", "some-other-google-sub");
        when(userRepository.findByGoogleId(GOOGLE_ID)).thenReturn(Optional.empty());
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(otherGoogle));

        assertThatThrownBy(() -> service.findOrCreate(GOOGLE_ID, EMAIL, true, "Someone", null))
                .isInstanceOf(OAuthAccountLinkingException.class)
                .extracting(ex -> ((OAuthAccountLinkingException) ex).getErrorCode())
                .isEqualTo("account_conflict");

        verify(userRepository, never()).save(any());
    }

    @Test
    void returnsTheSameAccountForAKnownGoogleId() {
        User existing = localUser();
        existing.linkGoogle(GOOGLE_ID, "https://img/old.png");
        when(userRepository.findByGoogleId(GOOGLE_ID)).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User result = service.findOrCreate(GOOGLE_ID, "changed@example.com", false, "Changed", "https://img/new.png");

        assertThat(result).isSameAs(existing);
    }

    @Test
    void rejectsAGoogleIdentityWithoutAnEmail() {
        when(userRepository.findByGoogleId(GOOGLE_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findOrCreate(GOOGLE_ID, null, true, "No Email", null))
                .isInstanceOf(OAuthAccountLinkingException.class)
                .extracting(ex -> ((OAuthAccountLinkingException) ex).getErrorCode())
                .isEqualTo("missing_email");
    }

    private User localUser() {
        User user = User.registerLocal("Local User", EMAIL, HASH);
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        return user;
    }

    private void stubSaveWithGeneratedId() {
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            if (ReflectionTestUtils.getField(user, "id") == null) {
                ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
            }
            return user;
        });
    }
}
