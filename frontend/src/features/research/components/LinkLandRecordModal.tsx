import { useEffect, useState } from 'react';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import { listLandRecords } from '../../land-records/services/landRecordService';
import type { LandRecord } from '../../land-records/types/landRecord';

interface LinkLandRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLink: (landRecordId: string) => Promise<void>;
  alreadyLinkedIds: string[];
}

export function LinkLandRecordModal({
  isOpen,
  onClose,
  onLink,
  alreadyLinkedIds,
}: LinkLandRecordModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [district, setDistrict] = useState('');
  const [records, setRecords] = useState<LandRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setDistrict('');
      setRecords([]);
      setError(null);
      return;
    }
    loadParcels();
  }, [isOpen]);

  async function loadParcels() {
    setLoading(true);
    setError(null);
    try {
      const page = await listLandRecords({
        parcelNumber: searchTerm.trim() || undefined,
        district: district.trim() || undefined,
        size: 10,
      });
      setRecords(page.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search parcels');
    } finally {
      setLoading(false);
    }
  }

  async function handleLink(id: string) {
    setLinkingId(id);
    setError(null);
    try {
      await onLink(id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link parcel');
    } finally {
      setLinkingId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <MapPin className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-semibold text-slate-900">Link Land Record Parcel</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadParcels()}
                placeholder="Search parcel number..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="relative w-full sm:w-48">
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadParcels()}
                placeholder="District..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={loadParcels}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </button>
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-slate-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-emerald-600" />
                Loading land records...
              </div>
            ) : records.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No land parcels found matching your query.
              </div>
            ) : (
              records.map((r) => {
                const isLinked = alreadyLinkedIds.includes(r.id);
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 transition hover:bg-slate-50"
                  >
                    <div>
                      <div className="font-medium text-slate-900">{r.parcelNumber}</div>
                      <div className="text-xs text-slate-500">
                        {r.village}, {r.tehsil}, {r.district}, {r.state} • {r.landUseType}
                      </div>
                    </div>
                    <div>
                      {isLinked ? (
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          Already Linked
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleLink(r.id)}
                          disabled={linkingId === r.id}
                          className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {linkingId === r.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Link Parcel'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
