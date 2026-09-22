# API reference - Health endpoint

Base URL for local development: `http://localhost:8080`

Every REST route of the backend is served under the `/api` prefix.

---

## GET /api/health

Reports whether the backend process is running. Used by the frontend to display
`Backend Status: Connected` or `Backend Status: Offline`.

**Request**

```http
GET /api/health
Accept: application/json
```

No parameters, no authentication (Phase 1 has no auth).

**Response - 200 OK**

```json
{
  "status": "UP",
  "service": "bhoomi-drishti-backend"
}
```

| Field     | Type   | Description                                                            |
| --------- | ------ | ---------------------------------------------------------------------- |
| `status`  | string | `UP` while the application is able to answer requests                   |
| `service` | string | Logical service name, lets the client confirm it reached the right API |

**CORS**

The Vite development origin (`http://localhost:5173` by default) is explicitly allowed for
`/api/**`, so the browser can call this endpoint directly. The allow-list comes from
`app.cors.allowed-origins` in `backend/src/main/resources/application.yml`; wildcards are not used.

**Error cases**

| Situation                       | Behaviour                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------- |
| Backend not started / wrong port | No HTTP response; the frontend times out after 5 s and shows `Offline`        |
| Database container not running   | The backend fails to start, so this endpoint is unreachable as well           |
| Unknown path under `/api`        | Spring Boot's default 404 error body                                          |

**Manual verification**

```bash
curl http://localhost:8080/api/health
# {"status":"UP","service":"bhoomi-drishti-backend"}
```

Endpoints for the actual land governance modules will be documented in this folder as each phase
is implemented.
