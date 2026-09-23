package com.bhoomidrishti.exception;

/** Registration tried to use an email address that already has an account. Maps to HTTP 409. */
public class EmailAlreadyExistsException extends RuntimeException {

    public EmailAlreadyExistsException() {
        super("An account with this email address already exists");
    }
}
