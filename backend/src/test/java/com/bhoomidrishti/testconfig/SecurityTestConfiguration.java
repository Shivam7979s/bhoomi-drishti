package com.bhoomidrishti.testconfig;

import com.bhoomidrishti.auth.oauth.GoogleAccountService;
import com.bhoomidrishti.auth.oauth.GoogleLoginFailureHandler;
import com.bhoomidrishti.auth.oauth.GoogleLoginSuccessHandler;
import com.bhoomidrishti.auth.oauth.GoogleOidcUserService;
import com.bhoomidrishti.auth.security.AuthCookieService;
import com.bhoomidrishti.auth.security.CustomUserDetailsService;
import com.bhoomidrishti.auth.security.JwtAuthenticationFilter;
import com.bhoomidrishti.auth.security.JwtService;
import com.bhoomidrishti.auth.security.RestAccessDeniedHandler;
import com.bhoomidrishti.auth.security.RestAuthenticationEntryPoint;
import com.bhoomidrishti.auth.service.AuthService;
import com.bhoomidrishti.config.CorsConfig;
import com.bhoomidrishti.config.SecurityConfig;
import com.bhoomidrishti.service.HealthService;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

/**
 * Shared wiring for {@code @WebMvcTest} security tests.
 *
 * <p>The web slice does not scan {@code @Component}/{@code @Service} beans, so everything the
 * security filter chain and the auth controller need is imported here once instead of repeating it
 * in every test class. JPA is still excluded: tests declare {@code @MockitoBean UserRepository}
 * themselves.
 */
@Configuration
@Import({
    SecurityConfig.class,
    CorsConfig.class,
    JwtAuthenticationFilter.class,
    JwtService.class,
    AuthCookieService.class,
    CustomUserDetailsService.class,
    RestAuthenticationEntryPoint.class,
    RestAccessDeniedHandler.class,
    GoogleAccountService.class,
    GoogleOidcUserService.class,
    GoogleLoginSuccessHandler.class,
    GoogleLoginFailureHandler.class,
    AuthService.class,
    HealthService.class
})
public class SecurityTestConfiguration {}
