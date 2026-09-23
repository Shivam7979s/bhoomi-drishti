import { useState } from 'react';
import { Check, Copy, MapPin, X } from 'lucide-react';
import type { LandRecord } from '../types/landRecord';

interface LandRecordDetailsModalProps {
  record: LandRecord;
  onClose: () => void;
}

export function LandRecordDetailsModal({ record, onClose }: LandRecordDetailsModalProps) {
  const [copied, setCopied] = useState(false);

  const statusColors = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    INACTIVE: 'bg-slate-100 text-slate-700 ring-1 ring-slate-600/20',
    DISPUTED: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    PENDING_VERIFICATION: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  };

  const handleCopyGeoJson = () => {
    navigator.clipboard.writeText(JSON.stringify(record.boundary, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const areaInHectares = (record.landAreaSqMeters / 10000).toFixed(4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{record.parcelNumber}</h2>
              <p className="text-xs text-slate-500">Survey No: {record.surveyNumber || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${statusColors[record.status] || ''}`}>
              {record.status}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm">
          {/* Location Hierarchy */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Location</h3>
            <div className="mt-2 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-4">
              <div>
                <span className="block text-xs text-slate-500">State</span>
                <span className="font-semibold text-slate-800">{record.state}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">District</span>
                <span className="font-semibold text-slate-800">{record.district}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">Tehsil</span>
                <span className="font-semibold text-slate-800">{record.tehsil}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">Village</span>
                <span className="font-semibold text-slate-800">{record.village}</span>
              </div>
            </div>
          </div>

          {/* Land Attributes */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Land & Ownership</h3>
            <div className="mt-2 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
              <div>
                <span className="block text-xs text-slate-500">Land Area</span>
                <span className="font-semibold text-slate-800">
                  {record.landAreaSqMeters.toLocaleString()} m²
                </span>
                <span className="block text-[11px] text-slate-500">({areaInHectares} ha)</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">Land Use Type</span>
                <span className="inline-block mt-0.5 rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-800">
                  {record.landUseType}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">Ownership Type</span>
                <span className="font-semibold text-slate-800">{record.ownershipType}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-xs text-slate-500">Owner Name</span>
                <span className="font-semibold text-slate-800">{record.ownerName}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">Owner Identifier</span>
                <span className="text-xs text-slate-700">{record.ownerIdentifier || 'None'}</span>
                <span className="block text-[10px] text-slate-400">Prototype identifier only</span>
              </div>
            </div>
          </div>

          {/* PostGIS Boundary Geometry */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Spatial Boundary (PostGIS SRID 4326)
              </h3>
              <button
                type="button"
                onClick={handleCopyGeoJson}
                className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy GeoJSON'}
              </button>
            </div>
            <div className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3.5 font-mono text-xs text-emerald-400">
              <pre>{JSON.stringify(record.boundary, null, 2)}</pre>
            </div>
          </div>

          {/* Metadata */}
          <div className="border-t border-slate-200 pt-3 text-xs text-slate-400 flex justify-between">
            <span>Created: {new Date(record.createdAt).toLocaleString()}</span>
            <span>Updated: {new Date(record.updatedAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
