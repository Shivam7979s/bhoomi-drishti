import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  FileText,
  Database,
  MessageSquare,
  Users,
  Plus,
  Trash2,
  Edit2,
  Reply,
  Shield,
  ArrowLeft,
  ExternalLink,
  Send,
  Layers,
} from 'lucide-react';
import { ProjectScenariosTab } from '../../policy/components/ProjectScenariosTab';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  getProject,
  listProjectMembers,
  addProjectMember,
  removeProjectMember,
  listProjectLandRecords,
  linkLandRecord,
  unlinkLandRecord,
  listProjectResearchDocuments,
  linkResearchDocument,
  unlinkResearchDocument,
  listProjectDatasets,
  linkDataset,
  unlinkDataset,
  listProjectComments,
  createComment,
  updateComment,
  deleteComment,
  listWorkspaceDatasets,
  listWorkspaceMembers,
} from '../services/collaborationService';
import type {
  Project,
  ProjectMember,
  ProjectLandRecord,
  ProjectResearchDocument,
  ProjectSharedDataset,
  ProjectComment,
  SharedDataset,
  WorkspaceMember,
  ProjectRole,
} from '../types';

export function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user: currentUser } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'parcels' | 'research' | 'datasets' | 'comments' | 'members' | 'scenarios'>('parcels');

  // Parcels
  const [parcels, setParcels] = useState<ProjectLandRecord[]>([]);
  const [loadingParcels, setLoadingParcels] = useState(false);
  const [showParcelModal, setShowParcelModal] = useState(false);
  const [parcelIdInput, setParcelIdInput] = useState('');
  const [parcelNotesInput, setParcelNotesInput] = useState('');
  const [linkingParcel, setLinkingParcel] = useState(false);

  // Research Docs
  const [researchDocs, setResearchDocs] = useState<ProjectResearchDocument[]>([]);
  const [loadingResearch, setLoadingResearch] = useState(false);
  const [showResearchModal, setShowResearchModal] = useState(false);
  const [researchIdInput, setResearchIdInput] = useState('');
  const [researchNotesInput, setResearchNotesInput] = useState('');
  const [linkingResearch, setLinkingResearch] = useState(false);

  // Datasets
  const [datasets, setDatasets] = useState<ProjectSharedDataset[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [workspaceDatasets, setWorkspaceDatasets] = useState<SharedDataset[]>([]);
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [linkingDataset, setLinkingDataset] = useState(false);

  // Comments
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Members
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMemberUserId, setSelectedMemberUserId] = useState('');
  const [selectedMemberRole, setSelectedMemberRole] = useState<ProjectRole>('CONTRIBUTOR');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (!project) return;
    if (activeTab === 'parcels') loadParcels();
    if (activeTab === 'research') loadResearch();
    if (activeTab === 'datasets') loadDatasets();
    if (activeTab === 'comments') loadComments();
    if (activeTab === 'members') loadMembers();
  }, [activeTab, project?.id]);

  async function loadProject() {
    setLoading(true);
    setError(null);
    try {
      const p = await getProject(projectId!);
      setProject(p);
    } catch (err: any) {
      setError(err?.message || 'Project not found');
    } finally {
      setLoading(false);
    }
  }

  async function loadParcels() {
    if (!projectId) return;
    setLoadingParcels(true);
    try {
      const list = await listProjectLandRecords(projectId);
      setParcels(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingParcels(false);
    }
  }

  async function loadResearch() {
    if (!projectId) return;
    setLoadingResearch(true);
    try {
      const list = await listProjectResearchDocuments(projectId);
      setResearchDocs(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingResearch(false);
    }
  }

  async function loadDatasets() {
    if (!projectId) return;
    setLoadingDatasets(true);
    try {
      const list = await listProjectDatasets(projectId);
      setDatasets(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDatasets(false);
    }
  }

  async function loadComments() {
    if (!projectId) return;
    setLoadingComments(true);
    try {
      const list = await listProjectComments(projectId);
      setComments(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  }

  async function loadMembers() {
    if (!projectId) return;
    setLoadingMembers(true);
    try {
      const list = await listProjectMembers(projectId);
      setMembers(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  }

  const isLead = project?.currentUserRole === 'LEAD';
  const canContribute = isLead || project?.currentUserRole === 'CONTRIBUTOR';

  // --- Handlers ---

  async function handleLinkParcel(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !parcelIdInput.trim()) return;

    setLinkingParcel(true);
    try {
      await linkLandRecord(projectId, {
        landRecordId: parcelIdInput.trim(),
        contextNotes: parcelNotesInput.trim() || undefined,
      });
      setShowParcelModal(false);
      setParcelIdInput('');
      setParcelNotesInput('');
      await loadParcels();
    } catch (err: any) {
      alert(err?.message || 'Failed to link land record');
    } finally {
      setLinkingParcel(false);
    }
  }

  async function handleUnlinkParcel(landRecordId: string) {
    if (!projectId || !window.confirm('Unlink this parcel from the project?')) return;
    try {
      await unlinkLandRecord(projectId, landRecordId);
      await loadParcels();
    } catch (err: any) {
      alert(err?.message || 'Failed to unlink land record');
    }
  }

  async function handleLinkResearch(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !researchIdInput.trim()) return;

    setLinkingResearch(true);
    try {
      await linkResearchDocument(projectId, {
        researchDocumentId: researchIdInput.trim(),
        relevanceNotes: researchNotesInput.trim() || undefined,
      });
      setShowResearchModal(false);
      setResearchIdInput('');
      setResearchNotesInput('');
      await loadResearch();
    } catch (err: any) {
      alert(err?.message || 'Failed to link research document');
    } finally {
      setLinkingResearch(false);
    }
  }

  async function handleUnlinkResearch(docId: string) {
    if (!projectId || !window.confirm('Unlink this research document?')) return;
    try {
      await unlinkResearchDocument(projectId, docId);
      await loadResearch();
    } catch (err: any) {
      alert(err?.message || 'Failed to unlink research document');
    }
  }

  async function openLinkDatasetModal() {
    if (!project) return;
    try {
      const res = await listWorkspaceDatasets(project.workspaceId);
      setWorkspaceDatasets(res.content);
      setShowDatasetModal(true);
    } catch (err: any) {
      alert('Failed to load workspace datasets');
    }
  }

  async function handleLinkDataset(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !selectedDatasetId) return;

    setLinkingDataset(true);
    try {
      await linkDataset(projectId, selectedDatasetId);
      setShowDatasetModal(false);
      setSelectedDatasetId('');
      await loadDatasets();
    } catch (err: any) {
      alert(err?.message || 'Failed to link dataset');
    } finally {
      setLinkingDataset(false);
    }
  }

  async function handleUnlinkDataset(datasetId: string) {
    if (!projectId || !window.confirm('Unlink this dataset?')) return;
    try {
      await unlinkDataset(projectId, datasetId);
      await loadDatasets();
    } catch (err: any) {
      alert(err?.message || 'Failed to unlink dataset');
    }
  }

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !newCommentText.trim()) return;

    setPostingComment(true);
    try {
      await createComment(projectId, { content: newCommentText.trim() });
      setNewCommentText('');
      await loadComments();
    } catch (err: any) {
      alert(err?.message || 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  }

  async function handlePostReply(parentCommentId: string) {
    if (!projectId || !replyText.trim()) return;

    try {
      await createComment(projectId, {
        content: replyText.trim(),
        parentCommentId,
      });
      setReplyText('');
      setReplyingToId(null);
      await loadComments();
    } catch (err: any) {
      alert(err?.message || 'Failed to post reply');
    }
  }

  async function handleUpdateComment(commentId: string) {
    if (!editText.trim()) return;
    try {
      await updateComment(commentId, editText.trim());
      setEditingCommentId(null);
      await loadComments();
    } catch (err: any) {
      alert(err?.message || 'Failed to edit comment');
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(commentId);
      await loadComments();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete comment');
    }
  }

  async function openAddMemberModal() {
    if (!project) return;
    try {
      const list = await listWorkspaceMembers(project.workspaceId);
      setWorkspaceMembers(list);
      setShowMemberModal(true);
    } catch (err: any) {
      alert('Failed to load workspace members');
    }
  }

  async function handleAddProjectMember(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !selectedMemberUserId) return;

    setAddingMember(true);
    try {
      await addProjectMember(projectId, selectedMemberUserId, selectedMemberRole);
      setShowMemberModal(false);
      setSelectedMemberUserId('');
      await loadMembers();
    } catch (err: any) {
      alert(err?.message || 'Failed to add project member');
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveProjectMember(userId: string) {
    if (!projectId || !window.confirm('Remove this member from the project?')) return;
    try {
      await removeProjectMember(projectId, userId);
      await loadMembers();
    } catch (err: any) {
      alert(err?.message || 'Failed to remove member');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <h2 className="text-lg font-bold">Project Unavailable</h2>
        <p className="mt-1 text-sm">{error || 'Project not found or access restricted.'}</p>
        <Link
          to="/workspaces"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Workspaces
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/workspaces" className="hover:text-slate-800">
          Workspaces
        </Link>
        <span>/</span>
        <Link to={`/workspaces/${project.workspaceId}`} className="hover:text-slate-800">
          {project.workspaceName || 'Workspace'}
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">{project.name}</span>
      </div>

      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {project.status}
              </span>
              <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                {project.visibility}
              </span>
              {project.currentUserRole && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  <Shield className="h-3 w-3" /> {project.currentUserRole}
                </span>
              )}
            </div>

            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              {project.name}
            </h1>

            {project.description && (
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('parcels')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'parcels'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <MapPin className="h-4 w-4" />
          Linked Parcels ({parcels.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('research')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'research'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="h-4 w-4" />
          Linked Research ({researchDocs.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('datasets')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'datasets'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Database className="h-4 w-4" />
          Datasets ({datasets.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('comments')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'comments'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Discussion
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'members'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="h-4 w-4" />
          Members ({members.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scenarios')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'scenarios'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="h-4 w-4" />
          Policy Scenarios
        </button>
      </div>

      {/* TAB 1: PARCELS */}
      {activeTab === 'parcels' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Land parcels under active audit, research analysis, or cross-referencing.
            </p>
            {canContribute && (
              <button
                type="button"
                onClick={() => setShowParcelModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Link Parcel
              </button>
            )}
          </div>

          {loadingParcels ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            </div>
          ) : parcels.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <MapPin className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-2 text-sm font-semibold text-slate-800">No parcels linked</h3>
              <p className="mt-1 text-xs text-slate-500">
                Link land parcels directly from GIS map or enter a land record ID.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Parcel / Khasra</th>
                    <th className="px-6 py-3">Location</th>
                    <th className="px-6 py-3">Area (sq m)</th>
                    <th className="px-6 py-3">Land Use</th>
                    <th className="px-6 py-3">Context Notes</th>
                    {canContribute && <th className="px-6 py-3 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parcels.map((p) => (
                    <tr key={p.landRecordId} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {p.parcelNumber}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {p.village}, {p.tehsil}, {p.district}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        {p.areaAcres ? p.areaAcres.toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        {p.landUseType || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 italic">
                        {p.contextNotes || '—'}
                      </td>
                      {canContribute && (
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleUnlinkParcel(p.landRecordId)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Unlink
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RESEARCH */}
      {activeTab === 'research' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Research publications, court rulings, and policy documents linked to this project.
            </p>
            {canContribute && (
              <button
                type="button"
                onClick={() => setShowResearchModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Link Research Doc
              </button>
            )}
          </div>

          {loadingResearch ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            </div>
          ) : researchDocs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-2 text-sm font-semibold text-slate-800">No research documents linked</h3>
              <p className="mt-1 text-xs text-slate-500">
                Link articles from the Research Hub to anchor land intelligence in verified sources.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
              {researchDocs.map((doc) => (
                <div key={doc.researchDocumentId} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="rounded bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700 border border-teal-200">
                      {doc.documentType || 'DOCUMENT'}
                    </span>
                    <h4 className="mt-1 text-sm font-bold text-slate-900">{doc.title}</h4>
                    <p className="text-xs text-slate-500">
                      {doc.authors} {doc.organization && `· ${doc.organization}`}
                    </p>
                    {doc.relevanceNotes && (
                      <p className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-600 italic">
                        "{doc.relevanceNotes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      to="/research"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                    >
                      View in Hub <ExternalLink className="h-3 w-3" />
                    </Link>
                    {canContribute && (
                      <button
                        type="button"
                        onClick={() => handleUnlinkResearch(doc.researchDocumentId)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Unlink
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DATASETS */}
      {activeTab === 'datasets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Datasets linked from the parent workspace catalog.
            </p>
            {canContribute && (
              <button
                type="button"
                onClick={openLinkDatasetModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Link Workspace Dataset
              </button>
            )}
          </div>

          {loadingDatasets ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            </div>
          ) : datasets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Database className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-2 text-sm font-semibold text-slate-800">No datasets linked</h3>
              <p className="mt-1 text-xs text-slate-500">
                Link GeoJSON, shapefiles, or API catalogs from {project.workspaceName}.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
              {datasets.map((ds) => (
                <div key={ds.sharedDatasetId} className="flex items-center justify-between p-5">
                  <div>
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                      {ds.format}
                    </span>
                    <h4 className="mt-1 text-sm font-bold text-slate-900">{ds.title}</h4>
                    <p className="text-xs text-slate-500">{ds.description}</p>
                  </div>
                  {canContribute && (
                    <button
                      type="button"
                      onClick={() => handleUnlinkDataset(ds.sharedDatasetId)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Unlink
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COMMENTS (THREADED, 1-LEVEL REPLIES) */}
      {activeTab === 'comments' && (
        <div className="space-y-6">
          {/* Post top comment */}
          {canContribute && (
            <form onSubmit={handlePostComment} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className="block text-xs font-semibold text-slate-700">Project Discussion & Findings</label>
              <textarea
                required
                rows={3}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Share evidence analysis, field observations, or methodology notes..."
                className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-emerald-500 focus:outline-none"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={postingComment}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {postingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          )}

          {loadingComments ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            </div>
          ) : comments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-2 text-sm font-semibold text-slate-800">No comments yet</h3>
              <p className="mt-1 text-xs text-slate-500">
                Start the collaborative conversation on this project.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => {
                const isAuthor = currentUser?.id === comment.userId;
                return (
                  <div key={comment.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                    {/* Top Comment Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{comment.userName}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                        {comment.isEdited && (
                          <span className="text-xs text-slate-400 italic">(edited)</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        {isAuthor && editingCommentId !== comment.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditText(comment.content);
                            }}
                            className="text-slate-500 hover:text-slate-800"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {(isAuthor || isLead) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-slate-500 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Top Comment Body */}
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full rounded border border-slate-300 p-2 text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateComment(comment.id)}
                            className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCommentId(null)}
                            className="rounded border border-slate-300 px-3 py-1 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{comment.content}</p>
                    )}

                    {/* Reply Action */}
                    {canContribute && replyingToId !== comment.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToId(comment.id);
                          setReplyText('');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline pt-1"
                      >
                        <Reply className="h-3 w-3" /> Reply
                      </button>
                    )}

                    {/* Inline Reply Input */}
                    {replyingToId === comment.id && (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                        <textarea
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={`Replying to ${comment.userName}...`}
                          className="w-full rounded border border-slate-300 p-2 text-xs focus:outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setReplyingToId(null)}
                            className="rounded border border-slate-300 px-2.5 py-1 text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePostReply(comment.id)}
                            className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                          >
                            Send Reply
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Nested Replies (1 level only) */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 space-y-3 border-l-2 border-emerald-200 pl-4 pt-2">
                        {comment.replies.map((reply) => {
                          const isReplyAuthor = currentUser?.id === reply.userId;
                          return (
                            <div key={reply.id} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-900 text-xs">
                                    {reply.userName}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {new Date(reply.createdAt).toLocaleString()}
                                  </span>
                                  {reply.isEdited && (
                                    <span className="text-[11px] text-slate-400 italic">(edited)</span>
                                  )}
                                </div>
                                {(isReplyAuthor || isLead) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(reply.id)}
                                    className="text-slate-400 hover:text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-slate-700 whitespace-pre-wrap">{reply.content}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Users assigned to this project (must be workspace members).
            </p>
            {isLead && (
              <button
                type="button"
                onClick={openAddMemberModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Assign Member
              </button>
            )}
          </div>

          {loadingMembers ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Member</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Assigned</th>
                    {isLead && <th className="px-6 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{m.userName}</td>
                      <td className="px-6 py-4">
                        <span className="rounded bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                          {m.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(m.joinedAt).toLocaleDateString()}
                      </td>
                      {isLead && (
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveProjectMember(m.userId)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: POLICY SCENARIOS */}
      {activeTab === 'scenarios' && (
        <ProjectScenariosTab
          projectId={projectId!}
          canContribute={canContribute}
        />
      )}

      {/* LINK PARCEL MODAL */}
      {showParcelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">Link Land Record</h2>
            <p className="mt-1 text-xs text-slate-500">
              Attach a cadastral land record to this project.
            </p>

            <form onSubmit={handleLinkParcel} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Land Record ID (UUID) *</label>
                <input
                  type="text"
                  required
                  value={parcelIdInput}
                  onChange={(e) => setParcelIdInput(e.target.value)}
                  placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Context Notes</label>
                <textarea
                  rows={2}
                  value={parcelNotesInput}
                  onChange={(e) => setParcelNotesInput(e.target.value)}
                  placeholder="Reason for inclusion in this study..."
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowParcelModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkingParcel}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {linkingParcel ? 'Linking...' : 'Link Parcel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINK RESEARCH MODAL */}
      {showResearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">Link Research Document</h2>
            <p className="mt-1 text-xs text-slate-500">
              Attach a Research Hub document to this project dossier.
            </p>

            <form onSubmit={handleLinkResearch} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Research Document ID (UUID) *</label>
                <input
                  type="text"
                  required
                  value={researchIdInput}
                  onChange={(e) => setResearchIdInput(e.target.value)}
                  placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Relevance Notes</label>
                <textarea
                  rows={2}
                  value={researchNotesInput}
                  onChange={(e) => setResearchNotesInput(e.target.value)}
                  placeholder="Key takeaway or section cited..."
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResearchModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkingResearch}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {linkingResearch ? 'Linking...' : 'Link Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINK DATASET MODAL */}
      {showDatasetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">Link Workspace Dataset</h2>
            <p className="mt-1 text-xs text-slate-500">
              Select a dataset registered in {project.workspaceName}.
            </p>

            <form onSubmit={handleLinkDataset} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Select Dataset *</label>
                <select
                  required
                  value={selectedDatasetId}
                  onChange={(e) => setSelectedDatasetId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Choose dataset --</option>
                  {workspaceDatasets.map((ds) => (
                    <option key={ds.id} value={ds.id}>
                      {ds.title} ({ds.format})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDatasetModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkingDataset || !selectedDatasetId}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {linkingDataset ? 'Linking...' : 'Link Dataset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN MEMBER MODAL */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">Assign Member to Project</h2>
            <p className="mt-1 text-xs text-slate-500">
              Choose an active member from the parent workspace.
            </p>

            <form onSubmit={handleAddProjectMember} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Select Workspace Member *</label>
                <select
                  required
                  value={selectedMemberUserId}
                  onChange={(e) => setSelectedMemberUserId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Choose member --</option>
                  {workspaceMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.userName} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Project Role</label>
                <select
                  value={selectedMemberRole}
                  onChange={(e) => setSelectedMemberRole(e.target.value as ProjectRole)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="CONTRIBUTOR">CONTRIBUTOR (Can link parcels & comment)</option>
                  <option value="LEAD">LEAD (Full project administration)</option>
                  <option value="VIEWER">VIEWER (Read-only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMember || !selectedMemberUserId}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {addingMember ? 'Assigning...' : 'Assign Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
