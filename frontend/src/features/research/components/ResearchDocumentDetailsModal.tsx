import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  CheckCircle2,
  Edit2,
  ExternalLink,
  FileDown,
  FolderPlus,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Sparkles,
  Trash2,
  Unlink,
  X,
} from 'lucide-react';
import {
  getLinkedLandRecords,
  linkLandRecord,
  unlinkLandRecord,
} from '../services/researchService';
import {
  saveResearch,
  linkResearchDocument,
} from '../../collaboration/services/collaborationService';
import {
  getProcessingStatus,
  triggerIngest,
} from '../../knowledge/services/knowledgeService';
import type { DocumentProcessingStatus } from '../../knowledge/types/knowledge';
import type { ResearchDocument } from '../types/research';
import type { LandRecord } from '../../land-records/types/landRecord';
import { LinkLandRecordModal } from './LinkLandRecordModal';

interface ResearchDocumentDetailsModalProps {
  document: ResearchDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (doc: ResearchDocument) => void;
  onDelete?: (id: string) => Promise<void>;
  onDocumentUpdated?: (updated: ResearchDocument) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canLink?: boolean;
}

export function ResearchDocumentDetailsModal({
  document: doc,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onDocumentUpdated,
  canEdit = false,
  canDelete = false,
  canLink = false,
}: ResearchDocumentDetailsModalProps) {
  const [linkedRecords, setLinkedRecords] = useState<LandRecord[]>([]);
  const [loadingLinked, setLoadingLinked] = useState<boolean>(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] =
    useState<DocumentProcessingStatus | null>(null);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);

  // Phase 7 Collaboration integration
  const [isSavingResearch, setIsSavingResearch] = useState(false);
  const [researchSaved, setResearchSaved] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveNotes, setSaveNotes] = useState('');
  const [saveTags, setSaveTags] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showLinkProjectModal, setShowLinkProjectModal] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState('');
  const [targetProjectNotes, setTargetProjectNotes] = useState('');
  const [isLinkingProject, setIsLinkingProject] = useState(false);
  const [linkProjectMsg, setLinkProjectMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSaveResearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!doc) return;
    setIsSavingResearch(true);
    setSaveError(null);
    try {
      await saveResearch({
        title: doc.title,
        researchDocumentId: doc.id,
        notes: saveNotes.trim() || undefined,
        tags: saveTags.trim() || undefined,
      });
      setResearchSaved(true);
      setShowSaveModal(false);
      setSaveNotes('');
      setSaveTags('');
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to bookmark research');
    } finally {
      setIsSavingResearch(false);
    }
  }

  async function handleLinkProjectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!doc || !targetProjectId.trim()) return;
    setIsLinkingProject(true);
    setLinkProjectMsg(null);
    try {
      await linkResearchDocument(targetProjectId.trim(), {
        researchDocumentId: doc.id,
        relevanceNotes: targetProjectNotes.trim() || undefined,
      });
      setLinkProjectMsg({ type: 'success', text: 'Document successfully linked to project!' });
      setTimeout(() => {
        setShowLinkProjectModal(false);
        setLinkProjectMsg(null);
        setTargetProjectId('');
        setTargetProjectNotes('');
      }, 1500);
    } catch (err: any) {
      setLinkProjectMsg({ type: 'error', text: err?.message || 'Failed to link document to project' });
    } finally {
      setIsLinkingProject(false);
    }
  }

  useEffect(() => {
    if (!isOpen || !doc) {
      setLinkedRecords([]);
      setProcessingStatus(null);
      setIngestSuccess(null);
      setError(null);
      return;
    }
    loadLinkedParcels();
    loadProcessingStatus();
  }, [isOpen, doc?.id]);

  useEffect(() => {
    if (!isOpen || !doc) return;
    if (
      processingStatus?.status === 'QUEUED' ||
      processingStatus?.status === 'PROCESSING'
    ) {
      const timer = setTimeout(() => {
        loadProcessingStatus();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, doc?.id, processingStatus?.status]);

  async function loadProcessingStatus() {
    if (!doc) return;
    try {
      const status = await getProcessingStatus(doc.id);
      setProcessingStatus(status);
    } catch {
      // Ignored if user not allowed or not ingested
    }
  }

  async function handleTriggerIngest() {
    if (!doc) return;
    setIsIngesting(true);
    setIngestSuccess(null);
    setError(null);
    try {
      const res = await triggerIngest(doc.id);
      setIngestSuccess(res.message);
      await loadProcessingStatus();
    } catch (err: any) {
      setError(err?.message || 'Failed to trigger ingestion');
    } finally {
      setIsIngesting(false);
    }
  }

  async function loadLinkedParcels() {
    if (!doc) return;
    setLoadingLinked(true);
    try {
      const records = await getLinkedLandRecords(doc.id);
      setLinkedRecords(records);
    } catch {
      // If endpoint fails or empty, fallback
      setLinkedRecords([]);
    } finally {
      setLoadingLinked(false);
    }
  }

  async function handleLinkParcel(landRecordId: string) {
    if (!doc) return;
    try {
      const updated = await linkLandRecord(doc.id, landRecordId);
      if (onDocumentUpdated) onDocumentUpdated(updated);
      await loadLinkedParcels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link land record');
    }
  }

  async function handleUnlinkParcel(landRecordId: string) {
    if (!doc) return;
    setUnlinkingId(landRecordId);
    setError(null);
    try {
      const updated = await unlinkLandRecord(doc.id, landRecordId);
      if (onDocumentUpdated) onDocumentUpdated(updated);
      await loadLinkedParcels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink land record');
    } finally {
      setUnlinkingId(null);
    }
  }

  async function handleDelete() {
    if (!doc || !onDelete) return;
    if (!window.confirm(`Are you sure you want to delete "${doc.title}"?`)) return;
    setIsDeleting(true);
    try {
      await onDelete(doc.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  }

  if (!isOpen || !doc) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
        <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
            <div className="space-y-1 pr-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200 uppercase tracking-wider">
                  {doc.documentType.replace(/_/g, ' ')}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    doc.status === 'PUBLISHED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : doc.status === 'DRAFT'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {doc.status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{doc.title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 border border-slate-100 text-sm">
              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-500">Authors</div>
                <div className="font-semibold text-slate-900">{doc.authors}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-500">Organization</div>
                <div className="text-slate-800">{doc.organization || '—'}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-500">Publication Date</div>
                <div className="text-slate-800">{doc.publicationDate || '—'}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-500">Language</div>
                <div className="uppercase text-slate-800">{doc.language}</div>
              </div>

              {doc.createdByName && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-slate-500">Contributed By</div>
                  <div className="text-slate-800">{doc.createdByName}</div>
                </div>
              )}

              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-500">Added On</div>
                <div className="text-slate-800">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Description & Summary
              </h3>
              <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-line">
                {doc.description}
              </p>
            </div>

            {/* Abstract */}
            {doc.abstractText && (
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Abstract / Findings
                </h3>
                <div className="rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 italic border border-slate-100 whitespace-pre-line">
                  {doc.abstractText}
                </div>
              </div>
            )}

            {/* Keywords */}
            {doc.keywords && (
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Keywords
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {doc.keywords.split(',').map((kw, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700 font-medium"
                    >
                      {kw.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* External Links */}
            {(doc.sourceUrl || doc.fileUrl) && (
              <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                {doc.sourceUrl && (
                  <a
                    href={doc.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-700 shadow-xs"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visit Source Document
                  </a>
                )}
                {doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-700 shadow-xs"
                  >
                    <FileDown className="h-4 w-4" />
                    Download Attached File
                  </a>
                )}
              </div>
            )}

            {/* AI Vector Knowledge & Ingestion Section */}
            <div className="border-t border-slate-200 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-teal-600" />
                    AI Vector Knowledge Status
                    {processingStatus && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          processingStatus.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : processingStatus.status === 'PROCESSING' ||
                              processingStatus.status === 'QUEUED'
                            ? 'bg-blue-100 text-blue-800 animate-pulse'
                            : processingStatus.status === 'FAILED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {processingStatus.status}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Document chunking, FastEmbed (BAAI/bge-small-en-v1.5) embeddings, and vector indexing.
                  </p>
                </div>

                {canEdit && (doc.fileUrl || doc.sourceUrl) && (
                  <button
                    type="button"
                    onClick={handleTriggerIngest}
                    disabled={
                      isIngesting ||
                      processingStatus?.status === 'QUEUED' ||
                      processingStatus?.status === 'PROCESSING'
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isIngesting ||
                    processingStatus?.status === 'QUEUED' ||
                    processingStatus?.status === 'PROCESSING' ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>
                          {processingStatus?.status === 'COMPLETED'
                            ? 'Re-Ingest'
                            : 'Ingest for Vector Search'}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {ingestSuccess && (
                <div className="rounded-lg bg-teal-50 border border-teal-200 p-2.5 text-xs text-teal-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>{ingestSuccess}</span>
                </div>
              )}

              {processingStatus && processingStatus.status === 'COMPLETED' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                    <span className="text-slate-400 block text-[11px]">Indexed Chunks</span>
                    <span className="font-semibold text-slate-800">{processingStatus.chunkCount} chunks</span>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                    <span className="text-slate-400 block text-[11px]">Model & Dimension</span>
                    <span className="font-semibold text-slate-800">bge-small (384d)</span>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 block text-[11px]">Vector Storage</span>
                    <span className="font-semibold text-emerald-700">pgvector HNSW</span>
                  </div>
                </div>
              )}

              {processingStatus && processingStatus.status === 'FAILED' && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                  <span className="font-semibold">Ingestion Error: </span>
                  {processingStatus.errorMessage || 'Failed to extract text or compute embeddings.'}
                </div>
              )}
            </div>

            {/* Linked Land Records Section */}
            <div className="border-t border-slate-200 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    Linked Land Parcels
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {linkedRecords.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cadastral parcels and land records cited or referenced by this evidence.
                  </p>
                </div>

                {canLink && (
                  <button
                    type="button"
                    onClick={() => setIsLinkModalOpen(true)}
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    Link Parcel
                  </button>
                )}
              </div>

              {loadingLinked ? (
                <div className="flex items-center justify-center py-6 text-sm text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-emerald-600" />
                  Loading linked parcels...
                </div>
              ) : linkedRecords.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-500">
                  No land records are linked to this research document yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {linkedRecords.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3 transition hover:bg-slate-50"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          Parcel #{r.parcelNumber}
                        </div>
                        <div className="text-xs text-slate-500">
                          {r.village}, {r.tehsil}, {r.district}, {r.state} • {r.landUseType} •{' '}
                          {r.landAreaSqMeters} m²
                        </div>
                      </div>

                      {canLink && (
                        <button
                          type="button"
                          onClick={() => handleUnlinkParcel(r.id)}
                          disabled={unlinkingId === r.id}
                          className="flex items-center gap-1 rounded-md p-1.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Unlink Parcel"
                        >
                          {unlinkingId === r.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Unlink className="h-3.5 w-3.5" />
                          )}
                          Unlink
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
            <div>
              {canDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Delete Document
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSaveModal(true)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-xs transition ${
                  researchSaved
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
                }`}
                title="Save this document to your personal research bookmarks"
              >
                <Bookmark className="h-3.5 w-3.5" />
                {researchSaved ? 'Saved' : 'Save Research'}
              </button>

              <button
                type="button"
                onClick={() => setShowLinkProjectModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-emerald-700 transition"
                title="Link this research document to a collaboration project"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                Link to Project
              </button>

              {canEdit && onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(doc);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Research Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-left border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-emerald-600" />
              Save to Research Bookmarks
            </h3>
            <p className="mt-1 text-xs text-slate-500 line-clamp-1">
              {doc.title}
            </p>

            {saveError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveResearchSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Personal Notes</label>
                <textarea
                  rows={3}
                  value={saveNotes}
                  onChange={(e) => setSaveNotes(e.target.value)}
                  placeholder="Key insights, citations, relevance to study..."
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={saveTags}
                  onChange={(e) => setSaveTags(e.target.value)}
                  placeholder="e.g. land-reform, spatial-planning, tenure"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingResearch}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSavingResearch ? 'Saving...' : 'Save Bookmark'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link to Project Modal */}
      {showLinkProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-left border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderPlus className="h-4 w-4 text-emerald-600" />
              Link Research Document to Project
            </h3>
            <p className="mt-1 text-xs text-slate-500 line-clamp-1">
              {doc.title}
            </p>

            {linkProjectMsg && (
              <div
                className={`mt-3 rounded-lg p-2.5 text-xs font-medium ${
                  linkProjectMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {linkProjectMsg.text}
              </div>
            )}

            <form onSubmit={handleLinkProjectSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Project ID (UUID) *</label>
                <input
                  type="text"
                  required
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Relevance Notes</label>
                <textarea
                  rows={2}
                  value={targetProjectNotes}
                  onChange={(e) => setTargetProjectNotes(e.target.value)}
                  placeholder="Why this document is relevant to the project..."
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkProjectModal(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLinkingProject || !targetProjectId.trim()}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isLinkingProject ? 'Linking...' : 'Confirm Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <LinkLandRecordModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onLink={handleLinkParcel}
        alreadyLinkedIds={linkedRecords.map((r) => r.id)}
      />
    </>
  );
}
