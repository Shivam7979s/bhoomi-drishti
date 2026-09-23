package com.bhoomidrishti.auth.repository;

import com.bhoomidrishti.auth.entity.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Data access for {@link User}. */
public interface UserRepository extends JpaRepository<User, UUID> {

    /** Emails are normalised to lower case before they are stored. */
    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleId(String googleId);

    boolean existsByEmail(String email);
}
