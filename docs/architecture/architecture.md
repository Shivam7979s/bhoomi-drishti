# Architecture (Phase 1)

## 1. Scope of this phase

Phase 1 only builds the foundation: a runnable React shell, a runnable Spring Boot API, a
PostgreSQL + PostGIS database and the wiring between them. **No land governance feature is
implemented yet** and no government, satellite or AI integration exists.

## 2. Components

| Component  | Technology                                          | Port (default) | Responsibility                                                |
| ---------- | --------------------------------------------------- | -------------- | ------------------------------------------------------------- |
| `frontend` | React 19 + TypeScript + Vite + Tailwind CSS         | 5173           | Browser user interface; shows the backend connectivity status  |
| `backend`  | Java 21 + Spring Boot 4 (Maven)                     | 8080           | REST API (`/api/**`), later the domain and persistence logic    |
| database   | PostgreSQL 17 + PostGIS 3.5 (Docker Compose)        | 5432           | Persistence, spatial data support                               |
| `ai-service` | not implemented yet                               | –              | Reserved for the AI/document-understanding service              |

## 3. Request flow (Phase 1)

```
Browser (http://localhost:5173)
        │  GET /api/health   (fetch, 5 s timeout, CORS allowed origin)
        ▼
Spring Boot backend (http://localhost:8080)
        │  HealthController → HealthService
        ▼
{"status":"UP","service":"bhoomi-drishti-backend"}
```

The database is not part of the health response yet: the endpoint reports that the backend process
is alive. The backend connects to PostgreSQL at start-up through Spring Data JPA, which fails fast
with a clear error when the container is not running.

## 4. Configuration strategy

One `.env` file in the repository root is the single source of truth for local configuration:

| Consumer        | How it reads the file                                                                  |
| --------------- | -------------------------------------------------------------------------------------- |
| Docker Compose  | native support for `.env` next to `docker-compose.yml`                                  |
| Spring Boot     | `spring.config.import: optional:file:../.env[.properties]` in `application.yml`          |
| Vite            | `envDir: '..'` + `loadEnv` in `frontend/vite.config.ts`                                 |

Environment variables that already exist in the shell always win over the imported `.env` values,
and every property in `application.yml` has a safe default, so the project also runs without a
`.env` file.

## 5. Layering rules for later phases

```
controller  →  service  →  repository  →  PostgreSQL/PostGIS
      dto  ↘         ↘
            (never the other way round)
```

- Controllers only translate HTTP to service calls and return DTOs.
- Services hold the business rules and are the only place that talks to repositories.
- Repositories are Spring Data interfaces; entities never leave the service layer.
- Configuration is bound through `@ConfigurationProperties` records in `config/`.
- Cross-cutting errors are handled in `exception/`; reusable building blocks live in `common/`.

## 6. Deliberately not present yet

Authentication, JWT, RBAC, research hub, AI assistant/RAG, GIS dashboard, policy simulation,
collaboration, innovation portal, government and satellite API integrations, message queues,
object storage and search engines. Infrastructure is added only when a phase requires it.
