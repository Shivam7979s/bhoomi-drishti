package com.bhoomidrishti.assistant.dto;

/**
 * Categorical grounding status communicating evidence support without pretending
 * to provide a calibrated statistical confidence score.
 */
public enum GroundingStatus {
    GROUNDED,
    WEAK_EVIDENCE,
    NO_EVIDENCE,
    FALLBACK
}
