import { useState, useEffect, useRef } from 'react';
import { fetchIndicatorDefinitions } from '../../governance/services/governanceService';
import type { GovernanceIndicatorDefinitionResponse } from '../../governance/types/governance';
import { listResearchDocuments } from '../../research/services/researchService';
import type { ResearchDocument } from '../../research/types/research';
import { fetchGisFilterOptions } from '../../gis/services/gisService';
import type { GisFilterOptions } from '../../gis/types/gis';

export interface HomeDataState {
  indicators: GovernanceIndicatorDefinitionResponse[];
  isIndicatorsLoading: boolean;
  indicatorsError: string | null;

  researchDocuments: ResearchDocument[];
  isResearchLoading: boolean;
  researchError: string | null;

  gisOptions: GisFilterOptions | null;
  isGisLoading: boolean;
  gisError: string | null;

  refresh: () => void;
}

/**
 * Custom hook to safely fetch public homepage data across multiple domains.
 * Each data source handles failures independently to guarantee graceful degradation.
 * Includes request-ID tracking and abort controllers to prevent stale overwrites or post-unmount updates.
 */
export function useHomeData(): HomeDataState {
  const [indicators, setIndicators] = useState<GovernanceIndicatorDefinitionResponse[]>([]);
  const [isIndicatorsLoading, setIsIndicatorsLoading] = useState(true);
  const [indicatorsError, setIndicatorsError] = useState<string | null>(null);

  const [researchDocuments, setResearchDocuments] = useState<ResearchDocument[]>([]);
  const [isResearchLoading, setIsResearchLoading] = useState(true);
  const [researchError, setResearchError] = useState<string | null>(null);

  const [gisOptions, setGisOptions] = useState<GisFilterOptions | null>(null);
  const [isGisLoading, setIsGisLoading] = useState(true);
  const [gisError, setGisError] = useState<string | null>(null);

  const [fetchTrigger, setFetchTrigger] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    const currentRequestId = ++requestIdRef.current;
    const controller = new AbortController();

    // 1. Fetch Governance Indicator Definitions
    setIsIndicatorsLoading(true);
    setIndicatorsError(null);
    fetchIndicatorDefinitions()
      .then((defs) => {
        if (isMounted && currentRequestId === requestIdRef.current) {
          setIndicators(defs || []);
          setIsIndicatorsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted && currentRequestId === requestIdRef.current) {
          setIndicatorsError(err instanceof Error ? err.message : 'Unable to load governance indicators');
          setIsIndicatorsLoading(false);
        }
      });

    // 2. Fetch Top Published Research Documents (Public Visibility only)
    setIsResearchLoading(true);
    setResearchError(null);
    listResearchDocuments({ status: 'PUBLISHED', page: 0, size: 3 })
      .then((res) => {
        if (isMounted && currentRequestId === requestIdRef.current) {
          setResearchDocuments(res.content || []);
          setIsResearchLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted && currentRequestId === requestIdRef.current) {
          setResearchError(err instanceof Error ? err.message : 'Unable to load published research');
          setIsResearchLoading(false);
        }
      });

    // 3. Fetch GIS Geographic Filter Coverage (Available States & Districts)
    setIsGisLoading(true);
    setGisError(null);
    fetchGisFilterOptions()
      .then((options) => {
        if (isMounted && currentRequestId === requestIdRef.current) {
          setGisOptions(options);
          setIsGisLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted && currentRequestId === requestIdRef.current) {
          setGisError(err instanceof Error ? err.message : 'Unable to load geographic coverage');
          setIsGisLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [fetchTrigger]);

  const refresh = () => setFetchTrigger((prev) => prev + 1);

  return {
    indicators,
    isIndicatorsLoading,
    indicatorsError,

    researchDocuments,
    isResearchLoading,
    researchError,

    gisOptions,
    isGisLoading,
    gisError,

    refresh,
  };
}
