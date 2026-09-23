# Authentication (Phase 2)

How sign-in, Google OAuth, sessions and roles work in BHOOMI-DRISHTI.

## Email/password flow

```
Frontend                          Backend                              Database
   │                                   │                                   │
   │  POST /api/auth/register ─────────►  validate, check unique email     │
   │  {name, email, password}          │  BCrypt-hash password             ├──► INSERT app_user (role PUBLIC)
   │  ◄──────── session cookie + {user}│  sign JWT                         │
   │                                   │                                   │
   │  POST /api/auth/login ────────────►  AuthenticationManager + BCrypt   │
   │  {email, password}                │  verifies password                ├──► SELECT app_user BY email
   │  ◄──────── session cookie + {user}│  sign JWT                         │
```

The server always decides the role: registration hard-codes `role = PUBLIC` and never reads a
role from the request. Elevated roles are assigned by an administrator directly in the database
(or a future admin endpoint), never through a public API.

## Google OAuth flow (OpenID Connect via Spring Security)

```
Browser                    Backend                          Google
  │                           │                                │
  │ GET /oauth2/authorization/google (full-page navigation)    │
  │──────────────────────────►│  Spring Security redirects ──►│ login + consent
  │                           │◄── callback ──────────────────│ /login/oauth2/code/google
  │                           │  OidcUserService loads userinfo│
  │                           │  GoogleAccountService:         │
  │                           │   find by google_id, else      │
  │                           │   match verified email, else   │
  │                           │   create (provider GOOGLE,     │
  │                           │   role PUBLIC)                 │
  │                           │  sign app JWT, set cookie,     │
  │  302 → /auth/callback ────│  redirect to frontend          │
  │  GET /api/auth/me ───────►│  cookie → user                 │
```

Key properties:

- The Google client secret never leaves the backend (`.env`, git-ignored).
- Google `email_verified` must be `true` before an existing local account is linked.
  An unverified Google email can never take over another account.
- If the email belongs to a *different* Google identity, login fails with
  `account_conflict` instead of creating a duplicate.
- The application JWT is **never** placed in a URL — passing tokens through browser history,
  bookmarks and `Referer` headers would leak them. The cookie is set on the server redirect and
  the SPA reads the session via `GET /api/auth/me`.

## Session & token storage

- The JWT (HS256, claims `sub` = user id, `email`, `role`) travels in an **HttpOnly cookie**
  (`bhoomi_auth` by default): JavaScript cannot read it, which removes the whole class of
  token-theft-via-XSS that `localStorage` tokens suffer from. The cookie is `SameSite=Lax` so
  plain top-level navigation (the OAuth redirect) still carries it, while cross-site `fetch`
  calls do not.
- Trade-off: HttpOnly cookies are sent automatically, so CSRF is the residual risk. This API is
  stateless JWT (no privileged action is driven by ambient authority alone outside the SPA
  origin + `SameSite=Lax`), which is why CSRF tokens are not used in Phase 2. If a future phase
  adds cookie-authenticated cross-origin writes (e.g. an embedded widget), revisit this and add
  `SameSite=Strict`/CSRF tokens then.
- Native/mobile clients (no cookies) can use the `accessToken` field of the login/register
  response as a `Bearer` token instead.

## Roles (RBAC)

| Role                 | Intended access (later phases)              | Phase 2 proof                    |
|----------------------|---------------------------------------------|----------------------------------|
| `PUBLIC`             | Read-only public endpoints                  | `/api/test/public`, default role |
| `RESEARCHER`         | Research functionality                      | `GET /api/test/researcher`       |
| `ACADEMIA`           | Research / collaboration                    | same as `RESEARCHER`             |
| `GOVERNMENT_OFFICIAL`| Government / policy functionality           | `GET /api/test/government`       |
| `ADMIN`              | Full administrative access                  | `GET /api/test/admin`            |

Enforcement has two layers that agree with each other: URL rules in `SecurityConfig`
(401/403 before any controller runs) and `@PreAuthorize` annotations on the test controller.

401 = no/invalid session. 403 = signed in, but the role is insufficient.

## Error shape

All auth failures use one JSON structure (no stack traces leave the server):

```json
{
  "timestamp": "2026-09-23T00:00:00Z",
  "status": 401,
  "error": "UNAUTHORIZED",
  "message": "Authentication required",
  "path": "/api/auth/me"
}
```

Status codes: `400` invalid payload, `401` unauthenticated (incl. wrong password),
`403` insufficient role, `404` unknown account on login (deliberately generic),
`409` duplicate email, `422` Google account-linking conflict.
