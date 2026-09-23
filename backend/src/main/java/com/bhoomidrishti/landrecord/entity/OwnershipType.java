package com.bhoomidrishti.landrecord.entity;

/** Ownership arrangement of the parcel. Stored as a String (see V2 CHECK constraint). */
public enum OwnershipType {
    INDIVIDUAL,
    JOINT,
    GOVERNMENT,
    COMMUNITY,
    OTHER
}
