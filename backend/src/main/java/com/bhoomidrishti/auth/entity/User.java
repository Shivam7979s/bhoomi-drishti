package com.bhoomidrishti.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * Application account: either a local email/password account or a Google OpenID Connect account.
 *
 * <p>The table is created by the Flyway migration {@code V1__create_app_user_table.sql}
 * ({@code spring.jpa.hibernate.ddl-auto} stays {@code none}), so no schema is generated from this
 * class.
 *
 * <p>Instances are only ever created through the factory methods so that the invariants stay in
 * one place: local accounts always carry a BCrypt hash, Google accounts never do, and new accounts
 * always start with the {@link Role#DEFAULT_REGISTRATION_ROLE}.
 */
@Entity
@Table(name = "app_user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    /** Stored lower case; unique per account. */
    @Column(name = "email", nullable = false, length = 255)
    private String email;

    /** BCrypt hash, {@code null} for Google-only accounts. */
    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    /** Google subject ({@code sub}) claim, {@code null} until a Google identity is linked. */
    @Column(name = "google_id", length = 255)
    private String googleId;

    @Column(name = "profile_image_url", length = 1024)
    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 20)
    private AuthProvider provider;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 40)
    private Role role;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Required by JPA. */
    protected User() {
    }

    private User(String name, String email, AuthProvider provider, Role role) {
        this.name = name;
        this.email = email;
        this.provider = provider;
        this.role = role;
        this.enabled = true;
    }

    /** Creates a local account. {@code passwordHash} must already be a BCrypt hash. */
    public static User registerLocal(String name, String email, String passwordHash) {
        User user = new User(name, email, AuthProvider.LOCAL, Role.DEFAULT_REGISTRATION_ROLE);
        user.passwordHash = passwordHash;
        return user;
    }

    /** Creates an account from a verified Google identity. Google accounts never store a password. */
    public static User registerGoogle(String name, String email, String googleId, String profileImageUrl) {
        User user = new User(name, email, AuthProvider.GOOGLE, Role.DEFAULT_REGISTRATION_ROLE);
        user.googleId = googleId;
        user.profileImageUrl = profileImageUrl;
        return user;
    }

    /**
     * Links a Google identity to an existing account without changing how the account was created,
     * its password or its role.
     */
    public void linkGoogle(String googleId, String profileImageUrl) {
        this.googleId = googleId;
        if (profileImageUrl != null && !profileImageUrl.isBlank()) {
            this.profileImageUrl = profileImageUrl;
        }
    }

    /** Reserved for the admin role-assignment mechanism introduced in a later phase. */
    public void changeRole(Role newRole) {
        this.role = newRole;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getGoogleId() {
        return googleId;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public AuthProvider getProvider() {
        return provider;
    }

    public Role getRole() {
        return role;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
