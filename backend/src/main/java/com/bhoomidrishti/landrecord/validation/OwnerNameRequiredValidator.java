package com.bhoomidrishti.landrecord.validation;

import com.bhoomidrishti.landrecord.entity.OwnershipType;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.util.StringUtils;

/**
 * {@link ConstraintValidator} for {@link OwnerNameRequired}.
 *
 * <p>Enforces that {@code ownerName} is not blank when {@code ownershipType} is
 * {@code INDIVIDUAL} or {@code JOINT} (i.e. a natural-person owner must be named).
 * For {@code GOVERNMENT}, {@code COMMUNITY} or {@code OTHER} the field is optional.
 * Supports both Java records (accessor methods) and JavaBeans (getters).
 */
public class OwnerNameRequiredValidator implements ConstraintValidator<OwnerNameRequired, Object> {

    @Override
    public boolean isValid(Object value, ConstraintValidatorContext ctx) {
        if (value == null) {
            return true;
        }

        String ownerName = extractProperty(value, "ownerName", "getOwnerName");
        OwnershipType ownershipType = extractProperty(value, "ownershipType", "getOwnershipType");

        if (ownershipType == null) {
            return true;
        }

        return switch (ownershipType) {
            case INDIVIDUAL, JOINT -> StringUtils.hasText(ownerName);
            default -> true;
        };
    }

    @SuppressWarnings("unchecked")
    private static <T> T extractProperty(Object target, String recordMethod, String getterMethod) {
        try {
            return (T) target.getClass().getMethod(recordMethod).invoke(target);
        } catch (NoSuchMethodException e) {
            try {
                return (T) target.getClass().getMethod(getterMethod).invoke(target);
            } catch (Exception ex) {
                return null;
            }
        } catch (Exception e) {
            return null;
        }
    }
}