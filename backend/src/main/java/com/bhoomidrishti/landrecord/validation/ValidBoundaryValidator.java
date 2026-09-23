package com.bhoomidrishti.landrecord.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.MultiPolygon;
import org.locationtech.jts.geom.Coordinate;

/**
 * {@link ConstraintValidator} for {@link ValidBoundary}.
 *
 * <p>A land parcel's boundary must be a non-empty Polygon or MultiPolygon, SRID 4326,
 * geometrically valid, and contain only coordinates within the geographic coordinate range.
 */
public class ValidBoundaryValidator implements ConstraintValidator<ValidBoundary, Geometry> {

    private static final int EXPECTED_SRID = 4326;

    @Override
    public boolean isValid(Geometry value, ConstraintValidatorContext ctx) {
        if (value == null || value.isEmpty()) {
            return false;
        }

        // Accept Polygon or MultiPolygon only.
        if (!(value instanceof Polygon) && !(value instanceof MultiPolygon)) {
            return false;
        }

        // Must be a valid geometry (no self-intersections, etc.).
        if (!value.isValid()) {
            return false;
        }

        // Must carry the correct SRID.
        if (value.getSRID() != EXPECTED_SRID) {
            return false;
        }

        // Coordinates must be within geographic range.
        for (Coordinate c : value.getCoordinates()) {
            if (c.x < -180 || c.x > 180 || c.y < -90 || c.y > 90) {
                return false;
            }
        }

        return true;
    }
}