# Collaboration & Research Workspace Layer API

Phase 7 introduces a multi-tenant collaboration system for researchers, academia, and government officials to organize research into workspaces, collaborate in projects, participate in threaded discussions, bookmark research documents/chunks, and catalog/link shared datasets.

---

## 1. Overview & Security Architecture

### 1.1 Permission Hierarchy & Roles

#### Workspace Roles
- **OWNER**: Full administrative control over the workspace. Exactly one OWNER per workspace. Can transfer ownership (which promotes the target user to OWNER and demotes the original owner to ADMIN), update workspace metadata, manage members, and delete the workspace. The sole OWNER cannot leave or be removed without transferring ownership first.
- **ADMIN**: Can manage members (invite, change roles for MEMBER/VIEWER, remove non-owners), create/manage projects, and update workspace settings.
- **MEMBER**: Can create projects, view workspace assets, participate in projects, and add datasets.
- **VIEWER**: Read-only access to workspace assets and public/inherited projects.

#### Project Roles
- **LEAD**: Full control of the project. Can manage project members, pin/delete comments, link/unlink datasets, land records, and research documents, and edit/archive the project.
- **CONTRIBUTOR**: Can add comments, reply, link datasets, land records, and research documents.
- **VIEWER**: Read-only access to project contents and comments.

#### Workspace & Project Visibility
- **Workspaces**:
  - `PUBLIC`: Accessible for read-only browsing by unauthenticated users or any authenticated user.
  - `PRIVATE`: Strictly accessible only to approved workspace members.
- **Projects**:
  - `PUBLIC`: Accessible for reading publicly.
  - `WORKSPACE_INHERITED`: Accessible to all members of the parent workspace.
  - `PRIVATE`: Accessible strictly to explicit project members.

### 1.2 Threaded Comments Architecture
- Supports top-level comments and 1-level nested replies (`parentCommentId != null`).
- Nested replies to a reply are strictly rejected (`400 Bad Request`).
- Comments support soft deletion (`isDeleted = true`) and pinning (`isPinned = true`).

---

## 2. API Endpoints

### 2.1 Workspace Endpoints

#### List Workspaces
`GET /api/workspaces`
- **Query Parameters**:
  - `page` (int, default: 0)
  - `size` (int, default: 20)
  - `search` (string, optional)
- **Response**: `PageResponse<WorkspaceResponse>`

#### Create Workspace
`POST /api/workspaces`
- **Body**:
```json
{
  "name": "Arid Land Governance Lab",
  "slug": "arid-land-governance-lab",
  "description": "Collaborative research on drought resilience and land distribution.",
  "institution": "ICAR-CAZRI",
  "visibility": "PRIVATE"
}
```
- **Response**: `WorkspaceResponse` (HTTP 201 Created)

#### Get Workspace by ID or Slug
`GET /api/workspaces/{idOrSlug}`
- **Security**: Public if workspace is `PUBLIC`; Requires membership if `PRIVATE`.

#### Update Workspace
`PUT /api/workspaces/{id}`
- **Security**: Requires Workspace `ADMIN` or `OWNER`.

#### Transfer Workspace Ownership
`POST /api/workspaces/{id}/transfer-ownership`
- **Security**: Workspace `OWNER` only.
- **Body**:
```json
{
  "newOwnerUserId": "0a2abda9-ff8b-4897-8536-80d7468ae7e0"
}
```

#### Delete Workspace
`DELETE /api/workspaces/{id}`
- **Security**: Workspace `OWNER` only.

---

### 2.2 Workspace Membership Endpoints

#### List Workspace Members
`GET /api/workspaces/{id}/members`

#### Add Workspace Member
`POST /api/workspaces/{id}/members`
- **Body**:
```json
{
  "userId": "0a2abda9-ff8b-4897-8536-80d7468ae7e0",
  "role": "MEMBER"
}
```

#### Update Workspace Member Role
`PUT /api/workspaces/{id}/members/{userId}`
- **Body**:
```json
{
  "role": "ADMIN"
}
```

#### Remove Workspace Member
`DELETE /api/workspaces/{id}/members/{userId}`

---

### 2.3 Project Endpoints

#### List Workspace Projects
`GET /api/workspaces/{workspaceId}/projects`
- **Query Parameters**: `page`, `size`, `search`, `status`

#### Create Project
`POST /api/workspaces/{workspaceId}/projects`
- **Body**:
```json
{
  "title": "Bundelkhand Cadastral Spatial Analysis",
  "slug": "bundelkhand-cadastral-spatial-analysis",
  "description": "Correlating drought indices with land ownership fragmentation.",
  "visibility": "WORKSPACE_INHERITED"
}
```

#### Get Project by ID
`GET /api/projects/{projectId}`

#### Update Project
`PUT /api/projects/{projectId}`

#### Delete Project
`DELETE /api/projects/{projectId}`

---

### 2.4 Project Membership Endpoints

#### List Project Members
`GET /api/projects/{projectId}/members`

#### Add Project Member
`POST /api/projects/{projectId}/members`
- **Requirement**: The target user must already be an active member of the parent workspace.
- **Body**:
```json
{
  "userId": "0a2abda9-ff8b-4897-8536-80d7468ae7e0",
  "role": "CONTRIBUTOR"
}
```

#### Update Project Member Role
`PUT /api/projects/{projectId}/members/{userId}`

#### Remove Project Member
`DELETE /api/projects/{projectId}/members/{userId}`

---

### 2.5 Threaded Comments Endpoints

#### List Project Comments
`GET /api/projects/{projectId}/comments`
- Returns threaded hierarchy (root comments with nested `replies`).

#### Add Comment / Reply
`POST /api/projects/{projectId}/comments`
- **Body**:
```json
{
  "content": "Reviewing parcel MP-IND-2026-LIVE-02 boundary alignment.",
  "parentCommentId": null
}
```

#### Pin / Unpin Comment
`PUT /api/projects/{projectId}/comments/{commentId}/pin`
- **Body**: `{"isPinned": true}`

#### Delete Comment
`DELETE /api/projects/{projectId}/comments/{commentId}`
- Soft deletes the comment content (`[Comment deleted]`) while preserving child reply threads.

---

### 2.6 Project Resource Linking Endpoints

#### Link / Unlink Land Record
- `POST /api/projects/{projectId}/land-records/{landRecordId}`
- `DELETE /api/projects/{projectId}/land-records/{landRecordId}`

#### Link / Unlink Research Document
- `POST /api/projects/{projectId}/research-documents/{documentId}`
- `DELETE /api/projects/{projectId}/research-documents/{documentId}`

#### Link / Unlink Shared Dataset
- `POST /api/projects/{projectId}/datasets/{datasetId}`
- `DELETE /api/projects/{projectId}/datasets/{datasetId}`

---

### 2.7 Saved Research (User Bookmarks) Endpoints

#### List User's Saved Research
`GET /api/saved-research`
- Returns personal bookmarks isolated to the authenticated user.

#### Save Research Item
`POST /api/saved-research`
- Requires at least one of `researchDocumentId` or `documentChunkId`.
- **Body**:
```json
{
  "researchDocumentId": "1e3e93f3-123f-428d-8817-4c80830e29f7",
  "documentChunkId": null,
  "title": "Cadastral Dispute Standard Reference",
  "notes": "Chapter 4 defines boundary verification tolerances.",
  "tags": "cadastral,tolerance,dispute"
}
```

#### Update Saved Research
`PUT /api/saved-research/{id}`

#### Delete Saved Research
`DELETE /api/saved-research/{id}`

---

### 2.8 Shared Datasets Endpoints

#### List Workspace Datasets
`GET /api/workspaces/{workspaceId}/datasets`

#### Create Shared Dataset
`POST /api/workspaces/{workspaceId}/datasets`
- **Body**:
```json
{
  "title": "Bundelkhand Rainfall & Groundwater 2020-2025",
  "description": "Time-series precipitation and water table measurements.",
  "format": "CSV",
  "storageUrl": "https://storage.example.org/datasets/bundelkhand_water.csv",
  "metadataJson": "{\"resolution\":\"5km\",\"columns\":[\"station_id\",\"date\",\"rainfall_mm\"]}"
}
```

#### Get Dataset by ID
`GET /api/datasets/{datasetId}`

#### Delete Dataset
`DELETE /api/datasets/{datasetId}`
