# database/

Database assets of BHOOMI-DRISHTI.

| Folder       | Purpose                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------- |
| `migrations/`| Versioned schema migrations (for example Flyway scripts). Empty in Phase 1.                  |

**Phase 1 status:** the PostgreSQL + PostGIS instance is created by `docker-compose.yml`, but no
application tables are defined yet. Entities and their migrations are introduced together with the
domain modules in the next phases, so the schema grows in a controlled, reviewable way.

The PostGIS extension is already enabled in the `bhoomi_drishti` database by the
`postgis/postgis` image (verified: `SELECT postgis_version();` returns `3.5`), which is what the
land-parcel geometry work will rely on later.

If the machine already runs a PostgreSQL server on port 5432, set `DATABASE_PORT` to a free port in
the root `.env` file - Docker Compose, the backend and the frontend all read the same file.
