import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { listWorkspaceProjects, listWorkspaces } from '../../collaboration/services/collaborationService';
import type { Project } from '../../collaboration/types';
import { fetchGisFilterOptions } from '../../gis/services/gisService';
import type { GisFilterOptions } from '../../gis/types/gis';
import { fetchAdministrativeSummary } from '../services/governanceService';
import type {
  GovernanceAdministrativeSummaryResponse,
  GovernanceScopeType,
  GovernanceSummaryQueryParams,
  IndicatorCategory,
} from '../types/governance';

export function useGovernanceSummary() {
  const { isAuthenticated } = useAuth();

  // Scope hierarchy states - default strictly to STATE: "Madhya Pradesh"
  const [scopeType, setScopeType] = useState<GovernanceScopeType>('STATE');
  const [state, setState] = useState<string>('Madhya Pradesh');
  const [district, setDistrict] = useState<string>('');
  const [tehsil, setTehsil] = useState<string>('');
  const [village, setVillage] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');

  // Optional category filter
  const [category, setCategory] = useState<IndicatorCategory | 'ALL'>('ALL');

  // Async states
  const [summary, setSummary] = useState<GovernanceAdministrativeSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Administrative boundary & project options
  const [gisOptions, setGisOptions] = useState<GisFilterOptions | null>(null);
  const [accessibleProjects, setAccessibleProjects] = useState<Project[]>([]);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load GIS options on mount
  useEffect(() => {
    let active = true;
    async function loadOptions() {
      setLoadingOptions(true);
      try {
        const opts = await fetchGisFilterOptions();
        if (active) {
          setGisOptions(opts);
          if (opts.states.length > 0 && !opts.states.includes('Madhya Pradesh')) {
            setState(opts.states[0]);
          }
        }
      } catch (err) {
        console.warn('Failed to load GIS boundary options:', err);
      } finally {
        if (active) setLoadingOptions(false);
      }
    }
    loadOptions();
    return () => {
      active = false;
    };
  }, []);

  // Load accessible projects for authenticated users
  useEffect(() => {
    let active = true;
    if (!isAuthenticated) {
      setAccessibleProjects([]);
      return;
    }

    async function loadProjects() {
      try {
        const wsRes = await listWorkspaces(true, 0, 50);
        const projectsList: Project[] = [];
        for (const ws of wsRes.content) {
          const pRes = await listWorkspaceProjects(ws.id, 0, 50);
          projectsList.push(...pRes.content);
        }
        if (active) {
          setAccessibleProjects(projectsList);
        }
      } catch (err) {
        console.warn('Failed to load accessible collaboration projects:', err);
      }
    }
    loadProjects();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // Determine if current scope hierarchy is complete and valid to query
  const isScopeValid = useCallback((): boolean => {
    switch (scopeType) {
      case 'STATE':
        return Boolean(state.trim());
      case 'DISTRICT':
        return Boolean(state.trim() && district.trim());
      case 'TEHSIL':
        return Boolean(state.trim() && district.trim() && tehsil.trim());
      case 'VILLAGE':
        return Boolean(state.trim() && district.trim() && tehsil.trim() && village.trim());
      case 'PROJECT':
        return Boolean(projectId.trim());
      default:
        return false;
    }
  }, [scopeType, state, district, tehsil, village, projectId]);

  // Fetch summary execution
  const executeQuery = useCallback(async () => {
    if (!isScopeValid()) {
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const params: GovernanceSummaryQueryParams = {
      scopeType,
      state: state.trim() || undefined,
      district: district.trim() || undefined,
      tehsil: tehsil.trim() || undefined,
      village: village.trim() || undefined,
      projectId: projectId.trim() || undefined,
      category: category === 'ALL' ? undefined : category,
    };

    try {
      const res = await fetchAdministrativeSummary(params, controller.signal);
      setSummary(res);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return; // Aborted: Ignore
      }
      setError(err instanceof Error ? err : new Error('Failed to load administrative summary'));
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [scopeType, state, district, tehsil, village, projectId, category, isScopeValid]);

  // Auto-fetch when valid scope or category changes
  useEffect(() => {
    executeQuery();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [executeQuery]);

  // Scope setters maintaining strict hierarchy invariant
  const handleScopeTypeChange = (newType: GovernanceScopeType) => {
    setScopeType(newType);
    if (newType === 'PROJECT') {
      // Clear geographic fields when switching to PROJECT
      setDistrict('');
      setTehsil('');
      setVillage('');
      if (accessibleProjects.length > 0 && !projectId) {
        setProjectId(accessibleProjects[0].id);
      }
    } else {
      // Clear projectId when switching to geographic scope
      setProjectId('');
      if (!state && gisOptions?.states && gisOptions.states.length > 0) {
        setState(gisOptions.states[0]);
      }
      if (newType === 'STATE') {
        setDistrict('');
        setTehsil('');
        setVillage('');
      } else if (newType === 'DISTRICT') {
        setTehsil('');
        setVillage('');
      } else if (newType === 'TEHSIL') {
        setVillage('');
      }
    }
  };

  const handleStateChange = (newState: string) => {
    setState(newState);
    setDistrict('');
    setTehsil('');
    setVillage('');
  };

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    setTehsil('');
    setVillage('');
  };

  const handleTehsilChange = (newTehsil: string) => {
    setTehsil(newTehsil);
    setVillage('');
  };

  const handleVillageChange = (newVillage: string) => {
    setVillage(newVillage);
  };

  const handleProjectIdChange = (newProjectId: string) => {
    setProjectId(newProjectId);
  };

  const handleCategoryChange = (newCategory: IndicatorCategory | 'ALL') => {
    setCategory(newCategory);
  };

  return {
    scopeType,
    state,
    district,
    tehsil,
    village,
    projectId,
    category,
    summary,
    loading,
    error,
    gisOptions,
    accessibleProjects,
    loadingOptions,
    isScopeValid: isScopeValid(),
    setScopeType: handleScopeTypeChange,
    setState: handleStateChange,
    setDistrict: handleDistrictChange,
    setTehsil: handleTehsilChange,
    setVillage: handleVillageChange,
    setProjectId: handleProjectIdChange,
    setCategory: handleCategoryChange,
    refetch: executeQuery,
  };
}
