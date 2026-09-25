import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  BookOpen,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { ResearchDocumentCard } from '../components/ResearchDocumentCard';
import { ResearchDocumentDetailsModal } from '../components/ResearchDocumentDetailsModal';
import { ResearchDocumentFormModal } from '../components/ResearchDocumentFormModal';
import {
  createResearchDocument,
  deleteResearchDocument,
  getResearchDocumentById,
  listResearchDocuments,
  updateResearchDocument,
} from '../services/researchService';
import type {
  CreateResearchDocumentRequest,
  DocumentType,
  PageResponse,
  ResearchDocument,
  ResearchFilterParams,
  UpdateResearchDocumentRequest,
} from '../types/research';

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'RESEARCH_PAPER', label: 'Research Paper' },
  { value: 'POLICY_DOCUMENT', label: 'Policy Document' },
  { value: 'GOVERNMENT_REPORT', label: 'Government Report' },
  { value: 'ACADEMIC_PUBLICATION', label: 'Academic Publication' },
  { value: 'DATASET', label: 'Dataset Metadata' },
  { value: 'CASE_STUDY', label: 'Case Study' },
  { value: 'LEGAL_DOCUMENT', label: 'Legal Document' },
  { value: 'OTHER', label: 'Other Document' },
];

export function ResearchHubPage() {
  const { user } = useAuth();

  const isOfficialOrAdmin =
    user?.role === 'GOVERNMENT_OFFICIAL' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const canCreate =
    user?.role === 'RESEARCHER' ||
    user?.role === 'ACADEMIA' ||
    user?.role === 'GOVERNMENT_OFFICIAL' ||
    user?.role === 'ADMIN';

  // Data state
  const [data, setData] = useState<PageResponse<ResearchDocument> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<ResearchFilterParams>({
    search: '',
    documentType: '',
    status: '',
    organization: '',
    page: 0,
    size: 12,
  });

  // Search input state
  const [searchInput, setSearchInput] = useState<string>('');

  // Modals state
  const [selectedDoc, setSelectedDoc] = useState<ResearchDocument | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingDoc, setEditingDoc] = useState<ResearchDocument | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlDocId = searchParams.get('docId');

  // Deep-link: Open requested document if docId query parameter is present
  useEffect(() => {
    if (!urlDocId) return;
    let isCurrent = true;
    getResearchDocumentById(urlDocId)
      .then((doc) => {
        if (isCurrent && doc) {
          setSelectedDoc(doc);
          setIsDetailsOpen(true);
        }
      })
      .catch((err: unknown) => {
        if (isCurrent) {
          setError(
            err instanceof Error
              ? `Unable to open requested document: ${err.message}`
              : 'The requested document is not accessible or does not exist.',
          );
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [urlDocId]);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listResearchDocuments(filters);
      setData(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load research documents. Please check backend connection.',
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim() || undefined,
      page: 0,
    }));
  }

  function handleFilterChange(key: keyof ResearchFilterParams, value: string) {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 0,
    }));
  }

  function handleClearFilters() {
    setSearchInput('');
    setFilters({
      search: '',
      documentType: '',
      status: '',
      organization: '',
      page: 0,
      size: 12,
    });
  }

  function handleOpenCreate() {
    setEditingDoc(null);
    setFormMode('create');
    setIsFormOpen(true);
  }

  function handleOpenEdit(doc: ResearchDocument) {
    setEditingDoc(doc);
    setFormMode('edit');
    setIsFormOpen(true);
  }

  function handleViewDetails(doc: ResearchDocument) {
    setSelectedDoc(doc);
    setIsDetailsOpen(true);
  }

  async function handleFormSubmit(
    payload: CreateResearchDocumentRequest | UpdateResearchDocumentRequest,
  ) {
    if (formMode === 'create') {
      await createResearchDocument(payload as CreateResearchDocumentRequest);
    } else if (editingDoc) {
      await updateResearchDocument(
        editingDoc.id,
        payload as UpdateResearchDocumentRequest,
      );
    }
    await fetchDocuments();
  }

  async function handleDeleteDocument(id: string) {
    await deleteResearchDocument(id);
    await fetchDocuments();
  }

  function canEdit(doc: ResearchDocument): boolean {
    if (isOfficialOrAdmin) return true;
    if (
      (user?.role === 'RESEARCHER' || user?.role === 'ACADEMIA') &&
      doc.createdById &&
      doc.createdById === user?.id
    ) {
      return true;
    }
    return false;
  }

  function canLink(doc: ResearchDocument): boolean {
    return canEdit(doc);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
              Evidence & Knowledge Base
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
              Research Hub
            </h1>
            <p className="text-sm text-slate-300">
              Repository for land-governance research papers, official policy circulars,
              cadastral evaluations, academic publications, and empirical evidence linked
              to real land parcels.
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 active:scale-95"
            >
              <Plus className="h-5 w-5" />
              New Research Document
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search across title, description, abstract, authors, organization, keywords, language..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-slate-800"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
          {(filters.search ||
            filters.documentType ||
            filters.status ||
            filters.organization) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </form>

        {/* Filter Selects */}
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <Filter className="h-3.5 w-3.5" />
            Filters:
          </div>

          <select
            value={filters.documentType || ''}
            onChange={(e) => handleFilterChange('documentType', e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-medium focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Document Types</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Status filter: available to authenticated users who can view drafts */}
          {user && user.role !== 'PUBLIC' && (
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-medium focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          )}

          <div className="ml-auto text-xs text-slate-500">
            {data ? (
              <span>
                Showing <strong>{data.content.length}</strong> of{' '}
                <strong>{data.totalElements}</strong> documents
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <div className="flex-1">{error}</div>
          <button
            type="button"
            onClick={fetchDocuments}
            className="flex items-center gap-1 text-xs font-semibold text-red-700 underline hover:no-underline"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Documents Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-medium">Loading research documents...</p>
        </div>
      ) : !data || data.content.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            No research documents found
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            {filters.search || filters.documentType
              ? 'Try adjusting your search terms or filters to find what you are looking for.'
              : 'The research hub is currently empty. Authorized researchers and officials can contribute documents.'}
          </p>
          {(filters.search || filters.documentType) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.content.map((doc) => (
            <ResearchDocumentCard
              key={doc.id}
              document={doc}
              onView={handleViewDetails}
              onEdit={handleOpenEdit}
              canEdit={canEdit(doc)}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500">
            Page <strong>{data.page + 1}</strong> of <strong>{data.totalPages}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={data.first}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: Math.max(0, (prev.page ?? 0) - 1) }))
              }
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={data.last}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: (prev.page ?? 0) + 1 }))
              }
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      <ResearchDocumentDetailsModal
        document={selectedDoc}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedDoc(null);
          if (searchParams.has('docId')) {
            const next = new URLSearchParams(searchParams);
            next.delete('docId');
            setSearchParams(next, { replace: true });
          }
        }}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteDocument}
        onDocumentUpdated={(updated) => {
          setSelectedDoc(updated);
          fetchDocuments();
        }}
        canEdit={selectedDoc ? canEdit(selectedDoc) : false}
        canDelete={isAdmin}
        canLink={selectedDoc ? canLink(selectedDoc) : false}
      />

      {/* Create / Edit Form Modal */}
      <ResearchDocumentFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDoc(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingDoc}
        mode={formMode}
      />
    </div>
  );
}
