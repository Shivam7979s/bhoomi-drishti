# Knowledge & Evidence Vector Search API

The Knowledge & Evidence layer transforms research papers, policy circulars, and survey manuals into a structured, searchable, vector knowledge base with exact citation and provenance tracking.

---

## 1. Architecture Overview

```
[Browser / Frontend]
         │ (JWT / Session Cookie)
         ▼
[Spring Boot Backend] (Port 8080)
   ├── Enforces RBAC & Document Visibility
   ├── Resolves Document Metadata & Citations
   │
   │ Service-to-Service HTTP (X-Internal-Secret)
   ▼
[FastAPI AI Service] (Port 8000, Internal Only)
   ├── Embedding: FastEmbed (BAAI/bge-small-en-v1.5, 384 dimensions)
   ├── SSRF-Safe Ingestion Pipeline
   ├── Sliding-Window Text Chunker
   │
   ▼
[PostgreSQL 17 + PostGIS + pgvector] (Port 5433 / internal 5432)
   ├── document_processing (status, chunk_count, content_hash)
   └── document_chunks (text, embedding vector(384), HNSW cosine index)
```

---

## 2. Endpoints

### 2.1 Semantic Knowledge Search

Executes vector similarity search against indexed document chunks with academic citations and evidence provenance.

- **URL:** `/api/knowledge/search`
- **Method:** `POST`
- **Authentication:** Optional (Public callers retrieve only `PUBLISHED` document evidence; authenticated `ADMIN` / `RESEARCHER` can retrieve drafts).

#### Request Body
```json
{
  "query": "Who arbitrates boundary disputes between agricultural parcels?",
  "topK": 5,
  "minSimilarity": 0.5,
  "documentIds": ["8e95a92d-7cd9-44b7-b3eb-3e3fb6a4ef4a"]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `query` | string | Yes | Query text (1–1000 characters). |
| `topK` | integer | No | Maximum evidence chunks to retrieve (1–50, default: 5). |
| `minSimilarity` | double | No | Minimum cosine similarity threshold (0.0–1.0, default: 0.0). |
| `documentIds` | array | No | Optional list of ResearchDocument UUIDs to filter evidence. |

#### Response (`200 OK`)
```json
{
  "query": "Who arbitrates boundary disputes between agricultural parcels?",
  "totalResults": 1,
  "results": [
    {
      "chunkId": "3b290947-f416-4322-83b3-8557a5c89895",
      "documentId": "8e95a92d-7cd9-44b7-b3eb-3e3fb6a4ef4a",
      "chunkIndex": 1,
      "pageNumber": 1,
      "sectionTitle": "BOUNDARY DISPUTE ARBITRATION AND REVENUE PROTOCOLS",
      "text": "When adjacent land parcel boundaries are contested by title holders, jurisdiction lies with the Tahsildar under Section 42 of the Land Revenue Act...",
      "similarity": 0.7941,
      "documentTitle": "National Cadastral Survey Standards and Dispute Protocols 2026",
      "documentType": "GOVERNMENT_REPORT",
      "authors": "Survey of India, Department of Land Resources",
      "citation": "Survey of India, Department of Land Resources (2026). National Cadastral Survey Standards and Dispute Protocols 2026, p. 1",
      "sourceUrl": "https://surveyofindia.gov.in/guidelines/cadastre-2026.pdf"
    }
  ]
}
```

---

### 2.2 Trigger Document Ingestion

Queues an asynchronous extraction, chunking, and vector embedding pipeline for a ResearchDocument.

- **URL:** `/api/research-documents/{id}/ingest`
- **Method:** `POST`
- **Authentication:** Required (`RESEARCHER`, `ACADEMIA`, `GOVERNMENT_OFFICIAL`, `ADMIN`).
- **Authorization:** Creators can ingest their own documents; `ADMIN` can ingest any document.

#### Response (`202 Accepted`)
```json
{
  "documentId": "8e95a92d-7cd9-44b7-b3eb-3e3fb6a4ef4a",
  "status": "QUEUED",
  "chunkCount": 0,
  "message": "Document ingestion successfully queued for processing."
}
```

#### Error Responses
- `401 Unauthorized`: Missing or invalid session.
- `403 Forbidden`: Insufficient role or not document owner.
- `404 Not Found`: Document ID does not exist.
- `409 Conflict`: Ingestion is already in progress (`QUEUED` or `PROCESSING`).
- `503 Service Unavailable`: AI service is offline or unreachable.

---

### 2.3 Get Document Ingestion Status

Polls processing progress, chunk count, error diagnostics, and content checksum.

- **URL:** `/api/research-documents/{id}/processing-status`
- **Method:** `GET`
- **Authentication:** Required (`CITIZEN`, `RESEARCHER`, `ACADEMIA`, `GOVERNMENT_OFFICIAL`, `ADMIN`).

#### Response (`200 OK`)
```json
{
  "id": "e7c2ba31-8c44-4860-9669-7da5d9ec5db2",
  "researchDocumentId": "8e95a92d-7cd9-44b7-b3eb-3e3fb6a4ef4a",
  "status": "COMPLETED",
  "errorMessage": null,
  "chunkCount": 4,
  "contentHash": "f4109634ba4c000984f75939434f9d9b63e977be1d04ae6047a19d0e96d4593f",
  "processingVersion": "v1-bge-small",
  "startedAt": "2026-09-23T14:03:00.123456Z",
  "completedAt": "2026-09-23T14:03:02.987654Z"
}
```

Possible `status` values:
- `NOT_INGESTED`: Document has not been processed yet.
- `QUEUED`: Scheduled for background execution.
- `PROCESSING`: Downloading, extracting, chunking, or embedding.
- `COMPLETED`: Finished; vector chunks stored and indexed.
- `FAILED`: Error occurred (details available in `errorMessage`).

---

## 3. Internal AI Service Endpoints

These endpoints are bound to the internal Docker network (`ai-service:8000`) and are protected by `X-Internal-Secret`.

| Method | Path | Description | Protected |
|---|---|---|---|
| `GET` | `/health` | Liveness, readiness, DB pool check, and model metadata. | No |
| `POST` | `/internal/retrieve` | Semantic vector cosine search over `document_chunks`. | Yes |
| `POST` | `/internal/ingest` | Background document extraction, chunking, and embedding. | Yes |
| `GET` | `/internal/status/{id}` | Internal processing record lookup. | Yes |

---

## 4. Security & Safety Controls

1. **Service Isolation**: The AI service port 8000 is not exposed to the public browser. All traffic routes through Spring Boot reverse client with `X-Internal-Secret` validation.
2. **SSRF Guard**:
   - Blocks loopback (`127.0.0.0/8`, `::1`), private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), cloud instance metadata (`169.254.169.254`), and link-local addresses.
   - Validates IP resolution before request and at every HTTP redirect step.
   - Enforces a 25MB streaming download ceiling.
3. **Evidence Grounding**: No hallucinated LLM text is returned. All answers consist of exact verbatim extracts, source document metadata, page numbers, and similarity metrics.
4. **Tenant & Visibility Isolation**: Unauthenticated users and citizens only see evidence from `PUBLISHED` documents. Draft and archived documents remain hidden unless viewed by administrators or document creators.
