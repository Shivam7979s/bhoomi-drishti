package com.bhoomidrishti.landrecord.entity;

/**
 * Lifecycle status of a record. Stored as a String (see V2 CHECK constraint).
 * PUBLIC users only ever see ACTIVE records.
 */
public enum LandRecordStatus {
    ACTIVE,
    INACTIVE,
    DISPUTED,
    PENDING_VERIFICATION
}
