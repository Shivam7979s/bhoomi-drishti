package com.bhoomidrishti.exception;

import java.util.UUID;

/** Thrown when a land record id does not exist (or is hidden from the caller) -> 404. */
public class LandRecordNotFoundException extends RuntimeException {

    public LandRecordNotFoundException(UUID id) {
        super("Land record not found: " + id);
    }
}
