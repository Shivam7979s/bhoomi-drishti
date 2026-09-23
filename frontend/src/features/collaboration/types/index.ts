export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type WorkspaceVisibility = 'PRIVATE' | 'WORKSPACE_MEMBERS' | 'PUBLIC';
export type WorkspaceStatus = 'ACTIVE' | 'ARCHIVED';

export type ProjectRole = 'LEAD' | 'CONTRIBUTOR' | 'VIEWER';
export type ProjectVisibility = 'WORKSPACE_INHERITED' | 'PRIVATE_TO_PROJECT_MEMBERS' | 'PUBLIC';
export type ProjectStatus = 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';

export type DatasetFormat =
  | 'GEOJSON'
  | 'SHAPEFILE'
  | 'CSV'
  | 'GEOTIFF'
  | 'KML'
  | 'API_ENDPOINT'
  | 'OTHER';

export interface UserSummary {
  id: string;
  name: string;
  email?: string | null;
  role?: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  institution?: string;
  visibility: WorkspaceVisibility;
  status: WorkspaceStatus;
  createdBy?: UserSummary;
  memberCount: number;
  projectCount: number;
  currentUserRole?: WorkspaceRole | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  userEmail?: string | null;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  workspaceName?: string;
  name: string;
  slug: string;
  description?: string;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  createdBy?: UserSummary;
  memberCount: number;
  landRecordCount: number;
  researchDocCount: number;
  datasetCount: number;
  commentCount: number;
  currentUserRole?: ProjectRole | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userEmail?: string | null;
  role: ProjectRole;
  joinedAt: string;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  content: string;
  isEdited: boolean;
  isPinned: boolean;
  parentCommentId?: string | null;
  createdAt: string;
  updatedAt: string;
  replies?: ProjectComment[];
}

export interface ProjectLandRecord {
  projectId: string;
  landRecordId: string;
  parcelNumber: string;
  state: string;
  district: string;
  tehsil: string;
  village: string;
  areaAcres?: number;
  landUseType?: string;
  status?: string;
  contextNotes?: string;
  addedBy?: UserSummary;
  addedAt: string;
}

export interface ProjectResearchDocument {
  projectId: string;
  researchDocumentId: string;
  title: string;
  documentType?: string;
  authors?: string;
  organization?: string;
  publicationDate?: string;
  relevanceNotes?: string;
  addedBy?: UserSummary;
  addedAt: string;
}

export interface ProjectSharedDataset {
  projectId: string;
  sharedDatasetId: string;
  title: string;
  description: string;
  format: DatasetFormat;
  sourceUrl?: string;
  recordCount?: number;
  addedAt: string;
}

export interface SharedDataset {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  format: DatasetFormat;
  sourceUrl?: string;
  spatialCoverage?: string;
  temporalCoverage?: string;
  license?: string;
  recordCount?: number;
  fileSizeBytes?: number;
  createdBy?: UserSummary;
  createdAt: string;
  updatedAt: string;
}

export interface SavedResearch {
  id: string;
  userId: string;
  researchDocumentId?: string | null;
  documentTitle?: string | null;
  documentChunkId?: string | null;
  title: string;
  notes?: string;
  tags?: string;
  createdAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  slug?: string;
  description?: string;
  institution?: string;
  visibility?: WorkspaceVisibility;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
  institution?: string;
  visibility?: WorkspaceVisibility;
  status?: WorkspaceStatus;
}

export interface TransferOwnershipRequest {
  newOwnerUserId: string;
}

export interface CreateProjectRequest {
  name: string;
  slug?: string;
  description?: string;
  visibility?: ProjectVisibility;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  visibility?: ProjectVisibility;
}

export interface CreateCommentRequest {
  content: string;
  parentCommentId?: string;
}

export interface LinkLandRecordRequest {
  landRecordId: string;
  contextNotes?: string;
}

export interface LinkResearchDocumentRequest {
  researchDocumentId: string;
  relevanceNotes?: string;
}

export interface CreateSharedDatasetRequest {
  title: string;
  description: string;
  format: DatasetFormat;
  sourceUrl?: string;
  spatialCoverage?: string;
  temporalCoverage?: string;
  license?: string;
  recordCount?: number;
  fileSizeBytes?: number;
}

export interface CreateSavedResearchRequest {
  researchDocumentId?: string;
  documentChunkId?: string;
  title: string;
  notes?: string;
  tags?: string;
}

export interface UpdateSavedResearchRequest {
  title: string;
  notes?: string;
  tags?: string;
}
