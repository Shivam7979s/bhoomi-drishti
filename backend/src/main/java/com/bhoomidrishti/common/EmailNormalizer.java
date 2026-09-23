package com.bhoomidrishti.common;

import java.util.Locale;

/** Normalises user supplied email addresses so uniqueness checks are reliable. */
public final class EmailNormalizer {

    private EmailNormalizer() {}

    /** Trims and lower-cases an email address. Matches how emails are stored in the database. */
    public static String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
