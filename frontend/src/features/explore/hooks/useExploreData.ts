import { useState, useEffect, useRef, useCallback } from 'react';
import { listResearchDocuments } from '../../research/services/researchService';
import type { DocumentType, PageResponse, ResearchDocument } from '../../research/types/research';
import { fetchGisFilterOptions } from '../../gis/services/gisService';
import type { GisFilterOptions } from '../../gis/types/gis';

export interface UseExploreDataReturn {
  // Search state
  query: string;
  setQuery: (q: string) => void;
  documentType: DocumentType | '';
  setDocumentType: (type: DocumentType | '') => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  searchResults: PageResponse<ResearchDocument> | null;
  isSearching: boolean;
  searchError: string | null;
  hasSearched: boolean;
  triggerSearch: (overrideQuery?: string, overrideType?: DocumentType | '', page?: number) => void;
  clearSearch: () => void;

  // Featured content state
  featuredDocs: ResearchDocument[];
  isFeaturedLoading: boolean;
  featuredError: string | null;

  // Geographic coverage state
  gisOptions: GisFilterOptions | null;
  isGisLoading: boolean;
  gisError: string | null;
}

/**
 * Custom hook managing Public Explore & Discovery data:
 * - Dynamic search across published research and statutory documents
 * - Featured published resources for quick orientation
 * - Geographic administrative hierarchy options from PostGIS filters
 * - Unmount-safe and race-condition protected async requests
 */
export function useExploreData(
  initialQuery: string = '',
  initialType: DocumentType | '' = '',
): UseExploreDataReturn {
  const normalizedInitialQuery = initialQuery.trim();
  const [query, setQuery] = useState(normalizedInitialQuery);
  const [documentType, setDocumentType] = useState<DocumentType | ''>(initialType);
  const [currentPage, setCurrentPage] = useState(0);

  const [searchResults, setSearchResults] = useState<PageResponse<ResearchDocument> | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(Boolean(normalizedInitialQuery || initialType));

  const [featuredDocs, setFeaturedDocs] = useState<ResearchDocument[]>([]);
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState<string | null>(null);

  const [gisOptions, setGisOptions] = useState<GisFilterOptions | null>(null);
  const [isGisLoading, setIsGisLoading] = useState(true);
  const [gisError, setGisError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const searchRequestIdRef = useRef(0);
  const initRequestIdRef = useRef(0);

  // 1. Initial fetch of Featured Documents & GIS Geography
  useEffect(() => {
    isMountedRef.current = true;
    const currentId = ++initRequestIdRef.current;

    // Fetch top 3 published research documents
    setIsFeaturedLoading(true);
    setFeaturedError(null);
    listResearchDocuments({ status: 'PUBLISHED', page: 0, size: 3 })
      .then((res) => {
        if (isMountedRef.current && currentId === initRequestIdRef.current) {
          setFeaturedDocs(res.content || []);
          setIsFeaturedLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMountedRef.current && currentId === initRequestIdRef.current) {
          setFeaturedError(err instanceof Error ? err.message : 'Unable to load featured publications');
          setIsFeaturedLoading(false);
        }
      });

    // Fetch GIS geographic boundaries
    setIsGisLoading(true);
    setGisError(null);
    fetchGisFilterOptions()
      .then((opts) => {
        if (isMountedRef.current && currentId === initRequestIdRef.current) {
          setGisOptions(opts);
          setIsGisLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMountedRef.current && currentId === initRequestIdRef.current) {
          setGisError(err instanceof Error ? err.message : 'Unable to load geographic options');
          setIsGisLoading(false);
        }
      });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 2. Trigger search with whitespace normalization and race condition protection
  const triggerSearch = useCallback(
    (overrideQuery?: string, overrideType?: DocumentType | '', pageOverride?: number) => {
      const rawQ = overrideQuery !== undefined ? overrideQuery : query;
      const type = overrideType !== undefined ? overrideType : documentType;
      const page = pageOverride !== undefined ? pageOverride : 0;

      const trimmed = rawQ.trim();
      if (!trimmed && !type) {
        // If empty query and no type filter, reset search results
        setSearchResults(null);
        setHasSearched(false);
        setSearchError(null);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setSearchError(null);
      setHasSearched(true);
      setCurrentPage(page);

      const requestId = ++searchRequestIdRef.current;

      listResearchDocuments({
        status: 'PUBLISHED',
        search: trimmed || undefined,
        documentType: type || undefined,
        page,
        size: 6,
      })
        .then((res) => {
          if (isMountedRef.current && requestId === searchRequestIdRef.current) {
            setSearchResults(res);
            setIsSearching(false);
          }
        })
        .catch((err: unknown) => {
          if (isMountedRef.current && requestId === searchRequestIdRef.current) {
            setSearchError(err instanceof Error ? err.message : 'Search request could not be completed.');
            setIsSearching(false);
          }
        });
    },
    [query, documentType],
  );

  // 3. Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setDocumentType('');
    setSearchResults(null);
    setHasSearched(false);
    setSearchError(null);
    setIsSearching(false);
    setCurrentPage(0);
  }, []);

  // 4. Auto-execute search or clear when initialQuery/initialType changes (e.g. browser back/forward)
  useEffect(() => {
    const trimmed = initialQuery.trim();
    if (trimmed || initialType) {
      setQuery(trimmed);
      setDocumentType(initialType);
      triggerSearch(trimmed, initialType, 0);
    } else {
      clearSearch();
    }
  }, [initialQuery, initialType, triggerSearch, clearSearch]);

  return {
    query,
    setQuery,
    documentType,
    setDocumentType,
    currentPage,
    setCurrentPage,
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
  };
}
