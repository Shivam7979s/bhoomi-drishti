package com.bhoomidrishti.auth.entity;

import java.util.Set;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

/**
 * Application roles.
 *
 * <p>Spring Security expects authorities to be prefixed with {@code ROLE_}, which
 * {@link #authority()} applies. Registrations always receive {@link #PUBLIC}; the other roles are
 * handed out by an administrator (see {@code AdminUserController}).
 */
public enum Role {

    /** Full administrative access, including role assignment. */
    ADMIN,

    /** Government / policy related functionality. */
    GOVERNMENT_OFFICIAL,

    /** Research related functionality. */
    RESEARCHER,

    /** Academic research and collaboration functionality. */
    ACADEMIA,

    /** Default role of a newly registered account: public, read-only functionality. */
    PUBLIC;

    public static final String AUTHORITY_PREFIX = "ROLE_";

    /** Role handed to every new account. */
    public static final Role DEFAULT_REGISTRATION_ROLE = PUBLIC;

    /** Role authority as used by Spring Security, for example {@code ROLE_RESEARCHER}. */
    public String authority() {
        return AUTHORITY_PREFIX + name();
    }

    public Set<SimpleGrantedAuthority> authorities() {
        return Set.of(new SimpleGrantedAuthority(authority()));
    }
}
