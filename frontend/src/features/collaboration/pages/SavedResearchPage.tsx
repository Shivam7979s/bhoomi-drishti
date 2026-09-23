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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">
            <Bookmark className="h-4 w-4" />
            Personal Research Portfolio
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Saved Research
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Strictly isolated personal collection of bookmarked research documents, chunk findings, and study notes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Save Research Doc
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Bookmark className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-base font-semibold text-slate-900">No saved research</h3>
          <p className="mt-1 text-sm text-slate-500">
            Bookmark documents from the Research Hub or semantic evidence from Knowledge Search.
          </p>
          <Link
            to="/research"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Explore Research Hub
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:border-emerald-300 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(item);
                        setEditTitle(item.title);
                        setEditNotes(item.notes || '');
                        setEditTags(item.tags || '');
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700"
                      title="Edit notes & tags"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-slate-400 hover:text-red-600"
                      title="Remove bookmark"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {item.documentTitle && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-teal-700">
                    <FileText className="h-3.5 w-3.5" />
                    {item.documentTitle}
                  </p>
                )}

                {item.documentChunkId && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-indigo-600">
                    <Sparkles className="h-3.5 w-3.5" />
                    Chunk: <span className="font-mono">{item.documentChunkId.substring(0, 8)}...</span>
                  </p>
                )}

                {item.notes && (
                  <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 whitespace-pre-wrap">
                    {item.notes}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-400">
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.tags?.split(',').map((t, i) => (
                    <span
                      key={i}
                      className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                    >
                      #{t.trim()}
                    </span>
                  ))}
                </div>

                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">Save Research Document</h2>
            <p className="mt-1 text-xs text-slate-500">
              Bookmark a document and save personal analytical notes.
            </p>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Research Document ID (UUID) *</label>
                <input
                  type="text"
                  required
                  value={docId}
                  onChange={(e) => setDocId(e.target.value)}
                  placeholder="123e4567-e89b-12d3-a456-426614174000"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
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
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="zoning, floodplains, mohua"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Personal Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key observations and references..."
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">Edit Bookmark</h2>

            <form onSubmit={handleUpdate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Bookmark Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Tags</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Personal Notes</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
