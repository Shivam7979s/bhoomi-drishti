package com.bhoomidrishti.collaboration.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record TransferOwnershipRequest(
        @NotNull(message = "newOwnerUserId is required")
        UUID newOwnerUserId
) {}
