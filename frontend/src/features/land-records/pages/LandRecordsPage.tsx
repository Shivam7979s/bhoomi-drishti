import { useCallback, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Edit2,
  Eye,
  Filter,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Bot,
  Building2,
  FileCheck2,
  Scale,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { LandRecordDetailsModal } from '../components/LandRecordDetailsModal';
import { LandRecordFormModal } from '../components/LandRecordFormModal';
import { SpatialSearchModal } from '../components/SpatialSearchModal';
import {
  createLandRecord,
  deleteLandRecord,
  listLandRecords,
  updateLandRecord,
} from '../services/landRecordService';
import type {
  CreateLandRecordRequest,
  LandRecord,
  LandRecordFilterParams,
  PageResponse,
  UpdateLandRecordRequest,
} from '../types/landRecord';

export function LandRecordsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const isOfficial = user?.role === 'GOVERNMENT_OFFICIAL' || user?.role === 'ADMIN';

  // Display Mode: Cards vs Table
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Data state
  const [data, setData] = useState<PageResponse<LandRecord> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<LandRecordFilterParams>({
    parcelNumber: '',
    state: '',
    district: '',
    landUseType: '',
    status: '',
    page: 0,
    size: 16,
  });

  // Spatial search mode state
  const [spatialFilterActive, setSpatialFilterActive] = useState<string | null>(null);

  // Modals state
  const [selectedRecord, setSelectedRecord] = useState<LandRecord | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<LandRecord | null>(null);
  const [isSpatialModalOpen, setIsSpatialModalOpen] = useState<boolean>(false);
  const [deletingRecord, setDeletingRecord] = useState<LandRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listLandRecords(filters);
      setData(response);
      setSpatialFilterActive(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch land records';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!spatialFilterActive) {
      fetchRecords();
    }
  }, [fetchRecords, spatialFilterActive]);

  const handleFilterChange = (key: keyof LandRecordFilterParams, val: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: val,
      page: 0,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      parcelNumber: '',
      state: '',
      district: '',
      landUseType: '',
      status: '',
      page: 0,
      size: 16,
    });
    setSpatialFilterActive(null);
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleCreateOrUpdate = async (formData: CreateLandRecordRequest | UpdateLandRecordRequest) => {
    if (editingRecord) {
      await updateLandRecord(editingRecord.id, formData as UpdateLandRecordRequest);
    } else {
      await createLandRecord(formData as CreateLandRecordRequest);
    }
    fetchRecords();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    try {
      await deleteLandRecord(deletingRecord.id);
      setDeletingRecord(null);
      fetchRecords();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete record';
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSpatialResultsFound = (response: PageResponse<LandRecord>, queryType: string) => {
    setData(response);
    setSpatialFilterActive(queryType);
  };

  // Metric computations
  const metrics = useMemo(() => {
    const list = data?.content || [];
    const totalParcels = data?.totalElements || list.length;
    const totalAreaHectares = list.reduce((sum, r) => sum + (r.landAreaSqMeters || 0) / 10000, 0);
    const activeCount = list.filter((r) => r.status === 'ACTIVE').length;
    const uniqueStates = new Set(list.map((r) => r.state).filter(Boolean)).size;

    return {
      totalParcels,
      totalAreaHectares: totalAreaHectares.toFixed(2),
      activeCount,
      uniqueStates: uniqueStates > 0 ? uniqueStates : 4,
    };
  }, [data]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. Sovereign Breadcrumb & Header ── */}
      <div className="border-b border-slate-200/90 pb-5">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
          <Link to="/dashboard" className="hover:text-emerald-800 transition">
            {t.landRecordsPage.breadcrumbHome}
          </Link>
          <span>/</span>
          <span className="text-emerald-950 font-bold">
            {t.landRecordsPage.breadcrumbCurrent}
          </span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              {t.landRecordsPage.pageTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              {t.landRecordsPage.pageSubtitle}
            </p>
          </div>

          {/* Quick Actions (Spatial Query, Add Record, View Switcher) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Switcher (Cards vs Table) */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={t.landRecordsPage.cardView}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.landRecordsPage.cardView}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={t.landRecordsPage.tableView}
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.landRecordsPage.tableView}</span>
              </button>
            </div>

            {/* Spatial query modal trigger */}
            <button
              type="button"
              onClick={() => setIsSpatialModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/80 px-3.5 py-2 text-xs sm:text-sm font-bold text-emerald-900 shadow-2xs hover:bg-emerald-100 transition cursor-pointer"
            >
              <Compass className="h-4 w-4 text-emerald-700" />
              <span>{t.landRecordsPage.spatialSearchBtn}</span>
            </button>

            {/* Add Record (Officials / Admins) */}
            {isOfficial ? (
              <button
                type="button"
                onClick={() => {
                  setEditingRecord(null);
                  setIsFormModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:from-emerald-800 hover:to-teal-900 transition cursor-pointer active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>{t.landRecordsPage.addRecordBtn}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── 2. Cadastral Metric KPI Summary Chips ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Parcels */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t.landRecordsPage.metricTotalParcels}
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {metrics.totalParcels}
            </p>
          </div>
        </div>

        {/* Metric 2: Total Area */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t.landRecordsPage.metricTotalArea}
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {metrics.totalAreaHectares} <span className="text-sm font-semibold text-slate-500">Ha</span>
            </p>
          </div>
        </div>

        {/* Metric 3: Active Titles */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-2xs">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t.landRecordsPage.metricActiveTitles}
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5 flex items-center gap-2">
              <span>{metrics.activeCount}</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
            </p>
          </div>
        </div>

        {/* Metric 4: Jurisdictions */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center shrink-0 border border-purple-200/60 shadow-2xs">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t.landRecordsPage.metricStatesCovered}
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {metrics.uniqueStates} <span className="text-xs font-semibold text-slate-500">States</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. Spatial Filter Alert (if active) ── */}
      {spatialFilterActive && (
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 flex items-center justify-between text-cyan-950 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <Compass className="h-5 w-5 text-cyan-700 shrink-0" />
            <span>
              Active PostGIS Spatial Intersection Query: <strong>{spatialFilterActive}</strong>. Found{' '}
              <strong>{data?.totalElements ?? 0}</strong> intersecting parcels.
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300 bg-white px-3 py-1 font-bold text-cyan-900 hover:bg-cyan-100 transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            <span>{t.landRecordsPage.resetFiltersBtn}</span>
          </button>
        </div>
      )}

      {/* ── 4. Sovereign Filter & Search Toolbar ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Search Parcel */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t.landRecordsPage.searchPlaceholder}
              value={filters.parcelNumber || ''}
              onChange={(e) => handleFilterChange('parcelNumber', e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden transition"
            />
          </div>

          {/* State Selector */}
          <div>
            <select
              value={filters.state || ''}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden transition cursor-pointer"
            >
              <option value="">{t.landRecordsPage.allStates}</option>
              <option value="Madhya Pradesh">Madhya Pradesh (MP)</option>
              <option value="Uttar Pradesh">Uttar Pradesh (UP)</option>
              <option value="Maharashtra">Maharashtra (MH)</option>
              <option value="Gujarat">Gujarat (GJ)</option>
            </select>
          </div>

          {/* District Filter */}
          <div>
            <input
              type="text"
              placeholder={t.landRecordsPage.filterDistrict}
              value={filters.district || ''}
              onChange={(e) => handleFilterChange('district', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden transition"
            />
          </div>

          {/* Land Use Classification */}
          <div>
            <select
              value={filters.landUseType || ''}
              onChange={(e) => handleFilterChange('landUseType', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden transition cursor-pointer"
            >
              <option value="">{t.landRecordsPage.allLandUse}</option>
              <option value="AGRICULTURAL">Agricultural</option>
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="INDUSTRIAL">Industrial</option>
              <option value="GOVERNMENT">Government</option>
              <option value="FOREST">Forest</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden transition cursor-pointer"
            >
              <option value="">{t.landRecordsPage.allStatuses}</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
              <option value="DISPUTED">DISPUTED</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Multiple filters combine automatically across spatial boundaries.</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-slate-600 hover:text-slate-900 font-semibold underline transition cursor-pointer"
            >
              {t.landRecordsPage.resetFiltersBtn}
            </button>
            <button
              type="button"
              onClick={fetchRecords}
              className="inline-flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 font-bold transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. Records Canvas (Cards vs Table) ── */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900 text-center">
          <p className="font-bold text-sm">Error Loading Land Records</p>
          <p className="text-xs text-rose-700 mt-1">{error}</p>
          <button
            type="button"
            onClick={fetchRecords}
            className="mt-3 px-4 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-bold shadow-xs hover:bg-rose-800"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-700" />
          <p className="text-xs sm:text-sm font-semibold text-slate-700">
            Querying PostGIS Cadastral Registry...
          </p>
        </div>
      ) : !data || data.content.length === 0 ? (
        <div className="py-16 px-4 bg-white rounded-2xl border border-slate-200/90 text-center flex flex-col items-center justify-center">
          <Layers className="h-10 w-10 text-slate-400 mb-3" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            {t.landRecordsPage.emptyTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1">
            {t.landRecordsPage.emptyDesc}
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold shadow-xs hover:bg-emerald-900 transition"
          >
            {t.landRecordsPage.resetFiltersBtn}
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* ── CARD VIEW: Sovereign Land Certificates ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
          {data.content.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                {/* State Tag & Status Indicator */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                    {rec.state}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {rec.status}
                  </span>
                </div>

                {/* Parcel Number */}
                <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 group-hover:text-emerald-950 transition leading-snug">
                  Parcel #{rec.parcelNumber}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Survey No: <span className="font-semibold text-slate-700">{rec.surveyNumber || 'N/A'}</span>
                </p>

                {/* Location */}
                <p className="text-xs text-slate-600 mt-2 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {rec.village}, {rec.tehsil}, {rec.district}
                  </span>
                </p>

                {/* Area & Land Use */}
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                    {(rec.landAreaSqMeters / 10000).toFixed(2)} Ha
                  </span>
                  <span className="font-semibold text-slate-600">
                    {rec.landUseType}
                  </span>
                </div>

                {/* Owner Name */}
                <p className="text-xs text-slate-500 mt-2 truncate">
                  Owner: <span className="font-medium text-slate-800">{rec.ownerName}</span>
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(rec)}
                  className="font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer transition"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>{t.landRecordsPage.actionViewDetails}</span>
                </button>

                <div className="flex items-center gap-2">
                  <Link
                    to="/gis"
                    className="font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 transition"
                    title={t.landRecordsPage.actionGisMap}
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span>GIS</span>
                  </Link>

                  <Link
                    to="/assistant"
                    className="font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 transition"
                    title={t.landRecordsPage.actionAskAi}
                  >
                    <Bot className="h-3.5 w-3.5" />
                    <span>AI</span>
                  </Link>

                  {/* Official Edit & Delete Controls */}
                  {isOfficial && (
                    <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRecord(rec);
                          setIsFormModalOpen(true);
                        }}
                        className="p-1 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-slate-100 cursor-pointer"
                        title={t.landRecordsPage.actionEdit}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingRecord(rec)}
                        className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title={t.landRecordsPage.actionDelete}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── TABLE VIEW: High-Density Sovereign Registry ── */
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200/90 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3.5">{t.landRecordsPage.colParcel}</th>
                  <th scope="col" className="px-5 py-3.5">{t.landRecordsPage.colLocation}</th>
                  <th scope="col" className="px-5 py-3.5">{t.landRecordsPage.colArea}</th>
                  <th scope="col" className="px-5 py-3.5">{t.landRecordsPage.colLandUse}</th>
                  <th scope="col" className="px-5 py-3.5">Owner</th>
                  <th scope="col" className="px-5 py-3.5">{t.landRecordsPage.colStatus}</th>
                  <th scope="col" className="px-5 py-3.5 text-right">{t.landRecordsPage.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.content.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <div>#{rec.parcelNumber}</div>
                      <div className="text-[11px] font-normal text-slate-400">
                        SN: {rec.surveyNumber || 'None'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <div className="font-semibold text-slate-800">{rec.village}, {rec.tehsil}</div>
                      <div className="text-slate-400">{rec.district}, {rec.state}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs">
                      <div className="font-bold text-slate-900">
                        {(rec.landAreaSqMeters / 10000).toFixed(2)} Ha
                      </div>
                      <div className="text-slate-400">{rec.landAreaSqMeters.toLocaleString()} m²</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <span className="inline-block rounded-md bg-slate-100 border border-slate-200/60 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {rec.landUseType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium text-slate-800">
                      {rec.ownerName}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(rec)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition cursor-pointer"
                        >
                          {t.landRecordsPage.actionViewDetails}
                        </button>
                        <Link
                          to="/gis"
                          className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-50 transition"
                          title="GIS"
                        >
                          <Compass className="h-4 w-4" />
                        </Link>
                        <Link
                          to="/assistant"
                          className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 transition"
                          title="Ask AI"
                        >
                          <Bot className="h-4 w-4" />
                        </Link>
                        {isOfficial && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRecord(rec);
                                setIsFormModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 cursor-pointer"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingRecord(rec)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 6. Pagination Controls ── */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 font-medium">
            Page {data.page + 1} of {data.totalPages} ({data.totalElements} Total Records)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={data.first}
              onClick={() => handlePageChange(data.page - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={data.last}
              onClick={() => handlePageChange(data.page + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── 7. Modals ── */}
      {selectedRecord && (
        <LandRecordDetailsModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {isFormModalOpen && (
        <LandRecordFormModal
          initialRecord={editingRecord}
          onClose={() => setIsFormModalOpen(false)}
          onSubmit={handleCreateOrUpdate}
        />
      )}

      {isSpatialModalOpen && (
        <SpatialSearchModal
          onClose={() => setIsSpatialModalOpen(false)}
          onResultsFound={handleSpatialResultsFound}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Confirm Deletion</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete Parcel <strong>#{deletingRecord.parcelNumber}</strong>? This action cannot be undone in the PostGIS database.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Parcel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
