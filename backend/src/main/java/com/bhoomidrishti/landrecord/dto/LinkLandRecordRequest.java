package com.bhoomidrishti.landrecord.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Request DTO to link an authentic land record / Khasra-Khatauni to the current user.
 */
public record LinkLandRecordRequest(
        @NotBlank(message = "state is required")
        @Size(max = 100)
        String state,

        @NotBlank(message = "district is required")
        @Size(max = 100)
        String district,

        @NotBlank(message = "tehsil is required")
        @Size(max = 100)
        String tehsil,

        @NotBlank(message = "village is required")
        @Size(max = 100)
        String village,

        @NotBlank(message = "khasraNumber is required")
        @Size(max = 64)
        String khasraNumber,

        String landUseType,

        BigDecimal landAreaSqMeters
) {}
