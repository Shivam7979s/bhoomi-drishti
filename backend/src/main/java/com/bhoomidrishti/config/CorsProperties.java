package com.bhoomidrishti.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Cross-origin settings for the REST API, bound from the {@code app.cors.*} properties
 * in {@code application.yml}.
 *
 * @param allowedOrigins browser origins that may call the API. Never set this to {@code *}
 *                       together with credentials or in production.
 */
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(List<String> allowedOrigins) {

    public CorsProperties {
        allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
    }
}
