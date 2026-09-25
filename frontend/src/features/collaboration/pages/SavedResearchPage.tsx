import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  FileText,
  Trash2,
  Edit2,
  Plus,
  Sparkles,
} from 'lucide-react';
import {
  listSavedResearch,
  saveResearch,
  updateSavedResearch,
  deleteSavedResearch,
} from '../services/collaborationService';
import type { SavedResearch } from '../types';
import { AppContainer } from '../../../components/layout/AppContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { EmptyState } from '../../../components/layout/EmptyState';
import { ErrorState } from '../../../components/layout/ErrorState';

export function SavedResearchPage() {
  const [items, setItems] = useState<SavedResearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal for new saved item
  const [showModal, setShowModal] = useState(false);
  const [docId, setDocId] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit modal
  const [editingItem, setEditingItem] = useState<SavedResearch | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editTags, setEditTags] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    setError(null);
    try {
      const res = await listSavedResearch();
      setItems(res.content);
    } catch (err: any) {
      setError(err?.message || 'Failed to load saved research');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !docId.trim()) return;

    setSaving(true);
    try {
      await saveResearch({
        researchDocumentId: docId.trim(),
        title: title.trim(),
        notes: notes.trim() || undefined,
        tags: tags.trim() || undefined,
      });
      setShowModal(false);
      setDocId('');
      setTitle('');
      setNotes('');
      setTags('');
      await loadItems();
    } catch (err: any) {
      alert(err?.message || 'Failed to save research');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem || !editTitle.trim()) return;

    setUpdating(true);
    try {
      await updateSavedResearch(editingItem.id, {
        title: editTitle.trim(),
        notes: editNotes.trim() || undefined,
        tags: editTags.trim() || undefined,
      });
      setEditingItem(null);
      await loadItems();
    } catch (err: any) {
      alert(err?.message || 'Failed to update item');
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remove this saved research item?')) return;
    try {
      await deleteSavedResearch(id);
      await loadItems();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete item');
    }
  }

  return (
    <AppContainer>
      {/* Standardized Institutional Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Research Hub', to: '/research' },
          { label: 'Saved Research' },
        ]}
        badge={{
          text: 'Personal Portfolio',
          icon: Bookmark,
          variant: 'emerald',
        }}
        title="Saved Research"
        description="Strictly isolated personal collection of bookmarked research documents, chunk findings, and study notes."
        actions={
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Save Research Doc</span>
          </button>
        }
      />

      {/* Content Body */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">Loading saved research portfolio...</p>
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load saved research"
          description={error}
          onRetry={loadItems}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved research items"
          description="Bookmark documents from the Research Hub or semantic evidence from Knowledge Search to build your personal governance dossier."
          action={
            <Link
              to="/research"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition"
            >
              Explore Research Hub
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{item.title}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(item);
                        setEditTitle(item.title);
                        setEditNotes(item.notes || '');
                        setEditTags(item.tags || '');
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                      title="Edit notes & tags"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Remove bookmark"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {item.documentTitle && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50/80 border border-emerald-100 rounded-lg px-2.5 py-1 w-fit">
                    <FileText className="h-3.5 w-3.5 text-emerald-600" />
                    {item.documentTitle}
                  </p>
                )}

                {item.documentChunkId && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50/60 border border-indigo-100 rounded-lg px-2.5 py-1 w-fit">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Chunk:</span>
                    <span className="font-mono font-medium">{item.documentChunkId.substring(0, 8)}...</span>
                  </p>
                )}

                {item.notes && (
                  <p className="mt-3.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {item.notes}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.tags?.split(',').map((t, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-slate-100 border border-slate-200/60 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                    >
                      #{t.trim()}
                    </span>
                  ))}
                </div>

                <span className="text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Save Research Document</h2>
            <p className="mt-1 text-xs text-slate-500">
              Bookmark a document and save personal analytical notes.
            </p>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Research Document ID (UUID) *</label>
                <input
                  type="text"
                  required
                  value={docId}
                  onChange={(e) => setDocId(e.target.value)}
                  placeholder="123e4567-e89b-12d3-a456-426614174000"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Bookmark Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master Plan 2041 Analysis"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="zoning, floodplains, mohua"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Personal Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key observations and references..."
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-700 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50 transition"
                >
                  {saving ? 'Saving...' : 'Save to Portfolio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Edit Bookmark</h2>
            <p className="mt-1 text-xs text-slate-500">
              Update bookmark title, tags, or personal study notes.
            </p>

            <form onSubmit={handleUpdate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Bookmark Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Tags</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Personal Notes</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-xl bg-emerald-700 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50 transition"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppContainer>
  );
}
