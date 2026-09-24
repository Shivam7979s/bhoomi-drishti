# BHOOMI-DRISHTI

**AI-Powered Land Governance Platform**

> **This repository is a Smart India Hackathon (SIH) prototype.** It is an independent student
> project and is **not** an official government service. No government land-record, satellite or AI
> service is integrated at this stage - later phases will add such integrations.

---

## 1. Project Overview

BHOOMI-DRISHTI ("land vision") aims to make land governance more transparent, data driven and
easier to reason about. The long-term idea is a single platform where citizens, officials and
researchers can inspect land records, explore spatial data, work with policy documents and use AI
assistance to understand them.

**What exists today (Phase 1)** is intentionally small - only the foundation:

- a React + TypeScript frontend shell that shows the connectivity status of the backend,
- a Java + Spring Boot REST API with a single `GET /api/health` endpoint,
- a PostgreSQL + PostGIS database started with Docker Compose,
- the project structure, configuration and documentation that the next phases build on.

## 2. Problem Statement

Land governance in India involves records spread across departments and formats: textual registers,
scanned documents, maps and policy circulars. The consequences are familiar - unclear ownership
history, disputes that take years to resolve, difficulty correlating records with spatial data, and
policy documents that are hard for non-experts to interpret.

Practical gaps the platform wants to close over time:

1. **Fragmented information** - records, maps and policies live in separate systems.
2. **Weak spatial context** - ownership data is rarely explored together with geography.
3. **Hard-to-read policy** - circulars and regulations are long and written for specialists.
4. **Slow, manual verification** - cross-checking a claim means reading several registers by hand.
5. **Limited transparency** - citizens cannot easily see how a decision was reached.

**Phase 1 does not solve these gaps.** It builds the technical foundation on which the modules that
address them can be implemented in later phases.

## 3. Architecture

Phase 1 is a classic three-tier setup plus a reserved placeholder for AI:

```
┌──────────────────────────┐        ┌──────────────────────────┐        ┌──────────────────────────┐
│        frontend          │  HTTP  │         backend          │  JDBC  │   PostgreSQL + PostGIS   │
│  React + Vite + Tailwind │ ─────► │  Spring Boot (REST API)  │ ─────► │      (Docker Compose)    │
│      localhost:5173      │  CORS  │      localhost:8080      │        │      localhost:5432      │
└──────────────────────────┘        └──────────────────────────┘        └──────────────────────────┘
                                                   ▲
                                                   │  (later phases only)
                                        ┌──────────────────────────┐
                                        │        ai-service        │
                                        │  documents · RAG · search│
                                        └──────────────────────────┘
```

- The browser calls the backend directly; the backend allows the Vite origin explicitly through CORS.
- The backend connects to PostgreSQL through Spring Data JPA (no entities yet, so no tables are created).
- `ai-service/` exists as a documented placeholder only - no AI runtime is installed in Phase 1.

More detail: [`docs/architecture/architecture.md`](docs/architecture/architecture.md).

## 4. Technology Stack

| Layer       | Technology                                                                             |
| ----------- | -------------------------------------------------------------------------------------- |
| Frontend    | React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Lucide React, Recharts        |
| Backend     | Java 21 (LTS), Spring Boot 4, Spring Web MVC, Spring Data JPA, Bean Validation, Maven    |
| Database    | PostgreSQL 17 with PostGIS 3.5                                                          |
| Infra (dev) | Docker Compose (PostgreSQL + PostGIS only)                                              |
| AI service  | Not implemented yet (Phase 1 placeholder folder)                                        |

Notes on the choices:

- **Spring Boot 4.1** is used because it supports the installed JDK (Java 17 up to Java 26). It also
  marks `spring-boot-starter-web` as deprecated in favour of **`spring-boot-starter-webmvc`**, which
  is what this project depends on.
- **Tailwind CSS v4** is wired through the official `@tailwindcss/vite` plugin, so styling is
  configured in `frontend/src/index.css` (`@import 'tailwindcss';`) instead of a `tailwind.config.js`.
- **Recharts** is part of the declared frontend stack and is installed already, but no chart
  component is used yet - dashboards belong to a later phase.
- **PostGIS** is available from day one, so spatial work in later phases does not need a database swap.

## 5. Project Structure

```
bhoomi-drishti/
├── frontend/                    React + TypeScript + Vite application
│   ├── public/                  Static assets (favicon)
│   ├── src/
│   │   ├── components/          Reusable UI pieces (backend status card)
│   │   ├── layouts/             Page shell (header / content / footer)
│   │   ├── pages/               Route components (home, not found)
│   │   ├── services/            HTTP access (api client, health service)
│   │   ├── hooks/               React hooks (useBackendHealth)
│   │   ├── types/               Shared TypeScript types
│   │   ├── utils/               Small helpers (configuration access)
│   │   ├── App.tsx              Router setup
│   │   ├── main.tsx             React entry point
│   │   └── index.css            Tailwind entry stylesheet
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                     Spring Boot REST API (Maven)
│   ├── .mvn/ + mvnw + mvnw.cmd  Maven Wrapper (no local Maven install needed)
│   ├── src/main/java/com/bhoomidrishti/
│   │   ├── BhoomiDrishtiApplication.java
│   │   ├── config/              CORS configuration + bound properties
│   │   ├── controller/          REST controllers (HealthController)
│   │   ├── service/             Business logic (HealthService)
│   │   ├── repository/          Placeholder: Spring Data repositories (later phases)
│   │   ├── dto/                 Request/response payloads (HealthResponse)
│   │   ├── exception/           Placeholder: error handling (later phases)
│   │   └── common/              Placeholder: shared building blocks (later phases)
│   ├── src/main/resources/application.yml
│   ├── src/test/java/...        Web slice test for the health endpoint
│   └── pom.xml
│
├── ai-service/                  Placeholder for the AI service (later phases)
├── data/
│   ├── documents/               Local/sample documents (contents ignored by git)
│   ├── datasets/                Local datasets (contents ignored by git)
│   └── geojson/                 Sample GeoJSON files (tracked)
├── database/
│   ├── migrations/              Versioned SQL migrations (empty in Phase 1)
│   └── README.md
├── docs/
│   ├── architecture/            Architecture notes
│   └── api/                     REST API reference (health endpoint)
├── .env.example                 Environment template (the real .env is git-ignored)
├── .gitignore
├── docker-compose.yml
└── README.md
```

## 6. Prerequisites

| Tool           | Version used in this project | Notes                                                                  |
| -------------- | ---------------------------- | ---------------------------------------------------------------------- |
| Node.js + npm  | Node 22 (20.19+ works)       | Needed for the frontend                                                |
| JDK            | Java 26 installed, build targets Java 21 | Spring Boot 4 accepts Java 17 - 26                          |
| Maven          | not required                 | The Maven Wrapper (`mvnw` / `mvnw.cmd`) is committed and downloads Maven 3.9.16 on first use |
| Docker Desktop | with Compose v2              | Runs PostgreSQL + PostGIS                                              |
| Git            | any recent version           | Version control                                                        |

Internet access is required the first time you run `npm install` or `.\mvnw.cmd`, because
dependencies are downloaded from the npm and Maven Central registries.

## 7. Local Setup

```bash
# 1. get the code
git clone <repository-url>
cd bhoomi-drishti

# 2. create your local configuration (never commit this file)
copy .env.example .env          # Windows
cp .env.example .env            # macOS / Linux

# 3. start the database (PostgreSQL + PostGIS)
docker compose up -d

# 4. start the backend (new terminal)
cd backend
.\mvnw.cmd spring-boot:run      # Windows
./mvnw spring-boot:run          # macOS / Linux

# 5. start the frontend (new terminal)
cd frontend
npm install
npm run dev
```

Then open <http://localhost:5173>. The page shows `Backend Status: Connected`.

The root `.env` file is the single source of truth for local configuration and is read by
Docker Compose, the backend (`spring.config.import`) and the frontend (`envDir` in
`frontend/vite.config.ts`). Real secrets are never committed - only `.env.example` is tracked.

## 8. Running PostgreSQL/PostGIS

```bash
docker compose up -d        # start the database in the background
docker compose ps           # wait until the container reports "healthy"
docker compose logs -f postgres
docker compose down         # stop, keep the data volume
docker compose down -v      # stop and delete the data volume (full reset)
```

| Setting  | Default          | Configured by                            |
| -------- | ---------------- | ---------------------------------------- |
| Host     | `localhost`      | –                                        |
| Port     | `5432`           | `DATABASE_PORT` in `.env`                |
| Database | `bhoomi_drishti` | `DATABASE_NAME` in `.env`                |
| User     | `bhoomi`         | `DATABASE_USER` in `.env`                |
| Password | `change_me`      | `DATABASE_PASSWORD` in `.env`            |
| Image    | `postgis/postgis:17-3.5` | `docker-compose.yml`              |

Data is stored in the named volume `bhoomi-drishti-postgres-data`, so it survives
`docker compose down`.

Open a SQL shell inside the container:

```bash
docker exec -it bhoomi-drishti-postgres psql -U bhoomi -d bhoomi_drishti
```

**Phase 1 creates the database only.** There are no application tables yet - `\dt` lists just the
PostGIS catalog tables that the `postgis/postgis` image creates (`spatial_ref_sys`, `tiger.*`).
PostGIS itself is already enabled, so spatial work in a later phase can start immediately:

```bash
docker exec -it bhoomi-drishti-postgres psql -U bhoomi -d bhoomi_drishti -c "SELECT postgis_version();"
# 3.5 USE_GEOS=1 USE_PROJ=1 USE_STATS=1
```

## 9. Running Backend

```bash
cd backend
.\mvnw.cmd spring-boot:run      # Windows
./mvnw spring-boot:run          # macOS / Linux
```

- The first run downloads Maven 3.9.16 and the project dependencies into your local Maven cache.
- The API listens on `http://localhost:8080` (`BACKEND_PORT` in `.env`).
- Start the database first: without it the application stops with a clear `Connection to
  localhost:5432 refused` error - that is on purpose, a backend without its database should not
  pretend to be healthy.

Useful Maven commands (run them from `backend/`):

```bash
.\mvnw.cmd test                  # run the backend tests (no database required)
.\mvnw.cmd clean package         # build the executable jar + run the tests
.\mvnw.cmd clean package -DskipTests
java -jar target/bhoomi-drishti-backend-0.1.0-SNAPSHOT.jar    # run the built jar
```

## 10. Running Frontend

```bash
cd frontend
npm install
npm run dev          # development server on http://localhost:5173
npm run build        # type check + production build into dist/
npm run preview      # serve the production build locally
npm run typecheck    # TypeScript only, no build
```

The frontend reads `FRONTEND_PORT` and `VITE_API_BASE_URL` from the root `.env` file. The
development port is configured with `strictPort: true`, so the dev server fails loudly instead of
silently moving to another port (which would no longer match the backend CORS allow-list).

## 11. Health Check

Backend endpoint:

```bash
curl http://localhost:8080/api/health
# {"status":"UP","service":"bhoomi-drishti-backend"}
```

You can also open <http://localhost:8080/api/health> in a browser.

The frontend checks this endpoint when the home page loads and shows one of:

| Frontend text                     | Meaning                                                             |
| --------------------------------- | ------------------------------------------------------------------- |
| `Backend Status: Checking...`     | Request is in flight (initial state)                                |
| `Backend Status: Connected`       | Backend answered `200 OK` with `status: "UP"`                       |
| `Backend Status: Offline`         | Backend not reachable: not started, wrong port or blocked by CORS   |

The check has a 5 second timeout and never throws into the UI, so the page always renders. The
"Check again" button repeats the check. Full endpoint reference:
[`docs/api/health.md`](docs/api/health.md).

## 12. Development Phases

| Phase | Focus                                                                                              | Status      |
| ----- | -------------------------------------------------------------------------------------------------- | ----------- |
| **1** | Project foundation: structure, frontend shell, `GET /api/health`, PostgreSQL + PostGIS, config, docs, tests | **Completed** |
| **2** | Domain foundation: authentication, JWT, RBAC, user/role entities, Google OAuth2 integration | **Completed** |
| **3** | Land record management with PostGIS geometry (SRID 4326), GiST index, and spatial queries (`ST_Intersects`, `ST_Contains`) | **Completed** |
| **4** | Research hub: documents, datasets, policy circulars, multi-criteria filtering, full-text search, and land parcel linkage | **Completed** |
| **5** | AI Knowledge & Evidence Layer: FastEmbed (`BAAI/bge-small-en-v1.5`, 384d), pgvector HNSW cosine index, SSRF-safe ingestion, semantic search with academic citations | **Completed** |
| **6** | Spatial Decision Support & GIS Analytics Dashboard: dynamic layer toggles, parcel inspection, GIS filtering | **Completed** |
| **7** | Collaborative Land Research Workspaces: workspace isolation, RBAC membership, project land records | **Completed** |
| **8** | Multi-Scenario Policy Simulation & Impact Comparison: rule-based interventions, delta analytics | **Completed** |
| **9A**| Governance Indicator Foundation: deterministic snapshot generation, statutory & circular evidence linkage | **Completed** |
| **9B.1** | Governance Query Foundation: real-time live queries across regional and project scopes | **Completed** |
| **9B.2** | Administrative Summary API: multi-indicator live administrative aggregations (`GET /api/governance/summary`) | **Completed** |
| **9B.3** | Governance Analytics Dashboard: executive presentation layer, scope exploration, live KPI & distribution analytics | **Completed** |

Phase 1 deliverables (done): repository structure, React shell with backend status indicator,
Spring Boot API with a tested health endpoint, PostgreSQL + PostGIS via Docker Compose, environment
configuration without hardcoded secrets, CORS limited to the explicit development origin,
documentation and a passing build/test setup.

**Not implemented on purpose in Phase 1:** authentication, JWT, RBAC, research hub, AI assistant,
RAG, embeddings, GIS dashboard, policy simulation, collaboration, innovation portal, and any
government or satellite API integration. Infrastructure such as Redis, Kafka, Elasticsearch, MinIO
or Ollama is deliberately absent - it will be added when a phase actually needs it.

## Troubleshooting

| Symptom                                                        | Likely cause and fix                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Frontend shows `Backend Status: Offline`                        | Backend not running (`cd backend` + `.\mvnw.cmd spring-boot:run`), wrong port in `VITE_API_BASE_URL`, or a port mismatch.  |
| Browser console shows a CORS error                              | The Vite origin is not in `app.cors.allowed-origins`. Keep `FRONTEND_PORT` and the allowed origin in sync (both come from `.env`). |
| Backend fails with `Connection to localhost:5432 refused`       | The database container is not running: `docker compose up -d` and wait for a healthy status.                             |
| Backend fails with `password authentication failed`             | `.env` was changed after the volume was created. Either use the original credentials or run `docker compose down -v` to recreate the database. |
| `npm run dev` exits with "Port 5173 is already in use"          | Another dev server is running. Stop it or change `FRONTEND_PORT` in `.env` (the backend allow-list follows it).          |
| Backend cannot reach the container although `docker compose ps` is healthy | Another PostgreSQL already listens on port 5432 on the host (a locally installed PostgreSQL does this by default). Set `DATABASE_PORT=5433` (or any free port) in `.env`, run `docker compose up -d` again and restart the backend - both read the same `.env`. |
| `.\mvnw.cmd` fails the first time                               | The wrapper needs internet access to download Maven and the dependencies once.                                           |
| `mvn test` prints "Mockito is currently self-attaching ... dynamic agent" | Harmless JDK 21+ notice raised by the test libraries, not a failure - the build still reports `BUILD SUCCESS`.   |

## License / usage note

This is a student prototype built for the Smart India Hackathon. It does not contain, call or
reproduce any official government land-records system, and it does not claim any government
approval or integration. Any real integration is a future phase and would require the respective
authority's authorization.
