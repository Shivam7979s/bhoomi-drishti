package com.bhoomidrishti.exception;

/**
 * Login failed. Maps to HTTP 401. The message is intentionally generic so the endpoint cannot be
 * used to discover which email addresses have accounts.
 */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException(String message) {
        super(message);
    }
}
