import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Database,
  Users,
  Settings,
  Plus,
  Lock,
  Globe,
  Shield,
  Building2,
  Trash2,
  ExternalLink,
  ArrowLeft,
  KeyRound,
  FileText,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  getWorkspace,
  updateWorkspace,
  archiveWorkspace,
  transferWorkspaceOwnership,
  listWorkspaceProjects,
  createProject,
  listWorkspaceMembers,
  addWorkspaceMember,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
  listWorkspaceDatasets,
  createDataset,
  deleteDataset,
} from '../services/collaborationService';
import type {
  Workspace,
  Project,
  WorkspaceMember,
  SharedDataset,
  WorkspaceRole,
  ProjectVisibility,
  DatasetFormat,
} from '../types';

export function WorkspaceDashboardPage() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const { isAuthenticated, user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'datasets' | 'members' | 'settings'>('projects');

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projVisibility, setProjVisibility] = useState<ProjectVisibility>('WORKSPACE_INHERITED');
  const [savingProject, setSavingProject] = useState(false);

  // Members state
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<WorkspaceRole>('MEMBER');
  const [savingMember, setSavingMember] = useState(false);

  // Transfer Ownership state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetUserId, setTransferTargetUserId] = useState('');
  const [transferring, setTransferring] = useState(false);

  // Datasets state
  const [datasets, setDatasets] = useState<SharedDataset[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [dsTitle, setDsTitle] = useState('');
  const [dsDesc, setDsDesc] = useState('');
  const [dsFormat, setDsFormat] = useState<DatasetFormat>('GEOJSON');
  const [dsSourceUrl, setDsSourceUrl] = useState('');
  const [dsSpatialCoverage, setDsSpatialCoverage] = useState('');
  const [dsTemporalCoverage, setDsTemporalCoverage] = useState('');
  const [dsLicense, setDsLicense] = useState('');
  const [dsRecordCount, setDsRecordCount] = useState<number | undefined>();
  const [savingDataset, setSavingDataset] = useState(false);

  // Settings state
  const [settingsName, setSettingsName] = useState('');
  const [settingsDesc, setSettingsDesc] = useState('');
  const [settingsInstitution, setSettingsInstitution] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    if (!idOrSlug) return;
    loadWorkspace();
  }, [idOrSlug]);

  useEffect(() => {
    if (!workspace) return;
    if (activeTab === 'projects') loadProjects();
    if (activeTab === 'members') loadMembers();
    if (activeTab === 'datasets') loadDatasets();
    if (activeTab === 'settings') {
      setSettingsName(workspace.name);
      setSettingsDesc(workspace.description || '');
      setSettingsInstitution(workspace.institution || '');
    }
  }, [activeTab, workspace?.id]);

  async function loadWorkspace() {
    setLoading(true);
    setError(null);
    try {
      const ws = await getWorkspace(idOrSlug!);
      setWorkspace(ws);
    } catch (err: any) {
      setError(err?.message || 'Workspace not found');
    } finally {
      setLoading(false);
    }
  }

  async function loadProjects() {
    if (!workspace) return;
    setLoadingProjects(true);
    try {
      const res = await listWorkspaceProjects(workspace.id);
      setProjects(res.content);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProjects(false);
    }
  }

  async function loadMembers() {
    if (!workspace) return;
    setLoadingMembers(true);
    try {
      const list = await listWorkspaceMembers(workspace.id);
      setMembers(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  }

  async function loadDatasets() {
    if (!workspace) return;
    setLoadingDatasets(true);
    try {
      const res = await listWorkspaceDatasets(workspace.id);
      setDatasets(res.content);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDatasets(false);
    }
  }

  const isOwner = workspace?.currentUserRole === 'OWNER';
  const isAdmin = isOwner || workspace?.currentUserRole === 'ADMIN';

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace || !projName.trim()) return;

    setSavingProject(true);
    try {
      await createProject(workspace.id, {
        name: projName.trim(),
        description: projDesc.trim() || undefined,
        visibility: projVisibility,
      });
      setShowProjectModal(false);
      setProjName('');
      setProjDesc('');
      await loadProjects();
    } catch (err: any) {
      alert(err?.message || 'Failed to create project');
    } finally {
      setSavingProject(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace || !newMemberUserId.trim()) return;

    setSavingMember(true);
    try {
      await addWorkspaceMember(workspace.id, newMemberUserId.trim(), newMemberRole);
      setShowAddMemberModal(false);
      setNewMemberUserId('');
      await loadMembers();
    } catch (err: any) {
      alert(err?.message || 'Failed to add member');
    } finally {
      setSavingMember(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: WorkspaceRole) {
    if (!workspace) return;
    try {
      await updateWorkspaceMemberRole(workspace.id, userId, newRole);
      await loadMembers();
    } catch (err: any) {
      alert(err?.message || 'Failed to update member role');
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!workspace || !window.confirm('Remove this member from workspace and its projects?')) return;
    try {
      await removeWorkspaceMember(workspace.id, userId);
      await loadMembers();
    } catch (err: any) {
      alert(err?.message || 'Failed to remove member');
    }
  }

  async function handleTransferOwnership(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace || !transferTargetUserId) return;

    setTransferring(true);
    try {
      await transferWorkspaceOwnership(workspace.id, { newOwnerUserId: transferTargetUserId });
      setShowTransferModal(false);
      await loadWorkspace();
      await loadMembers();
    } catch (err: any) {
      alert(err?.message || 'Failed to transfer ownership');
    } finally {
      setTransferring(false);
    }
  }

  async function handleCreateDataset(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace || !dsTitle.trim()) return;

    setSavingDataset(true);
    try {
      await createDataset(workspace.id, {
        title: dsTitle.trim(),
        description: dsDesc.trim(),
        format: dsFormat,
        sourceUrl: dsSourceUrl.trim() || undefined,
        spatialCoverage: dsSpatialCoverage.trim() || undefined,
        temporalCoverage: dsTemporalCoverage.trim() || undefined,
        license: dsLicense.trim() || undefined,
        recordCount: dsRecordCount,
      });
      setShowDatasetModal(false);
      setDsTitle('');
      setDsDesc('');
      setDsSourceUrl('');
      setDsSpatialCoverage('');
      setDsTemporalCoverage('');
      setDsLicense('');
      setDsRecordCount(undefined);
      await loadDatasets();
    } catch (err: any) {
      alert(err?.message || 'Failed to register dataset');
    } finally {
      setSavingDataset(false);
    }
  }

  async function handleDeleteDataset(id: string) {
    if (!window.confirm('Delete this shared dataset metadata?')) return;
    try {
      await deleteDataset(id);
      await loadDatasets();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete dataset');
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace) return;
    setSettingsSaving(true);
    try {
      await updateWorkspace(workspace.id, {
        name: settingsName.trim(),
        description: settingsDesc.trim() || undefined,
        institution: settingsInstitution.trim() || undefined,
      });
      await loadWorkspace();
      alert('Workspace updated successfully');
    } catch (err: any) {
      alert(err?.message || 'Failed to update workspace');
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleArchive() {
    if (!workspace || !window.confirm('Are you sure you want to archive this workspace?')) return;
    try {
      await archiveWorkspace(workspace.id);
      navigate('/workspaces');
    } catch (err: any) {
      alert(err?.message || 'Failed to archive workspace');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <h2 className="text-lg font-bold">Workspace Unavailable</h2>
        <p className="mt-1 text-sm">{error || 'Workspace could not be found or you do not have permission to view it.'}</p>
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
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/workspaces" className="hover:text-slate-800">
          Workspaces
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">{workspace.name}</span>
      </div>

      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  workspace.visibility === 'PUBLIC'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {workspace.visibility === 'PUBLIC' ? (
                  <>
                    <Globe className="h-3 w-3" /> Public
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" /> Private
                  </>
                )}
              </span>

              {workspace.currentUserRole && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  <Shield className="h-3 w-3" /> {workspace.currentUserRole}
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
              {workspace.name}
            </h1>

            {workspace.institution && (
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500">
                <Building2 className="h-4 w-4" />
                {workspace.institution}
              </p>
            )}

            {workspace.description && (
              <p className="mt-3 max-w-3xl text-sm text-slate-600">
                {workspace.description}
              </p>
            )}
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={() => setShowTransferModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-600" />
              Transfer Ownership
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition ${
            activeTab === 'projects'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FolderKanban className="h-4 w-4" />
          Projects ({workspace.projectCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('datasets')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition ${
            activeTab === 'datasets'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Database className="h-4 w-4" />
          Shared Datasets
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition ${
            activeTab === 'members'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="h-4 w-4" />
          Members ({workspace.memberCount})
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        )}
      </div>

      {/* TAB 1: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Active research initiatives, land parcel dossiers, and policy analysis projects.
            </p>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setShowProjectModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                New Project
              </button>
            )}
          </div>

          {loadingProjects ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <FolderKanban className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-2 text-sm font-semibold text-slate-800">No projects yet</h3>
              <p className="mt-1 text-xs text-slate-500">
                Create a project to bundle land parcels, research papers, and discussion threads.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((proj) => (
                <Link
                  key={proj.id}
                  to={`/projects/${proj.id}`}
                  className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {proj.status}
                    </span>
                    {proj.currentUserRole && (
                      <span className="text-xs font-semibold text-emerald-600">
                        {proj.currentUserRole}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-base font-bold text-slate-900 group-hover:text-emerald-700">
                    {proj.name}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {proj.description || 'No description.'}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                      {proj.landRecordCount} parcels
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-teal-600" />
                      {proj.researchDocCount} papers
                    </span>
                    <span className="flex items-center gap-1">
                      <Database className="h-3.5 w-3.5 text-blue-600" />
                      {proj.datasetCount} datasets
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                      {proj.commentCount} comments
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DATASETS */}
      {activeTab === 'datasets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Shared GIS and tabular dataset catalog for this workspace.
            </p>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowDatasetModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Register Dataset
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
              <h3 className="mt-2 text-sm font-semibold text-slate-800">No shared datasets</h3>
              <p className="mt-1 text-xs text-slate-500">
                Register GeoJSON, Shapefile, CSV, or API endpoints available to workspace projects.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
              {datasets.map((ds) => (
                <div key={ds.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                        {ds.format}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{ds.title}</h4>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{ds.description}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
                      {ds.spatialCoverage && <span>Coverage: {ds.spatialCoverage}</span>}
                      {ds.recordCount && <span>{ds.recordCount.toLocaleString()} records</span>}
                      {ds.license && <span>License: {ds.license}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {ds.sourceUrl && (
                      <a
                        href={ds.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                      >
                        Source <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDataset(ds.id)}
                        className="p-1 text-slate-400 hover:text-red-600"
                        title="Delete dataset"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Users with access to this workspace and eligible for project assignment.
            </p>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowAddMemberModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Member
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
                    <th className="px-6 py-3">Joined</th>
                    {isAdmin && <th className="px-6 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{m.userName}</div>
                        {m.userEmail && <div className="text-xs text-slate-400">{m.userEmail}</div>}
                      </td>
                      <td className="px-6 py-4">
                        {isAdmin && m.role !== 'OWNER' ? (
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.userId, e.target.value as WorkspaceRole)}
                            className="rounded border border-slate-300 px-2 py-1 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="MEMBER">MEMBER</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              m.role === 'OWNER'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : m.role === 'ADMIN'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {m.role === 'OWNER' && <Shield className="h-3 w-3 text-amber-600" />}
                            {m.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(m.joinedAt).toLocaleDateString()}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          {m.role !== 'OWNER' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.userId)}
                              className="text-xs font-medium text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          )}
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

      {/* TAB 4: SETTINGS */}
      {activeTab === 'settings' && isAdmin && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900">Workspace Settings</h3>

          <form onSubmit={handleSaveSettings} className="max-w-xl space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Workspace Name</label>
              <input
                type="text"
                required
                value={settingsName}
                onChange={(e) => setSettingsName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Institution</label>
              <input
                type="text"
                value={settingsInstitution}
                onChange={(e) => setSettingsInstitution(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Description</label>
              <textarea
                rows={3}
                value={settingsDesc}
                onChange={(e) => setSettingsDesc(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={settingsSaving}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {settingsSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          {isOwner && (
            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-sm font-bold text-red-700">Danger Zone</h4>
              <p className="mt-1 text-xs text-slate-500">
                Archiving hides this workspace from member project lists.
              </p>
              <button
                type="button"
                onClick={handleArchive}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
                Archive Workspace
              </button>
            </div>
          )}
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">New Project</h2>
            <p className="mt-1 text-xs text-slate-500">
              Create a collaboration project within {workspace.name}.
            </p>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Project Name *</label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="e.g., Khasra Encroachment Audit"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Visibility</label>
                <select
                  value={projVisibility}
                  onChange={(e) => setProjVisibility(e.target.value as ProjectVisibility)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="WORKSPACE_INHERITED">Workspace Inherited</option>
                  <option value="PRIVATE_TO_PROJECT_MEMBERS">Private to Project Members</option>
                  <option value="PUBLIC">Public</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Goals and methodology..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProject}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {savingProject ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">Add Workspace Member</h2>
            <p className="mt-1 text-xs text-slate-500">
              Grant a registered platform user access to this workspace.
            </p>

            <form onSubmit={handleAddMember} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">User ID (UUID) *</label>
                <input
                  type="text"
                  required
                  value={newMemberUserId}
                  onChange={(e) => setNewMemberUserId(e.target.value)}
                  placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Role</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as WorkspaceRole)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="MEMBER">MEMBER (Can participate in projects)</option>
                  <option value="ADMIN">ADMIN (Can manage workspace & members)</option>
                  <option value="VIEWER">VIEWER (Read-only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMember}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {savingMember ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER OWNERSHIP MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">Transfer Workspace Ownership</h2>
            <p className="mt-1 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              Warning: You will be demoted to ADMIN and the selected member will become the sole OWNER.
            </p>

            <form onSubmit={handleTransferOwnership} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Select Active Member</label>
                <select
                  required
                  value={transferTargetUserId}
                  onChange={(e) => setTransferTargetUserId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Choose member --</option>
                  {members
                    .filter((m) => m.userId !== currentUser?.id)
                    .map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.userName} ({m.role})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferring || !transferTargetUserId}
                  className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {transferring ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER DATASET MODAL */}
      {showDatasetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">Register Shared Dataset</h2>
            <p className="mt-1 text-xs text-slate-500">
              Provide metadata for datasets available to projects in this workspace.
            </p>

            <form onSubmit={handleCreateDataset} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Dataset Title *</label>
                <input
                  type="text"
                  required
                  value={dsTitle}
                  onChange={(e) => setDsTitle(e.target.value)}
                  placeholder="e.g. North Delhi Floodplain Boundaries"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Format *</label>
                  <select
                    value={dsFormat}
                    onChange={(e) => setDsFormat(e.target.value as DatasetFormat)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="GEOJSON">GEOJSON</option>
                    <option value="SHAPEFILE">SHAPEFILE</option>
                    <option value="CSV">CSV</option>
                    <option value="GEOTIFF">GEOTIFF</option>
                    <option value="KML">KML</option>
                    <option value="API_ENDPOINT">API_ENDPOINT</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">License</label>
                  <input
                    type="text"
                    value={dsLicense}
                    onChange={(e) => setDsLicense(e.target.value)}
                    placeholder="e.g. OGL India / CC-BY-4.0"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Source URL</label>
                <input
                  type="url"
                  value={dsSourceUrl}
                  onChange={(e) => setDsSourceUrl(e.target.value)}
                  placeholder="https://data.gov.in/..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Spatial Coverage</label>
                  <input
                    type="text"
                    value={dsSpatialCoverage}
                    onChange={(e) => setDsSpatialCoverage(e.target.value)}
                    placeholder="e.g. Alipur, North Delhi"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Record Count</label>
                  <input
                    type="number"
                    value={dsRecordCount ?? ''}
                    onChange={(e) => setDsRecordCount(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 1500"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Description *</label>
                <textarea
                  required
                  rows={2}
                  value={dsDesc}
                  onChange={(e) => setDsDesc(e.target.value)}
                  placeholder="Summary of variables, collection methods, and accuracy..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
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
                  disabled={savingDataset}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {savingDataset ? 'Registering...' : 'Register Dataset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
