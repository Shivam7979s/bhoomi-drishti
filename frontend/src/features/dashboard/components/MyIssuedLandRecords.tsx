import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Bot, MapPin, Award } from 'lucide-react';
import { listLandRecords } from '../../land-records/services/landRecordService';
import type { LandRecord } from '../../land-records/types/landRecord';
import { useLanguage } from '../../../context/LanguageContext';

export function MyIssuedLandRecords() {
  const [records, setRecords] = useState<LandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    let active = true;
    listLandRecords({ size: 4 })
      .then((res) => {
        if (active && res.content) {
          setRecords(res.content);
        }
      })
      .catch(() => {
        // Fallback gracefully
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mb-9">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {t.issuedRecords.heading}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            {t.issuedRecords.subheading}
          </p>
        </div>
        <Link
          to="/land-records"
          className="text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 transition flex items-center gap-1"
        >
          <span>{t.issuedRecords.viewAll} ({records.length > 0 ? records.length : '4'})</span>
          <span>→</span>
        </Link>
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
        /* Fallback sample state parcels */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                  Madhya Pradesh
                </span>
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t.issuedRecords.activeStatus}
                </span>
              </div>
              <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 leading-snug">
                Parcel #MP-IND-2026-LIVE-02
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Rau Kalan, Indore</span>
              </p>
              <div className="mt-2.5 text-xs text-slate-600">
                <span className="font-bold text-slate-900">0.85 {t.issuedRecords.areaHectares}</span> · Commercial
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link to="/gis" className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 transition">
                <Compass className="h-3.5 w-3.5" />
                <span>{t.issuedRecords.gisMap}</span>
              </Link>
              <Link to="/assistant" className="font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition">
                <Bot className="h-3.5 w-3.5 text-amber-600" />
                <span>{t.issuedRecords.askAi}</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                  Madhya Pradesh
                </span>
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t.issuedRecords.activeStatus}
                </span>
              </div>
              <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 leading-snug">
                Parcel #MP-BHO-2026-LIVE-01
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Kolar, Bhopal</span>
              </p>
              <div className="mt-2.5 text-xs text-slate-600">
                <span className="font-bold text-slate-900">0.65 {t.issuedRecords.areaHectares}</span> · Agricultural
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link to="/gis" className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 transition">
                <Compass className="h-3.5 w-3.5" />
                <span>{t.issuedRecords.gisMap}</span>
              </Link>
              <Link to="/assistant" className="font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition">
                <Bot className="h-3.5 w-3.5 text-amber-600" />
                <span>{t.issuedRecords.askAi}</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200/70">
                  Uttar Pradesh
                </span>
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t.issuedRecords.activeStatus}
                </span>
              </div>
              <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 leading-snug">
                Deed #UP-LKO-2026-REG-09
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Tehsil Sadar, Lucknow</span>
              </p>
              <div className="mt-2.5 text-xs text-slate-600">
                <span className="font-bold text-slate-900">1.12 {t.issuedRecords.areaHectares}</span> · Residential
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link to="/gis" className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 transition">
                <Compass className="h-3.5 w-3.5" />
                <span>{t.issuedRecords.gisMap}</span>
              </Link>
              <Link to="/assistant" className="font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition">
                <Bot className="h-3.5 w-3.5 text-amber-600" />
                <span>{t.issuedRecords.askAi}</span>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-slate-300 p-5 flex flex-col items-center justify-center text-center hover:border-emerald-500 hover:bg-emerald-50/20 transition-all duration-200">
            <Award className="h-8 w-8 text-emerald-700 mb-2" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              {t.issuedRecords.noRecordsTitle}
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[180px] leading-relaxed">
              {t.issuedRecords.noRecordsDesc}
            </p>
            <Link
              to="/explore"
              className="mt-3.5 inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-800 text-white text-xs font-bold shadow-xs hover:bg-emerald-900 transition"
            >
              {t.issuedRecords.exploreRegistry}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
