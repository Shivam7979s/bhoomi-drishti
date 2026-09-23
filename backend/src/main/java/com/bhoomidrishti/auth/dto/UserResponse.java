package com.bhoomidrishti.auth.dto;

import com.bhoomidrishti.auth.entity.AuthProvider;
import com.bhoomidrishti.auth.entity.Role;
import com.bhoomidrishti.auth.entity.User;
import java.util.UUID;

/**
 * Safe public view of an account. Built from the entity in exactly one place so that sensitive
 * fields (password hash, Google id, timestamps) can never leak into an API response by accident.
 */
public record UserResponse(UUID id, String name, String email, Role role, AuthProvider provider, String profileImageUrl) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getProvider(),
                user.getProfileImageUrl());
    }
}
