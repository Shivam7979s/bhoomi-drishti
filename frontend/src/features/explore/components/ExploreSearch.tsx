import { useState, useEffect, type FormEvent } from 'react';
import { Filter, Loader2, Search, X } from 'lucide-react';
import type { DocumentType } from '../../research/types/research';

interface ExploreSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
  documentType: DocumentType | '';
  onDocumentTypeChange: (type: DocumentType | '') => void;
  onSearch: (q: string, type: DocumentType | '') => void;
  onClear: () => void;
  isSearching: boolean;
}

const DOCUMENT_TYPE_OPTIONS: Array<{ value: DocumentType | ''; label: string }> = [
  { value: '', label: 'All Document Types' },
  { value: 'POLICY_DOCUMENT', label: 'Policy Documents' },
  { value: 'LEGAL_DOCUMENT', label: 'Statutory & Legal Acts' },
  { value: 'GOVERNMENT_REPORT', label: 'Government Reports' },
  { value: 'RESEARCH_PAPER', label: 'Research Papers' },
  { value: 'ACADEMIC_PUBLICATION', label: 'Academic Publications' },
  { value: 'CASE_STUDY', label: 'Case Studies' },
  { value: 'DATASET', label: 'Datasets' },
];

export function ExploreSearch({
  query,
  onQueryChange,
  documentType,
  onDocumentTypeChange,
  onSearch,
  onClear,
  isSearching,
}: ExploreSearchProps) {
  const [localInput, setLocalInput] = useState(query);

  useEffect(() => {
    setLocalInput(query);
  }, [query]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = localInput.trim();
    onQueryChange(trimmed);
    onSearch(trimmed, documentType);
  };

  const handleClear = () => {
    setLocalInput('');
    onClear();
  };

  return (
    <div id="explore-search" className="scroll-mt-20">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Main Search Input & Filter Group */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm transition focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-700/20">
          {/* Text Input with Icon */}
          <div className="relative flex-1 flex items-center">
            <label htmlFor="explore-search-input" className="sr-only">
              Search published research and statutory evidence
            </label>
            <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" aria-hidden="true" />
            <input
              id="explore-search-input"
              type="text"
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              placeholder="Search published research, revenue circulars, acts, and tenancy guidelines..."
              className="w-full rounded-xl bg-transparent py-2.5 pl-10 pr-9 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
            />
            {localInput && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search input"
                className="absolute right-3 rounded-md p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Document Type Dropdown */}
          <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-2.5">
            <label htmlFor="explore-type-select" className="sr-only">
              Filter by Document Type
            </label>
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0 hidden sm:block" aria-hidden="true" />
            <select
              id="explore-type-select"
              value={documentType}
              onChange={(e) => {
                const nextType = e.target.value as DocumentType | '';
                onDocumentTypeChange(nextType);
                onSearch(localInput, nextType);
              }}
              className="w-full sm:w-auto rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100/80 focus:border-emerald-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 cursor-pointer"
            >
              {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Search Button */}
          <button
            type="submit"
            disabled={isSearching}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-2xs hover:bg-emerald-900 transition disabled:opacity-60 disabled:cursor-not-allowed focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" aria-hidden="true" />
                <span>Find Information</span>
              </>
            )}
          </button>
        </div>

        {/* Scope and Transparency Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 px-1 gap-1">
          <span>
            Scope: Published statutory acts, state revenue circulars, gazettes, and academic research in BHOOMI-DRISHTI repository.
          </span>
          <span className="text-slate-400">
            Status: <strong>PUBLISHED ONLY</strong> (public access boundary enforced)
          </span>
        </div>
      </form>
    </div>
  );
}
