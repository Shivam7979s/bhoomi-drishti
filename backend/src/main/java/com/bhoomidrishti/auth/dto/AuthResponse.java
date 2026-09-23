package com.bhoomidrishti.auth.dto;

import com.bhoomidrishti.auth.entity.User;

/**
 * Successful registration/login response.
 *
 * <p>The access token is also set as an HttpOnly cookie by the controller; {@code accessToken} is
 * returned for non-browser API clients and for debugging. Contains no secrets besides the token
 * itself - never a password or a password hash.
 */
public record AuthResponse(String accessToken, String tokenType, UserResponse user) {

    public static AuthResponse bearer(String accessToken, User user) {
        return new AuthResponse(accessToken, "Bearer", UserResponse.from(user));
    }
}
