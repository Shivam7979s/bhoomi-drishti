package com.bhoomidrishti.collaboration.dto;

import com.bhoomidrishti.auth.entity.User;
import java.util.UUID;

public record UserSummaryDto(
        UUID id,
        String name,
        String email,
        String role
) {
    public static UserSummaryDto from(User user, boolean includeEmail) {
        if (user == null) {
            return null;
        }
        return new UserSummaryDto(
                user.getId(),
                user.getName(),
                includeEmail ? user.getEmail() : null,
                user.getRole() != null ? user.getRole().name() : null
        );
    }
}
