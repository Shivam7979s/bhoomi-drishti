import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FolderKanban,
  Building2,
  Lock,
  Globe,
  Plus,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { listWorkspaces, createWorkspace } from '../services/collaborationService';
import type { Workspace, WorkspaceVisibility } from '../types';

export function WorkspacesPage() {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'all' | 'my'>('all');

  // Create Workspace Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [institution, setInstitution] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<WorkspaceVisibility>('PRIVATE');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspaces();
  }, [tab, isAuthenticated]);

  async function loadWorkspaces() {
    setLoading(true);
    setError(null);
    try {
      const res = await listWorkspaces(tab === 'my' && isAuthenticated);
      setWorkspaces(res.content);
    } catch (err: any) {
      setError(err?.message || 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setFormError(null);
    try {
      await createWorkspace({
        name: name.trim(),
        slug: slug.trim() || undefined,
        institution: institution.trim() || undefined,
        description: description.trim() || undefined,
        visibility,
      });
      setShowModal(false);
      setName('');
      setSlug('');
      setInstitution('');
      setDescription('');
      setVisibility('PRIVATE');
      await loadWorkspaces();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create workspace');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">
            <Layers className="h-4 w-4" />
            Collaboration & Research
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Research Workspaces
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Shared environments for collaborative land governance research, GIS parcel intelligence,
            and shared datasets.
          </p>
        </div>

        {isAuthenticated && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            New Workspace
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            tab === 'all'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          All Accessible
        </button>
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => setTab('my')}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === 'my'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            My Workspaces
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : workspaces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-base font-semibold text-slate-900">No workspaces found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {tab === 'my'
              ? "You haven't joined or created any workspaces yet."
              : 'There are no public workspaces available right now.'}
          </p>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Create your first workspace
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              to={`/workspaces/${ws.slug || ws.id}`}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      ws.visibility === 'PUBLIC'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {ws.visibility === 'PUBLIC' ? (
                      <>
                        <Globe className="h-3 w-3" /> Public
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" /> Private
                      </>
                    )}
                  </span>

                  {ws.currentUserRole && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <Shield className="h-3 w-3" /> {ws.currentUserRole}
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-emerald-700">
                  {ws.name}
                </h3>

                {ws.institution && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Building2 className="h-3.5 w-3.5" />
                    {ws.institution}
                  </p>
                )}

                <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                  {ws.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {ws.memberCount} {ws.memberCount === 1 ? 'member' : 'members'}
                  </span>
                  <span className="flex items-center gap-1">
                    <FolderKanban className="h-3.5 w-3.5" />
                    {ws.projectCount} {ws.projectCount === 1 ? 'project' : 'projects'}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 font-medium text-emerald-600 group-hover:translate-x-0.5 transition">
                  Open <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Workspace Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">Create Research Workspace</h2>
            <p className="mt-1 text-sm text-slate-500">
              Establish a collaboration hub for research projects, datasets, and GIS parcel analysis.
            </p>

            {formError && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Workspace Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Delhi Urban Land Governance Lab"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Institution / Organization
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g., IIT Delhi / Ministry of Urban Affairs"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as WorkspaceVisibility)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="PRIVATE">Private (Members Only)</option>
                  <option value="PUBLIC">Public (Discoverable by All)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Goals, research domain, and collaborating teams..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
