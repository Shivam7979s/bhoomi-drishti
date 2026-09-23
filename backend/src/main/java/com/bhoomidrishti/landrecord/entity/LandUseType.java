package com.bhoomidrishti.landrecord.entity;

/** How the parcel is used. Stored as a String in the database (see V2 CHECK constraint). */
public enum LandUseType {
    AGRICULTURAL,
    RESIDENTIAL,
    COMMERCIAL,
    INDUSTRIAL,
    GOVERNMENT,
    FOREST,
    OTHER
}
