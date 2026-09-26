import { useState, useEffect, useMemo } from 'react';
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
  ChevronRight,
  Layers,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { listWorkspaces, createWorkspace } from '../services/collaborationService';
import type { Workspace, WorkspaceVisibility } from '../types';

export function WorkspacesPage() {
  const { t } = useLanguage();
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load workspaces';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const metrics = useMemo(() => {
    const totalProjects = workspaces.reduce((acc, ws) => acc + (ws.projectCount || 0), 0);
    const totalMembers = workspaces.reduce((acc, ws) => acc + (ws.memberCount || 1), 0);
    return {
      totalWorkspaces: workspaces.length,
      totalProjects,
      totalMembers,
    };
  }, [workspaces]);

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create workspace';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ── 1. Sovereign Breadcrumbs & Header Bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/90 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5">
            <Link to="/dashboard" className="flex items-center gap-1 hover:text-emerald-700 transition">
              <span>{t.workspacesPage.breadcrumbHome}</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-emerald-900 font-bold">{t.workspacesPage.breadcrumbCurrent}</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {t.workspacesPage.pageTitle}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 shadow-2xs">
              <FolderKanban className="h-3.5 w-3.5 text-emerald-600" />
              <span>{t.workspacesPage.badgeCollaborative}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 shadow-2xs">
              <Shield className="h-3.5 w-3.5 text-blue-600" />
              <span>{t.workspacesPage.badgeVault}</span>
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-3xl font-medium">
            {t.workspacesPage.pageSubtitle}
          </p>
        </div>

        {/* New Workspace Action Button */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:from-emerald-800 hover:to-teal-900 transition active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{t.workspacesPage.btnNewWorkspace}</span>
          </button>
        )}
      </div>

      {/* ── 2. Sovereign Metric KPI Chips ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Workspaces */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {metrics.totalWorkspaces} {t.workspacesPage.metricTotalWorkspacesTitle}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
              {t.workspacesPage.metricTotalWorkspacesSub}
            </p>
          </div>
        </div>

        {/* Metric 2: Active Projects */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {metrics.totalProjects} {t.workspacesPage.metricActiveProjectsTitle}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
              {t.workspacesPage.metricActiveProjectsSub}
            </p>
          </div>
        </div>

        {/* Metric 3: Linked Parcels */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-2xs">
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {t.workspacesPage.metricLinkedParcelsTitle}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
              {t.workspacesPage.metricLinkedParcelsSub}
            </p>
          </div>
        </div>

        {/* Metric 4: Role-Based RBAC Vault */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0 border border-teal-200/60 shadow-2xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {t.workspacesPage.metricAuditReadyTitle}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
              {t.workspacesPage.metricAuditReadySub}
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. Tabs Switcher ── */}
      <div className="flex items-center gap-2 border-b border-slate-200/90 pb-px">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
            tab === 'all'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          {t.workspacesPage.tabAll}
        </button>
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => setTab('my')}
            className={`border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
              tab === 'my'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
            }`}
          >
            {t.workspacesPage.tabMy}
          </button>
        )}
      </div>

      {/* ── 4. Main Content ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 font-medium">
          {error}
        </div>
      ) : workspaces.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
          <Building2 className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-base font-bold text-slate-900">
            {t.workspacesPage.emptyTitle}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            {tab === 'my' ? t.workspacesPage.emptySubMy : t.workspacesPage.emptySubAll}
          </p>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:from-emerald-800 hover:to-teal-900 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{t.workspacesPage.btnCreateFirst}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              to={`/workspaces/${ws.slug || ws.id}`}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition hover:border-emerald-400 hover:shadow-md cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      ws.visibility === 'PUBLIC'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs'
                        : 'bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                    }`}
                  >
                    {ws.visibility === 'PUBLIC' ? (
                      <>
                        <Globe className="h-3 w-3 text-blue-600" /> {t.workspacesPage.cardPublic}
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3 text-slate-500" /> {t.workspacesPage.cardPrivate}
                      </>
                    )}
                  </span>

                  {ws.currentUserRole && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200 shadow-2xs">
                      <Shield className="h-3 w-3 text-emerald-600" /> {ws.currentUserRole}
                    </span>
                  )}
                </div>

                <h3 className="mt-3.5 text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition">
                  {ws.name}
                </h3>

                {ws.institution && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    {ws.institution}
                  </p>
                )}

                <p className="mt-2 line-clamp-3 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {ws.description || t.workspacesPage.cardNoDesc}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-3.5">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    {ws.memberCount}{' '}
                    {ws.memberCount === 1
                      ? t.workspacesPage.cardMember
                      : t.workspacesPage.cardMembers}
                  </span>
                  <span className="flex items-center gap-1">
                    <FolderKanban className="h-3.5 w-3.5 text-slate-400" />
                    {ws.projectCount}{' '}
                    {ws.projectCount === 1
                      ? t.workspacesPage.cardProject
                      : t.workspacesPage.cardProjects}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 group-hover:text-emerald-900 group-hover:translate-x-0.5 transition">
                  {t.workspacesPage.cardOpen} <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── 5. Create Workspace Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {t.workspacesPage.modalTitle}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 font-medium">
                  {t.workspacesPage.modalSub}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  {t.workspacesPage.lblWorkspaceName}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.workspacesPage.phWorkspaceName}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  {t.workspacesPage.lblInstitution}
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder={t.workspacesPage.phInstitution}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  {t.workspacesPage.lblVisibility}
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as WorkspaceVisibility)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition"
                >
                  <option value="PRIVATE">{t.workspacesPage.optPrivate}</option>
                  <option value="PUBLIC">{t.workspacesPage.optPublic}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  {t.workspacesPage.lblDescription}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.workspacesPage.phDescription}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  {t.workspacesPage.btnCancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:from-emerald-800 hover:to-teal-900 disabled:opacity-50 transition cursor-pointer"
                >
                  {saving && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  <span>{saving ? t.workspacesPage.btnCreating : t.workspacesPage.btnCreate}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
