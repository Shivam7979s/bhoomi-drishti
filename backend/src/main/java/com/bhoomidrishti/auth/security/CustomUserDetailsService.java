package com.bhoomidrishti.auth.security;

import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.common.EmailNormalizer;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

/**
 * Feeds {@code app_user} rows to Spring Security's authentication layer.
 *
 * <p>The "username" is the normalised email address and the only authority is the account role
 * prefixed with {@code ROLE_}, which is what the URL rules in {@code SecurityConfig} match
 * against ({@code hasRole("ADMIN") == ROLE_ADMIN}).
 *
 * <p>Google-only accounts have no password; they can never pass email/password login because
 * {@code DaoAuthenticationProvider} rejects an empty stored hash.
 */
@Component
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository
                .findByEmail(EmailNormalizer.normalize(email))
                .orElseThrow(() -> new UsernameNotFoundException("No account matches these credentials"));

        return org.springframework.security.core.userdetails.User.withUsername(user.getEmail())
                .password(user.getPasswordHash() == null ? "" : user.getPasswordHash())
                .authorities(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                .disabled(!user.isEnabled())
                .build();
    }
}
