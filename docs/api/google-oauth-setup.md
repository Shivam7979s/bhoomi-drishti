# Google OAuth Setup (Google Cloud Console)

Phase 2 signs users in with their Google account through the backend's Spring Security OAuth2
client. The frontend never sees the Google client secret; all of the Google configuration lives in
the backend's environment (`.env`, git-ignored).

> If `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are left as `not_configured`, the application
> still starts, builds and tests normally. Only the "Continue with Google" button fails at the
> Google step until you configure a real client.

## 1. Create or select a Google Cloud project

1. Open <https://console.cloud.google.com/> and sign in.
2. Create a new project (e.g. `bhoomi-drishti`) or select the existing SIH project.

## 2. Configure the OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**.
2. Choose **External** user type (the prototype has no Google Workspace organisation).
3. Fill in the required fields:
   - **App name:** `BHOOMI-DRISHTI`
   - **User support email:** your own email
   - **Developer contact information:** your own email
4. On the **Scopes** step, keep the defaults (`openid`, `email`, `profile`). The backend requests
   `openid profile email` — nothing else.
5. On the **Test users** step, add your own Gmail address while the app is in Testing mode.
   (Publishing the app is NOT needed for local development.)

## 3. Create the OAuth Client ID

1. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. **Application type:** `Web application`.
3. **Name:** e.g. `bhoomi-drishti-backend-local`.
4. Under **Authorized JavaScript origins**, add (only needed if you ever call Google APIs from the
   browser — the Phase 2 flow does not, but adding it is harmless):
   - `http://localhost:5173`
5. Under **Authorized redirect URIs**, add exactly:
   - `http://localhost:8080/login/oauth2/code/google`
   
   This is Spring Security's fixed callback path: `{backend}/login/oauth2/code/{registrationId}`.
   The registration id is `google` (see `application.yml`).
6. Click **Create** and copy the **Client ID** and **Client secret**.

## 4. Put the credentials in the local `.env` (never in source code)

```dotenv
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-real-secret-here
```

Then restart the backend so it picks them up. Verify with:

```bash
curl http://localhost:8080/api/health
```

and by clicking **Continue with Google** on `http://localhost:5173/login`.

## 5. Production (later)

For a deployed backend the redirect URI changes to the public backend URL, for example:

- `https://api.bhoomi-drishti.example.com/login/oauth2/code/google`

That URI must be added to the **same** OAuth client (or a separate production client) under
Authorized redirect URIs. The frontend origin likewise becomes the deployed frontend URL, set via
`CORS_ALLOWED_ORIGINS` in the backend environment.
