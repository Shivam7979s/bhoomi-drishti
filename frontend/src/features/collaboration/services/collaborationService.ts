import {
  getJson,
  getJsonWithParams,
  postJson,
  putJson,
  deleteJson,
} from '../../../services/apiClient';
import type {
  Workspace,
  WorkspaceMember,
  Project,
  ProjectMember,
  ProjectComment,
  ProjectLandRecord,
  ProjectResearchDocument,
  ProjectSharedDataset,
  SharedDataset,
  SavedResearch,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  TransferOwnershipRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateCommentRequest,
  LinkLandRecordRequest,
  LinkResearchDocumentRequest,
  CreateSharedDatasetRequest,
  CreateSavedResearchRequest,
  UpdateSavedResearchRequest,
  WorkspaceRole,
  ProjectRole,
} from '../types';

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ================= WORKSPACES =================

export async function listWorkspaces(
  memberOnly = false,
  page = 0,
  size = 20
): Promise<PageResponse<Workspace>> {
  return getJsonWithParams<PageResponse<Workspace>>('/api/workspaces', {
    memberOnly: memberOnly ? 'true' : undefined,
    page,
    size,
  });
}

export async function getWorkspace(idOrSlug: string): Promise<Workspace> {
  return getJson<Workspace>(`/api/workspaces/${encodeURIComponent(idOrSlug)}`);
}

export async function createWorkspace(req: CreateWorkspaceRequest): Promise<Workspace> {
  return postJson<Workspace>('/api/workspaces', req);
}

export async function updateWorkspace(id: string, req: UpdateWorkspaceRequest): Promise<Workspace> {
  return putJson<Workspace>(`/api/workspaces/${id}`, req);
}

export async function archiveWorkspace(id: string): Promise<void> {
  return deleteJson<void>(`/api/workspaces/${id}`);
}

export async function transferWorkspaceOwnership(
  id: string,
  req: TransferOwnershipRequest
): Promise<Workspace> {
  return postJson<Workspace>(`/api/workspaces/${id}/transfer-ownership`, req);
}

export async function listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  return getJson<WorkspaceMember[]>(`/api/workspaces/${workspaceId}/members`);
}

export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole
): Promise<WorkspaceMember> {
  return postJson<WorkspaceMember>(`/api/workspaces/${workspaceId}/members`, { userId, role });
}

export async function updateWorkspaceMemberRole(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole
): Promise<WorkspaceMember> {
  return putJson<WorkspaceMember>(`/api/workspaces/${workspaceId}/members/${userId}`, { role });
}

export async function removeWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
  return deleteJson<void>(`/api/workspaces/${workspaceId}/members/${userId}`);
}

// ================= PROJECTS =================

export async function listWorkspaceProjects(
  workspaceId: string,
  page = 0,
  size = 20
): Promise<PageResponse<Project>> {
  return getJsonWithParams<PageResponse<Project>>(`/api/workspaces/${workspaceId}/projects`, {
    page,
    size,
  });
}

export async function getProject(projectId: string): Promise<Project> {
  return getJson<Project>(`/api/projects/${projectId}`);
}

export async function createProject(
  workspaceId: string,
  req: CreateProjectRequest
): Promise<Project> {
  return postJson<Project>(`/api/workspaces/${workspaceId}/projects`, req);
}

export async function updateProject(projectId: string, req: UpdateProjectRequest): Promise<Project> {
  return putJson<Project>(`/api/projects/${projectId}`, req);
}

export async function archiveProject(projectId: string): Promise<void> {
  return deleteJson<void>(`/api/projects/${projectId}`);
}

export async function listProjectMembers(projectId: string): Promise<ProjectMember[]> {
  return getJson<ProjectMember[]>(`/api/projects/${projectId}/members`);
}

export async function addProjectMember(
  projectId: string,
  userId: string,
  role: ProjectRole
): Promise<ProjectMember> {
  return postJson<ProjectMember>(`/api/projects/${projectId}/members`, { userId, role });
}

export async function updateProjectMemberRole(
  projectId: string,
  userId: string,
  role: ProjectRole
): Promise<ProjectMember> {
  return putJson<ProjectMember>(`/api/projects/${projectId}/members/${userId}`, { role });
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  return deleteJson<void>(`/api/projects/${projectId}/members/${userId}`);
}

// ================= LINKAGES =================

export async function listProjectLandRecords(projectId: string): Promise<ProjectLandRecord[]> {
  return getJson<ProjectLandRecord[]>(`/api/projects/${projectId}/land-records`);
}

export async function linkLandRecord(
  projectId: string,
  req: LinkLandRecordRequest
): Promise<ProjectLandRecord> {
  return postJson<ProjectLandRecord>(`/api/projects/${projectId}/land-records`, req);
}

export async function unlinkLandRecord(projectId: string, landRecordId: string): Promise<void> {
  return deleteJson<void>(`/api/projects/${projectId}/land-records/${landRecordId}`);
}

export async function listProjectResearchDocuments(
  projectId: string
): Promise<ProjectResearchDocument[]> {
  return getJson<ProjectResearchDocument[]>(`/api/projects/${projectId}/research-documents`);
}

export async function linkResearchDocument(
  projectId: string,
  req: LinkResearchDocumentRequest
): Promise<ProjectResearchDocument> {
  return postJson<ProjectResearchDocument>(`/api/projects/${projectId}/research-documents`, req);
}

export async function unlinkResearchDocument(
  projectId: string,
  researchDocumentId: string
): Promise<void> {
  return deleteJson<void>(`/api/projects/${projectId}/research-documents/${researchDocumentId}`);
}

export async function listProjectDatasets(projectId: string): Promise<ProjectSharedDataset[]> {
  return getJson<ProjectSharedDataset[]>(`/api/projects/${projectId}/datasets`);
}

export async function linkDataset(
  projectId: string,
  datasetId: string
): Promise<ProjectSharedDataset> {
  return postJson<ProjectSharedDataset>(`/api/projects/${projectId}/datasets/${datasetId}`);
}

export async function unlinkDataset(projectId: string, datasetId: string): Promise<void> {
  return deleteJson<void>(`/api/projects/${projectId}/datasets/${datasetId}`);
}

// ================= COMMENTS =================

export async function listProjectComments(projectId: string): Promise<ProjectComment[]> {
  return getJson<ProjectComment[]>(`/api/projects/${projectId}/comments`);
}

export async function createComment(
  projectId: string,
  req: CreateCommentRequest
): Promise<ProjectComment> {
  return postJson<ProjectComment>(`/api/projects/${projectId}/comments`, req);
}

export async function updateComment(commentId: string, content: string): Promise<ProjectComment> {
  return putJson<ProjectComment>(`/api/projects/comments/${commentId}`, { content });
}

export async function deleteComment(commentId: string): Promise<void> {
  return deleteJson<void>(`/api/projects/comments/${commentId}`);
}

// ================= SAVED RESEARCH =================

export async function listSavedResearch(page = 0, size = 20): Promise<PageResponse<SavedResearch>> {
  return getJsonWithParams<PageResponse<SavedResearch>>('/api/saved-research', { page, size });
}

export async function getSavedResearch(id: string): Promise<SavedResearch> {
  return getJson<SavedResearch>(`/api/saved-research/${id}`);
}

export async function saveResearch(req: CreateSavedResearchRequest): Promise<SavedResearch> {
  return postJson<SavedResearch>('/api/saved-research', req);
}

export async function updateSavedResearch(
  id: string,
  req: UpdateSavedResearchRequest
): Promise<SavedResearch> {
  return putJson<SavedResearch>(`/api/saved-research/${id}`, req);
}

export async function deleteSavedResearch(id: string): Promise<void> {
  return deleteJson<void>(`/api/saved-research/${id}`);
}

// ================= SHARED DATASETS =================

export async function listWorkspaceDatasets(
  workspaceId: string,
  page = 0,
  size = 20
): Promise<PageResponse<SharedDataset>> {
  return getJsonWithParams<PageResponse<SharedDataset>>(
    `/api/workspaces/${workspaceId}/datasets`,
    { page, size }
  );
}

export async function getDataset(id: string): Promise<SharedDataset> {
  return getJson<SharedDataset>(`/api/datasets/${id}`);
}

export async function createDataset(
  workspaceId: string,
  req: CreateSharedDatasetRequest
): Promise<SharedDataset> {
  return postJson<SharedDataset>(`/api/workspaces/${workspaceId}/datasets`, req);
}

export async function deleteDataset(id: string): Promise<void> {
  return deleteJson<void>(`/api/datasets/${id}`);
}
