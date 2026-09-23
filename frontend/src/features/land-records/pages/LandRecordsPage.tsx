import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
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
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
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

  const isOfficial = user?.role === 'GOVERNMENT_OFFICIAL' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

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
    size: 20,
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
      page: 0, // reset to first page on filter change
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
      size: 20,
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

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    INACTIVE: 'bg-slate-100 text-slate-700 ring-1 ring-slate-600/20',
    DISPUTED: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    PENDING_VERIFICATION: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Land Records Management
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Phase 3 PostGIS
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Spatial cadastral registry with SRID 4326 PostGIS geometry and role-based governance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Spatial query button */}
          <button
            type="button"
            onClick={() => setIsSpatialModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-medium text-indigo-700 shadow-xs hover:bg-indigo-100 transition"
          >
            <Compass className="h-4 w-4 text-indigo-600" />
            Spatial Query
          </button>

          {/* Create record button (Officials & Admins only) */}
          {isOfficial ? (
            <button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                setIsFormModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white shadow-xs hover:bg-emerald-700 transition"
            >
              <Plus className="h-4 w-4" />
              Add Land Record
            </button>
          ) : (
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              Role: {user?.role || 'PUBLIC'} (Read-Only)
            </span>
          )}
        </div>
      </div>

      {/* Spatial filter indicator banner */}
      {spatialFilterActive && (
        <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/70 p-3 text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600" />
            <span>
              Showing results from active PostGIS query: <strong>{spatialFilterActive}</strong>. Found{' '}
              <strong>{data?.totalElements ?? 0}</strong> intersecting parcels.
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="flex items-center gap-1 font-semibold text-indigo-700 hover:text-indigo-900"
          >
            <X className="h-3.5 w-3.5" />
            Reset to All Parcels
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
          {/* Search Parcel */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search parcel..."
              value={filters.parcelNumber || ''}
              onChange={(e) => handleFilterChange('parcelNumber', e.target.value)}
              className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-1.5 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* State */}
          <div>
            <input
              type="text"
              placeholder="Filter by state..."
              value={filters.state || ''}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* District */}
          <div>
            <input
              type="text"
              placeholder="Filter by district..."
              value={filters.district || ''}
              onChange={(e) => handleFilterChange('district', e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Land Use Type */}
          <div>
            <select
              value={filters.landUseType || ''}
              onChange={(e) => handleFilterChange('landUseType', e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Land Uses</option>
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
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="DISPUTED">Disputed</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Multiple filters combine automatically.</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-slate-500 hover:text-slate-700 underline"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={fetchRecords}
              className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-medium"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Records Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="mt-2 text-sm">Loading land records from PostGIS...</p>
          </div>
        ) : !data || data.content.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Layers className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-semibold text-slate-800">No land records found</h3>
            <p className="mt-1 text-xs text-slate-500">
              {spatialFilterActive
                ? 'No parcels intersected the provided spatial query geometry.'
                : 'Try adjusting your filters or add a new land record.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Parcel / Survey</th>
                  <th scope="col" className="px-5 py-3.5">Location</th>
                  <th scope="col" className="px-5 py-3.5">Area</th>
                  <th scope="col" className="px-5 py-3.5">Land Use</th>
                  <th scope="col" className="px-5 py-3.5">Owner</th>
                  <th scope="col" className="px-5 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.content.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      <div>{record.parcelNumber}</div>
                      <div className="text-xs text-slate-400">SN: {record.surveyNumber || 'None'}</div>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <div className="font-medium text-slate-700">{record.village}, {record.tehsil}</div>
                      <div className="text-slate-400">{record.district}, {record.state}</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs">
                      <div>{record.landAreaSqMeters.toLocaleString()} m²</div>
                      <div className="text-slate-400">({(record.landAreaSqMeters / 10000).toFixed(2)} ha)</div>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {record.landUseType}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <div className="font-medium text-slate-800">{record.ownerName}</div>
                      <div className="text-slate-400">{record.ownershipType}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${statusColors[record.status] || ''}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details */}
                        <button
                          type="button"
                          title="View Details & GeoJSON"
                          onClick={() => setSelectedRecord(record)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit Record (Officials & Admins) */}
                        {isOfficial && (
                          <button
                            type="button"
                            title="Edit Parcel"
                            onClick={() => {
                              setEditingRecord(record);
                              setIsFormModalOpen(true);
                            }}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Delete Record (Admin Only) */}
                        {isAdmin && (
                          <button
                            type="button"
                            title="Delete Parcel (Admin Only)"
                            onClick={() => setDeletingRecord(record)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
            <div>
              Showing Page <strong>{data.page + 1}</strong> of <strong>{data.totalPages}</strong> ({data.totalElements} total parcels)
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={data.first}
                onClick={() => handlePageChange(data.page - 1)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-700 shadow-xs hover:bg-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={data.last}
                onClick={() => handlePageChange(data.page + 1)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-700 shadow-xs hover:bg-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedRecord && (
        <LandRecordDetailsModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {isFormModalOpen && (
        <LandRecordFormModal
          initialRecord={editingRecord}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingRecord(null);
          }}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Delete Land Record</h3>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete parcel <strong>{deletingRecord.parcelNumber}</strong>?
              This will remove the boundary geometry from PostGIS permanently.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingRecord(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
