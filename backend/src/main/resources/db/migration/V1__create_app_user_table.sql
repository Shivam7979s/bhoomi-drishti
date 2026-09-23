-- ---------------------------------------------------------------------------
-- BHOOMI-DRISHTI - Phase 2: application user table
--
-- Managed by Flyway (backend/src/main/resources/db/migration). Flyway runs before
-- Hibernate, and `spring.jpa.hibernate.ddl-auto` stays `none`: the schema is owned
-- by these versioned migrations, never by Hibernate.
-- ---------------------------------------------------------------------------

CREATE TABLE app_user
(
    id                UUID         NOT NULL,
    name              VARCHAR(120) NOT NULL,
    email             VARCHAR(255) NOT NULL,
    password_hash     VARCHAR(100),
    google_id         VARCHAR(255),
    profile_image_url VARCHAR(1024),
    provider          VARCHAR(20)  NOT NULL,
    role              VARCHAR(40)  NOT NULL,
    enabled           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ  NOT NULL,
    updated_at        TIMESTAMPTZ  NOT NULL,
    CONSTRAINT pk_app_user PRIMARY KEY (id),
    -- Emails are normalised to lower case by the application before they are stored.
    CONSTRAINT uq_app_user_email UNIQUE (email),
    -- PostgreSQL treats NULL values as distinct, so many local accounts (google_id IS NULL)
    -- can coexist while a Google identity can only be linked to one account.
    CONSTRAINT uq_app_user_google_id UNIQUE (google_id),
    CONSTRAINT ck_app_user_provider CHECK (provider IN ('LOCAL', 'GOOGLE')),
    CONSTRAINT ck_app_user_role CHECK (role IN ('ADMIN', 'GOVERNMENT_OFFICIAL', 'RESEARCHER', 'ACADEMIA', 'PUBLIC')),
    -- A local account always has a password, a Google account never stores one.
    CONSTRAINT ck_app_user_password CHECK ((provider = 'LOCAL') = (password_hash IS NOT NULL))
);

-- Case-insensitive lookups during login.
CREATE UNIQUE INDEX ux_app_user_lower_email ON app_user (LOWER(email));

COMMENT ON TABLE app_user IS 'Application accounts (local email/password and Google OpenID Connect)';
COMMENT ON COLUMN app_user.password_hash IS 'BCrypt hash; NULL for Google-only accounts';
COMMENT ON COLUMN app_user.provider IS 'How the account was originally created: LOCAL or GOOGLE';
COMMENT ON COLUMN app_user.google_id IS 'Google subject (sub) claim once a Google identity is linked';
