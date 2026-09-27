-- ---------------------------------------------------------------------------
-- BHOOMI-DRISHTI - Flyway Migration V9: Seed Sovereign Demo Personas
--
-- Ensures demo accounts for Citizen, Researcher, and Government Officer
-- exist in all environments (local, Docker, and Render cloud PostgreSQL)
-- with password 'Password123'.
-- ---------------------------------------------------------------------------

INSERT INTO app_user (
    id,
    name,
    email,
    password_hash,
    provider,
    role,
    enabled,
    created_at,
    updated_at
)
VALUES
    (
        'c1712e00-0000-4000-a000-000000000001',
        'Ramesh Patel',
        'citizen@example.com',
        '$2a$10$o7KH9Z2nakOjV2KvdAbYm.AskZvuuuNDBc/zTMzCBgzC8fO/fNkja',
        'LOCAL',
        'PUBLIC',
        TRUE,
        NOW(),
        NOW()
    ),
    (
        'c1712e00-0000-4000-a000-000000000002',
        'Dr. Ramesh Sharma',
        'researcher1@example.com',
        '$2a$10$o7KH9Z2nakOjV2KvdAbYm.AskZvuuuNDBc/zTMzCBgzC8fO/fNkja',
        'LOCAL',
        'RESEARCHER',
        TRUE,
        NOW(),
        NOW()
    ),
    (
        'c1712e00-0000-4000-a000-000000000003',
        'Gov Officer',
        'gov_user@example.com',
        '$2a$10$o7KH9Z2nakOjV2KvdAbYm.AskZvuuuNDBc/zTMzCBgzC8fO/fNkja',
        'LOCAL',
        'GOVERNMENT_OFFICIAL',
        TRUE,
        NOW(),
        NOW()
    ),
    (
        'c1712e00-0000-4000-a000-000000000004',
        'Admin User',
        'admin_user@example.com',
        '$2a$10$o7KH9Z2nakOjV2KvdAbYm.AskZvuuuNDBc/zTMzCBgzC8fO/fNkja',
        'LOCAL',
        'ADMIN',
        TRUE,
        NOW(),
        NOW()
    )
ON CONFLICT (email) DO UPDATE
SET
    password_hash = EXCLUDED.password_hash,
    enabled = TRUE,
    role = EXCLUDED.role,
    updated_at = NOW();
