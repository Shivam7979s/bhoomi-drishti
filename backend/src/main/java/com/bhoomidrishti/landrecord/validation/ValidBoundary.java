package com.bhoomidrishti.landrecord.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validates a JTS {@link org.locationtech.jts.geom.Geometry} intended for PostGIS storage.
 *
 * <p>Checks performed:
 * <ul>
 *   <li>non-null and non-empty</li>
 *   <li>type is {@code Polygon} or {@code MultiPolygon} (parcels are areas)</li>
 *   <li>geometry is valid ({@code ST_IsValid} semantics)</li>
 *   <li>SRID is 4326 (WGS84)</li>
 *   <li>coordinates are within geographic range (lon/[-180,180], lat/[-90,90])</li>
 * </ul>
 *
 * <p>Invalid geometry is rejected with a {@code 400} response — never auto-repaired.
 */
@Documented
@Constraint(validatedBy = ValidBoundaryValidator.class)
@Target({ElementType.PARAMETER, ElementType.FIELD, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidBoundary {
    String message() default "invalid boundary geometry";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}