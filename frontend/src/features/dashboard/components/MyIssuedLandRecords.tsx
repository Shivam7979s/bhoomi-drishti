import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Bot, MapPin, Plus, ShieldCheck, FileCheck2 } from 'lucide-react';
import { getMyLandRecords } from '../../land-records/services/landRecordService';
import type { LandRecord } from '../../land-records/types/landRecord';
import { useLanguage } from '../../../context/LanguageContext';
import { LinkLandRecordModal } from './LinkLandRecordModal';

export function MyIssuedLandRecords() {
  const [records, setRecords] = useState<LandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const { t } = useLanguage();

  const fetchRecords = useCallback(() => {
    let active = true;
    getMyLandRecords()
      .then((data) => {
        if (active) {
          setRecords(data || []);
        }
      })
      .catch(() => {
        if (active) setRecords([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleRecordAdded = (newRec: LandRecord) => {
    setRecords((prev) => [newRec, ...prev]);
  };

  return (
    <section className="mb-9">
      {/* Header section with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {t.issuedRecords.heading}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/80">
              {records.length} Verified
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            {t.issuedRecords.subheading}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsLinkModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Link Khasra / Khatauni</span>
          </button>

          {records.length > 0 && (
            <Link
              to="/land-records"
              className="text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 transition flex items-center gap-1"
            >
              <span>{t.issuedRecords.viewAll} ({records.length})</span>
              <span>→</span>
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-white border border-slate-200/90 p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-2.5" />
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-5" />
              <div className="h-8 bg-slate-50 rounded" />
            </div>
          ))}
        </div>
      ) : records.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {records.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                    {rec.state}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {rec.status || t.issuedRecords.activeStatus}
                  </span>
                </div>

                <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 leading-snug">
                  Parcel #{rec.parcelNumber}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{rec.village}, {rec.district}</span>
                </p>
                <div className="mt-2.5 text-xs text-slate-600">
                  <span className="font-bold text-slate-900">
                    {(rec.landAreaSqMeters / 10000).toFixed(2)} {t.issuedRecords.areaHectares}
                  </span>{' '}
                  · {rec.landUseType}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <Link
                  to="/gis"
                  className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 transition"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>{t.issuedRecords.gisMap}</span>
                </Link>
                <Link
                  to="/assistant"
                  className="font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition"
                >
                  <Bot className="h-3.5 w-3.5 text-amber-600" />
                  <span>{t.issuedRecords.askAi}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Real Account Empty State (DigiLocker / Sovereign Onboarding Card) */
        <div className="rounded-3xl border-2 border-dashed border-emerald-200/90 bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30 p-8 sm:p-10 flex flex-col items-center text-center shadow-xs">
          <div className="relative mb-4">
            <div className="h-16 w-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-inner">
              <FileCheck2 className="h-8 w-8 text-emerald-800" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white shadow-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            No Land Records Linked to Your Account Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mt-2 leading-relaxed font-medium">
            Link your official <strong>Khasra - Khatauni (B-1)</strong>, <strong>7/12 (Saat Baara)</strong>, or <strong>RoR</strong> from your State Revenue Department to access verified digital title instruments, surveyed GPS coordinates, and AI statutory advisory.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => setIsLinkModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Link Your First Khasra / Khatauni Record</span>
            </button>

            <Link
              to="/gis"
              className="flex items-center gap-1.5 px-5 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold shadow-2xs transition"
            >
              <Compass className="h-4 w-4 text-emerald-700" />
              <span>Explore Public Cadastre Map</span>
            </Link>
          </div>

          <div className="mt-6 pt-5 border-t border-emerald-100/80 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[11.5px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              MP Bhulekh & Land Revenue Code 1959
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Maharashtra Mahabhumi (7/12 & 8A)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              UP Bhulekh Bhu-Abhilekh
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Karnataka Bhoomi & RTC
            </span>
          </div>
        </div>
      )}

      {/* Link Land Record Modal */}
      <LinkLandRecordModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSuccess={handleRecordAdded}
      />
    </section>
  );
}
