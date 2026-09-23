package com.bhoomidrishti.exception;

/**
 * The Google identity could not be safely mapped to a local account (e.g. unverified email, or the
 * email already belongs to a different Google account). Never shown directly to the client: the
 * OAuth failure handler converts {@link #getErrorCode()} into a safe redirect parameter.
 */
public class OAuthAccountLinkingException extends RuntimeException {

    private final String errorCode;

    public OAuthAccountLinkingException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
