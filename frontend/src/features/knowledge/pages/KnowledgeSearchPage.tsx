import { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Filter,
  Layers,
  Loader2,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { EvidenceCard } from '../components/EvidenceCard';
import { EvidenceDetailsModal } from '../components/EvidenceDetailsModal';
import { searchKnowledge } from '../services/knowledgeService';
import type { EvidenceItem, KnowledgeSearchResponse } from '../types/knowledge';

const SUGGESTED_QUERIES = [
  'Cadastral boundary survey standards',
  'Drone mapping land parcel guidelines',
  'Record of rights digitization reforms',
  'Tribal land tenure and forest rights',
];

export function KnowledgeSearchPage() {
  const [query, setQuery] = useState('');
  const [documentType, setDocumentType] = useState<string>('');
  const [topK, setTopK] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResponse, setSearchResponse] =
    useState<KnowledgeSearchResponse | null>(null);
  const [selectedEvidence, setSelectedEvidence] =
    useState<EvidenceItem | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) return;

    if (overrideQuery) {
      setQuery(overrideQuery);
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await searchKnowledge({
        query: q,
        topK,
        documentType: documentType || undefined,
      });
      setSearchResponse(response);
    } catch (err: any) {
      setError(
        err?.message ||
          'Failed to perform knowledge search. Ensure the AI service is operational.',
      );
      setSearchResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Banner / Header */}
      <div className="border-b border-slate-200 bg-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 border border-teal-200 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            AI Knowledge & Evidence Layer
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Semantic Land Intelligence Search
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl mx-auto">
            Retrieve verified, evidence-grounded excerpts from research papers,
            policy circulars, and survey manuals with deterministic vector
            similarity and full provenance.
          </p>

          {/* Search Input Bar */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-2 max-w-3xl mx-auto">
            <div className="relative flex-1 w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask or search topics e.g., 'What are the drone survey accuracy thresholds?'"
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-xs focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => handleSearch()}
              disabled={isLoading || !query.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Find Evidence</span>
                </>
              )}
            </button>
          </div>

          {/* Filter Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Filter className="h-3.5 w-3.5" />
              <span>Filters:</span>
            </div>

            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-2xs focus:border-teal-500 focus:outline-hidden"
            >
              <option value="">All Document Types</option>
              <option value="RESEARCH_PAPER">Research Paper</option>
              <option value="POLICY_DOCUMENT">Policy Document</option>
              <option value="GOVERNMENT_REPORT">Government Report</option>
              <option value="ACADEMIC_PUBLICATION">Academic Publication</option>
              <option value="DATASET">Dataset</option>
              <option value="CASE_STUDY">Case Study</option>
              <option value="LEGAL_DOCUMENT">Legal Document</option>
            </select>

            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-2xs focus:border-teal-500 focus:outline-hidden"
            >
              <option value={3}>Top 3 matches</option>
              <option value={5}>Top 5 matches</option>
              <option value={10}>Top 10 matches</option>
              <option value={20}>Top 20 matches</option>
            </select>
          </div>

          {/* Suggested Queries Chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-400">Suggestions:</span>
            {SUGGESTED_QUERIES.map((sq) => (
              <button
                key={sq}
                onClick={() => handleSearch(sq)}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-700 transition"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mt-8">
        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3 mb-6">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Search Error</p>
              <p className="mt-0.5 text-xs text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Results Metadata Header */}
        {searchResponse && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 mb-6 shadow-2xs text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">
                {searchResponse.totalResults} evidence excerpt
                {searchResponse.totalResults === 1 ? '' : 's'}
              </span>
              <span>retrieved for</span>
              <span className="font-medium text-teal-700 italic">
                "{searchResponse.query}"
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <span>Latency: {searchResponse.searchDurationMs}ms</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Layers className="h-3 w-3" />
                BAAI/bge-small-en-v1.5 (384-dim)
              </span>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {searchResponse && searchResponse.results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {searchResponse.results.map((evidence) => (
              <EvidenceCard
                key={evidence.chunkId}
                evidence={evidence}
                onSelect={(item) => setSelectedEvidence(item)}
              />
            ))}
          </div>
        )}

        {/* Empty Results State */}
        {searchResponse && searchResponse.results.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">
              No matching evidence found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              No chunks in the vector index matched your query with sufficient
              similarity. Try adjusting your query or ensuring research documents
              have been ingested.
            </p>
          </div>
        )}

        {/* Initial Welcome State (Before search) */}
        {!hasSearched && !isLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">
                How Bhoomi-Drishti AI Evidence Search Works
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
              <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold text-[10px]">
                    1
                  </span>
                  Extracted from Official PDFs
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Documents published in Research Hub are processed into clean,
                  deterministic text blocks preserving page numbers and section
                  headings.
                </p>
              </div>

              <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold text-[10px]">
                    2
                  </span>
                  Deterministic Embeddings
                </div>
                <p className="text-slate-500 leading-relaxed">
                  FastEmbed model generates 384-dimensional dense vectors stored
                  in PostgreSQL via pgvector with HNSW cosine indexing.
                </p>
              </div>

              <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold text-[10px]">
                    3
                  </span>
                  Grounded Citation Provenance
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Queries surface verbatim evidence with exact citation strings,
                  page numbers, and links to relevant cadastral land records.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Provenance Details Modal */}
      <EvidenceDetailsModal
        evidence={selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
      />
    </div>
  );
}
