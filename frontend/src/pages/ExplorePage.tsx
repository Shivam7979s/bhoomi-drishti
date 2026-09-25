import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { DocumentType } from '../features/research/types/research';
import { useExploreData } from '../features/explore/hooks/useExploreData';
import { ExploreHero } from '../features/explore/components/ExploreHero';
import { ExploreSearch } from '../features/explore/components/ExploreSearch';
import { ExploreResults } from '../features/explore/components/ExploreResults';
import { ExploreDomainGrid } from '../features/explore/components/ExploreDomainGrid';
import { ExploreGeography } from '../features/explore/components/ExploreGeography';
import { ExploreFeaturedContent } from '../features/explore/components/ExploreFeaturedContent';
import { ExploreAssistantCta } from '../features/explore/components/ExploreAssistantCta';

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchSectionRef = useRef<HTMLDivElement>(null);

  const initialQuery = searchParams.get('q') || '';
  const initialType = (searchParams.get('type') as DocumentType | '') || '';

  const {
    query,
    setQuery,
    documentType,
    setDocumentType,
    currentPage,
    searchResults,
    isSearching,
    searchError,
    hasSearched,
    triggerSearch,
    clearSearch,
    featuredDocs,
    isFeaturedLoading,
    featuredError,
    gisOptions,
    isGisLoading,
    gisError,
  } = useExploreData(initialQuery, initialType);

  // Synchronize document title for SEO & accessibility
  useEffect(() => {
    document.title = 'Explore BHOOMI-DRISHTI — Land Governance Discovery';
  }, []);

  // Update URL search parameters when search query changes
  const handlePerformSearch = (nextQuery: string, nextType: DocumentType | '') => {
    const trimmed = nextQuery.trim();
    const params = new URLSearchParams();
    if (trimmed) {
      params.set('q', trimmed);
    }
    if (nextType) {
      params.set('type', nextType);
    }
    setSearchParams(params, { replace: true });
    triggerSearch(trimmed, nextType, 0);
  };

  const handleClearSearch = () => {
    setSearchParams({}, { replace: true });
    clearSearch();
  };

  const handlePageChange = (newPage: number) => {
    triggerSearch(query, documentType, newPage);
    // Smooth scroll back up to search results
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToSearch = () => {
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    const input = document.getElementById('explore-search-input');
    input?.focus();
  };

  return (
    <div className="flex flex-col w-full text-slate-900 bg-slate-50/50">
      {/* 1. Explore Hero & Context Banner */}
      <ExploreHero onScrollToSearch={handleScrollToSearch} />

      {/* Main Discover Layout Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16 sm:space-y-20">
        {/* 2. Public Information Search Bar & Results */}
        <section ref={searchSectionRef} aria-label="Search Public Information" className="space-y-4">
          <div className="text-left space-y-1 border-b border-slate-200/80 pb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
              Information Retrieval
            </span>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl tracking-tight">
              Search Published Research & Statutory Evidence
            </h2>
          </div>

          <ExploreSearch
            query={query}
            onQueryChange={setQuery}
            documentType={documentType}
            onDocumentTypeChange={setDocumentType}
            onSearch={handlePerformSearch}
            onClear={handleClearSearch}
            isSearching={isSearching}
          />

          <ExploreResults
            results={searchResults}
            isSearching={isSearching}
            error={searchError}
            hasSearched={hasSearched}
            onPageChange={handlePageChange}
            onRetry={() => triggerSearch(query, documentType, currentPage)}
          />
        </section>

        {/* 3. Explore by Domain Grid */}
        <ExploreDomainGrid />

        {/* 4. Explore by Administrative Geography */}
        <ExploreGeography
          gisOptions={gisOptions}
          isLoading={isGisLoading}
          error={gisError}
        />

        {/* 5. Featured Published Documents */}
        <ExploreFeaturedContent
          documents={featuredDocs}
          isLoading={isFeaturedLoading}
          error={featuredError}
        />

        {/* 6. AI Assistant Inquiry Prompt Banner */}
        <ExploreAssistantCta />
      </div>
    </div>
  );
}
