import { useEffect, useState } from 'react';
import { AlertCircle, FileText, Loader2, X } from 'lucide-react';
import type {
  CreateResearchDocumentRequest,
  DocumentType,
  ResearchDocument,
  ResearchDocumentStatus,
  UpdateResearchDocumentRequest,
} from '../types/research';

interface ResearchDocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateResearchDocumentRequest | UpdateResearchDocumentRequest) => Promise<void>;
  initialData?: ResearchDocument | null;
  mode: 'create' | 'edit';
}

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

export function ResearchDocumentFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: ResearchDocumentFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('RESEARCH_PAPER');
  const [authors, setAuthors] = useState('');
  const [organization, setOrganization] = useState('');
  const [publicationDate, setPublicationDate] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [language, setLanguage] = useState('en');
  const [keywords, setKeywords] = useState('');
  const [abstractText, setAbstractText] = useState('');
  const [status, setStatus] = useState<ResearchDocumentStatus>('DRAFT');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData && mode === 'edit') {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setDocumentType(initialData.documentType);
      setAuthors(initialData.authors);
      setOrganization(initialData.organization || '');
      setPublicationDate(initialData.publicationDate || '');
      setSourceUrl(initialData.sourceUrl || '');
      setFileUrl(initialData.fileUrl || '');
      setLanguage(initialData.language || 'en');
      setKeywords(initialData.keywords || '');
      setAbstractText(initialData.abstractText || '');
      setStatus(initialData.status);
    } else {
      setTitle('');
      setDescription('');
      setDocumentType('RESEARCH_PAPER');
      setAuthors('');
      setOrganization('');
      setPublicationDate('');
      setSourceUrl('');
      setFileUrl('');
      setLanguage('en');
      setKeywords('');
      setAbstractText('');
      setStatus('DRAFT');
    }
    setErrors({});
    setServerError(null);
  }, [isOpen, initialData, mode]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    else if (title.length > 255) errs.title = 'Title cannot exceed 255 characters';

    if (!description.trim()) errs.description = 'Description is required';

    if (!authors.trim()) errs.authors = 'Authors are required';
    else if (authors.length > 255) errs.authors = 'Authors cannot exceed 255 characters';

    if (!documentType) errs.documentType = 'Document type is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError(null);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      documentType,
      authors: authors.trim(),
      organization: organization.trim() || undefined,
      publicationDate: publicationDate || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      fileUrl: fileUrl.trim() || undefined,
      language: language.trim() || 'en',
      keywords: keywords.trim() || undefined,
      abstractText: abstractText.trim() || undefined,
      status,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to save research document');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <FileText className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === 'edit' ? 'Edit Research Document' : 'Contribute New Research Document'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {serverError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Document Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Assessment of Digitized Cadastral Mapping in Central India"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-hidden focus:ring-1 ${
                  errors.title
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500'
                }`}
              />
              {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
            </div>

            {/* Document Type & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Document Type *
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Document Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ResearchDocumentStatus)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="DRAFT">DRAFT (Visible to authors & officials)</option>
                  <option value="PUBLISHED">PUBLISHED (Publicly visible)</option>
                  <option value="ARCHIVED">ARCHIVED (Archival storage)</option>
                </select>
              </div>
            </div>

            {/* Authors & Organization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Authors / Researchers *
                </label>
                <input
                  type="text"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="e.g. Dr. A. Sharma, Prof. K. Patel"
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-hidden focus:ring-1 ${
                    errors.authors
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
                {errors.authors && <p className="mt-1 text-xs text-red-600">{errors.authors}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Organization / Institution
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. Centre for Land Governance"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Publication Date & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Publication Date
                </label>
                <input
                  type="date"
                  value={publicationDate}
                  onChange={(e) => setPublicationDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Language Code
                </label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="en, hi, etc."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Summary / Description *
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive summary of the document, findings, and relevance to land governance..."
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-hidden focus:ring-1 ${
                  errors.description
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Abstract Text */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Abstract / Key Findings
              </label>
              <textarea
                rows={4}
                value={abstractText}
                onChange={(e) => setAbstractText(e.target.value)}
                placeholder="Full academic abstract or official executive summary..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Keywords (comma separated)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="cadastre, spatial data, GIS, rural tenure, survey"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* URLs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Source Reference URL
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://doi.org/... or https://..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  PDF / File Attachment URL
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://storage.../document.pdf"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'edit' ? 'Update Document' : 'Save Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
