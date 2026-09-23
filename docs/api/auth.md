# Auth API (Phase 2)

Base URL (local development): `http://localhost:8080`.

All responses are JSON and use the error shape documented in
`docs/architecture/authentication.md`. The endpoints set/read an HttpOnly session cookie
(`bhoomi_auth` by default); native clients may use the returned `accessToken` as a Bearer token.

## POST /api/auth/register

Creates a local account. The role is always `PUBLIC` — any `role` field in the request is ignored.

Request:

```json
{
  "name": "Example User",
  "email": "user@example.com",
  "password": "secure-password"
}
```

Validation: name required (≤ 120), valid email (≤ 254, unique, case-insensitive),
password 8–72 chars.

- `201` → `{ "accessToken": "…", "tokenType": "Bearer", "user": {…} }` + session cookie
- `400` → validation failure (`fieldErrors` per field)
- `409` → email already registered

## POST /api/auth/login

```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

- `200` → `{ "accessToken": "…", "tokenType": "Bearer", "user": {…} }` + session cookie
- `401` → `Invalid email or password` (same message whether the email exists or not)

## GET /api/auth/me

Returns the currently signed-in user (cookie or Bearer token).

```json
{
  "id": "…",
  "name": "Shivam",
  "email": "user@example.com",
  "role": "PUBLIC",
  "provider": "LOCAL",
  "profileImageUrl": null
}
```

Never returned: password/hash, `googleId`, OAuth or JWT secrets.

- `200` → the user above
- `401` → `Authentication required`

## POST /api/auth/logout

Clears the session cookie. Always `200` (`{ "message": "Signed out" }`), even without a session.

## Google OAuth (Spring Security endpoints)

| Endpoint                              | Purpose                                            |
|---------------------------------------|----------------------------------------------------|
| `GET /oauth2/authorization/google`    | Starts the Google sign-in (browser navigates here) |
| `GET /login/oauth2/code/google`       | Google redirects back here (handled by Spring)     |

After the callback the backend redirects to the SPA:

- success → `{FRONTEND_BASE_URL}/auth/callback`
- failure → `{FRONTEND_BASE_URL}/auth/callback?error={code}` or `/login?error={code}`

Error codes: `email_not_verified`, `account_conflict`, `missing_email`, `access_denied`,
`login_failed`.

## Test endpoints (temporary, Phase 2 only)

| Endpoint                   | Access                                              |
|----------------------------|-----------------------------------------------------|
| `GET /api/test/public`       | open                                                |
| `GET /api/test/authenticated`| any signed-in user                                  |
| `GET /api/test/researcher`   | `RESEARCHER`, `ACADEMIA`, `ADMIN`                   |
| `GET /api/test/government`   | `GOVERNMENT_OFFICIAL`, `ADMIN`                      |
| `GET /api/test/admin`        | `ADMIN`                                             |

These prove RBAC works and are removed when real modules arrive. They carry both URL rules
(`SecurityConfig`) and `@PreAuthorize` annotations.

## Unchanged from Phase 1

`GET /api/health` → `{ "status": "UP", "service": "bhoomi-drishti-backend" }` (still public).
