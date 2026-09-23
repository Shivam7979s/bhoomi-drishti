package com.bhoomidrishti.landrecord.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Class-level constraint applied to land-record DTOs.
 *
 * <p>Enforces that {@code ownerName} is not blank when {@code ownershipType} is
 * {@code INDIVIDUAL} or {@code JOINT} (i.e. a natural-person owner must be named).
 * For {@code GOVERNMENT}, {@code COMMUNITY} or {@code OTHER} the field is optional.
 */
@Documented
@Constraint(validatedBy = OwnerNameRequiredValidator.class)
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface OwnerNameRequired {
    String message() default "ownerName is required for the selected ownership type";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}