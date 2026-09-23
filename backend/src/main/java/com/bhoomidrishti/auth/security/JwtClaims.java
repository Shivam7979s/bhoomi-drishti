package com.bhoomidrishti.auth.security;

import java.util.UUID;

/** The identity claims read back out of a verified access token. */
public record JwtClaims(UUID userId, String email, String role) {}
