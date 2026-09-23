package com.bhoomidrishti.auth.entity;

/**
 * How an account was originally created.
 *
 * <p>An account created with email and password keeps {@link #LOCAL} even after a Google identity
 * is linked to it (see {@link User#linkGoogle}) - the field records the origin of the account, not
 * the method used for the last login.
 */
public enum AuthProvider {
    LOCAL,
    GOOGLE
}
