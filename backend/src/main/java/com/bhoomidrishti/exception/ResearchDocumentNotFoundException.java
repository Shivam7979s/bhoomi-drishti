package com.bhoomidrishti.exception;

import java.util.UUID;

public class ResearchDocumentNotFoundException extends RuntimeException {

    public ResearchDocumentNotFoundException(UUID id) {
        super("Research document not found: " + id);
    }

    public ResearchDocumentNotFoundException(String message) {
        super(message);
    }
}
