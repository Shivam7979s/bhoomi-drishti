import { Filter, Loader2, Sparkles, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import type { AssistantQueryRequestDTO } from '../types/assistant';

interface AssistantQueryFormProps {
  initialQuery?: string;
  isLoading: boolean;
  onSubmit: (request: AssistantQueryRequestDTO) => void;
}

export function AssistantQueryForm({
  initialQuery = '',
  isLoading,
  onSubmit,
}: AssistantQueryFormProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState(initialQuery);
  const [documentType, setDocumentType] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const documentTypeOptions = [
    { value: '', label: t.assistantPage.optAllDocTypes },
    { value: 'RESEARCH_PAPER', label: t.assistantPage.optResearchPaper },
    { value: 'POLICY_DOCUMENT', label: t.assistantPage.optPolicyDocument },
    { value: 'GOVERNMENT_REPORT', label: t.assistantPage.optGovReport },
    { value: 'ACADEMIC_PUBLICATION', label: t.assistantPage.optAcademicPub },
    { value: 'LEGAL_DOCUMENT', label: t.assistantPage.optLegalDoc },
  ];

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const trimmedLength = query.trim().length;
  const isTooShort = trimmedLength < 2;
  const isTooLong = query.length > 500;
  const isValid = !isTooShort && !isTooLong;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValid || isLoading) return;

    onSubmit({
      query: query.trim(),
      documentType: documentType || undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClear = () => {
    setQuery('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10"
    >
      <div className="relative">
        <label htmlFor="assistant-query-input" className="sr-only">
          {t.assistantPage.pageTitle}
        </label>
        <textarea
          id="assistant-query-input"
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={3}
          maxLength={500}
          placeholder={t.assistantPage.queryInputPlaceholder}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100 disabled:opacity-60 transition leading-relaxed font-medium"
        />

        {query && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-3.5 right-3.5 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
            title="Clear query"
            aria-label="Clear query text"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Form Controls Bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          {/* Optional Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              showFilters || documentType
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
            <span>{t.assistantPage.btnScopeFilter}</span>
            {documentType && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            )}
          </button>

          {/* Character Counter */}
          <span
            className={`text-xs ${
              isTooLong
                ? 'font-bold text-red-600'
                : query.length > 450
                ? 'text-amber-600'
                : 'text-slate-400 font-medium'
            }`}
          >
            {query.length}/500
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>{t.assistantPage.btnSynthesizing}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-emerald-200" aria-hidden="true" />
              <span>{t.assistantPage.btnAskAssistant}</span>
            </>
          )}
        </button>
      </div>

      {/* Collapsible Filter Bar */}
      {showFilters && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 flex flex-wrap items-center gap-3 text-xs">
          <label htmlFor="assistant-doc-type" className="font-semibold text-slate-700">
            {t.assistantPage.filterTargetDocType}
          </label>
          <select
            id="assistant-doc-type"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
          >
            {documentTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {documentType && (
            <button
              type="button"
              onClick={() => setDocumentType('')}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-medium underline"
            >
              Reset filter
            </button>
          )}
        </div>
      )}
    </form>
  );
}
