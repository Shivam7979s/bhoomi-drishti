package com.bhoomidrishti.auth.service;

import com.bhoomidrishti.auth.dto.AuthResponse;
import com.bhoomidrishti.auth.dto.LoginRequest;
import com.bhoomidrishti.auth.dto.RegisterRequest;
import com.bhoomidrishti.auth.entity.User;
import com.bhoomidrishti.auth.repository.UserRepository;
import com.bhoomidrishti.auth.security.JwtService;
import com.bhoomidrishti.common.EmailNormalizer;
import com.bhoomidrishti.exception.EmailAlreadyExistsException;
import com.bhoomidrishti.exception.InvalidCredentialsException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Email/password registration and login.
 *
 * <p>Registration never reads a role from the request: {@link User#registerLocal} always assigns
 * {@code PUBLIC}, so a client cannot ask for ADMIN or GOVERNMENT_OFFICIAL. Passwords are hashed
 * with BCrypt and are never logged, returned or compared in plain text.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = EmailNormalizer.normalize(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException();
        }
        User user = userRepository.save(
                User.registerLocal(request.name().trim(), email, passwordEncoder.encode(request.password())));
        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = EmailNormalizer.normalize(request.email());
        try {
            // The real password check happens inside DaoAuthenticationProvider (BCrypt compare).
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                    email, request.password()));
        } catch (AuthenticationException ex) {
            // One generic message for unknown email, wrong password and disabled account so the
            // endpoint cannot be used to discover registered addresses.
            throw new InvalidCredentialsException("Invalid email or password");
        }
        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        return AuthResponse.bearer(jwtService.generateToken(user), user);
    }
}