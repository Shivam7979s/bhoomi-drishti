import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Shield,
  ShieldCheck,
  LogOut,
  ChevronRight,
  MapPin,
  Lock,
  CheckCircle2,
  FileText,
  Layers,
  Bot,
  ArrowUpRight,
  Landmark,
  Fingerprint,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const roleLabel = useMemo(() => {
    if (!user) return '';
    switch (user.role) {
      case 'ADMIN':
        return t.profilePage.roleAdmin;
      case 'GOVERNMENT_OFFICIAL':
        return t.profilePage.roleGovOfficial;
      case 'RESEARCHER':
        return t.profilePage.roleResearcher;
      case 'ACADEMIA':
        return t.profilePage.roleAcademia;
      case 'PUBLIC':
      default:
        return t.profilePage.rolePublic;
    }
  }, [user, t]);

  if (!user) {
    return null;
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ── 1. Sovereign Breadcrumbs & Header Bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/90 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5">
            <Link to="/dashboard" className="flex items-center gap-1 hover:text-emerald-700 transition">
              <span>{t.profilePage.breadcrumbHome}</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-emerald-900 font-bold">{t.profilePage.breadcrumbCurrent}</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {t.profilePage.pageTitle}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>{t.profilePage.badgeVerifiedSession}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 shadow-2xs">
              <Landmark className="h-3.5 w-3.5 text-blue-600" />
              <span>{t.profilePage.badgeInstitutional}</span>
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-3xl font-medium">
            {t.profilePage.pageSubtitle}
          </p>
        </div>

        {/* Sign Out Action Button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-800 shadow-2xs hover:bg-rose-100 hover:border-rose-300 transition active:scale-95 disabled:opacity-60 shrink-0 cursor-pointer"
        >
          <LogOut className="h-4 w-4 text-rose-600" aria-hidden="true" />
          <span>{loggingOut ? t.profilePage.btnSigningOut : t.profilePage.btnSignOut}</span>
        </button>
      </div>

      {/* ── 2. Sovereign Metric KPI Chips ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Account Status */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t.profilePage.metricAccountStatusSub}
            </p>
            <p className="text-sm font-extrabold text-slate-900 truncate">
              {t.profilePage.metricAccountStatusTitle}
            </p>
          </div>
        </div>

        {/* Metric 2: Platform Role */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <Shield className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t.profilePage.metricPlatformRoleSub}
            </p>
            <p className="text-sm font-extrabold text-blue-900 truncate">
              {roleLabel}
            </p>
          </div>
        </div>

        {/* Metric 3: Jurisdiction */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t.profilePage.metricJurisdictionSub}
            </p>
            <p className="text-sm font-extrabold text-slate-900 truncate">
              {t.profilePage.metricJurisdictionTitle}
            </p>
          </div>
        </div>

        {/* Metric 4: Security */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
            <Lock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t.profilePage.metricSecuritySub}
            </p>
            <p className="text-sm font-extrabold text-purple-900 truncate">
              {t.profilePage.metricSecurityTitle}
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. Two-Column Sovereign Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personal Credentials & Authentication Boundary (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {t.profilePage.secCredentialsTitle}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {t.profilePage.secCredentialsSub}
                  </p>
                </div>
              </div>
            </div>

            {/* Citizen Identity Banner */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-100 mb-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white font-black text-2xl shadow-md border-2 border-white">
                {userInitial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-slate-900 truncate">
                    {user.name}
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100/80 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900 uppercase">
                    <ShieldCheck className="h-3 w-3 text-emerald-700" />
                    {roleLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                  {user.email}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-semibold mt-1">
                  <Fingerprint className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Aadhaar / e-Pramaan SSO Linked Identity</span>
                </div>
              </div>
            </div>

            {/* Credential Data List */}
            <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between py-3.5 gap-1">
                <dt className="font-bold text-slate-500 flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  {t.profilePage.lblFullName}
                </dt>
                <dd className="font-extrabold text-slate-900">{user.name}</dd>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between py-3.5 gap-1">
                <dt className="font-bold text-slate-500 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  {t.profilePage.lblEmail}
                </dt>
                <dd className="font-medium text-slate-900">{user.email}</dd>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between py-3.5 gap-1">
                <dt className="font-bold text-slate-500 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-400" />
                  {t.profilePage.lblPlatformRole}
                </dt>
                <dd>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                    <Shield className="h-3 w-3 text-emerald-700" aria-hidden="true" />
                    {roleLabel}
                  </span>
                </dd>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between py-3.5 gap-1">
                <dt className="font-bold text-slate-500 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-400" />
                  {t.profilePage.lblSignedInVia}
                </dt>
                <dd className="text-slate-900 font-semibold">
                  {user.provider === 'GOOGLE'
                    ? t.profilePage.valGoogleSso
                    : t.profilePage.valEmailPassword}
                </dd>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between py-3.5 gap-1">
                <dt className="font-bold text-slate-500 flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-slate-400" />
                  {t.profilePage.lblAccountId}
                </dt>
                <dd className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md self-start sm:self-center">
                  {user.id}
                </dd>
              </div>
            </dl>

            {/* Cryptographic Security Notice */}
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-900 leading-relaxed flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950 mb-0.5">Cryptographic Session Protection</p>
                <p className="text-slate-600 font-normal">{t.profilePage.noticeSecurity}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Assigned Cadastral & Revenue Jurisdictions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-800 font-bold">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {t.profilePage.secJurisdictionsTitle}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {t.profilePage.secJurisdictionsSub}
                  </p>
                </div>
              </div>
            </div>

            {/* Jurisdictions Stack */}
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                  <Landmark className="h-3.5 w-3.5 text-blue-600" />
                  <span>{t.profilePage.lblStateRevenue}</span>
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                  {t.profilePage.valStateRevenue}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                  <MapPin className="h-3.5 w-3.5 text-amber-600" />
                  <span>{t.profilePage.lblDistricts}</span>
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                  {t.profilePage.valDistricts}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                  <Layers className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{t.profilePage.lblTehsils}</span>
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                  {t.profilePage.valTehsils}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                  <span>{t.profilePage.lblAccessScope}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center rounded-md bg-emerald-100/70 px-2 py-0.5 text-[11px] font-bold text-emerald-900">
                    Registry Search
                  </span>
                  <span className="inline-flex items-center rounded-md bg-blue-100/70 px-2 py-0.5 text-[11px] font-bold text-blue-900">
                    GIS Cadastre
                  </span>
                  <span className="inline-flex items-center rounded-md bg-amber-100/70 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                    RoR / Khasra Download
                  </span>
                  <span className="inline-flex items-center rounded-md bg-purple-100/70 px-2 py-0.5 text-[11px] font-bold text-purple-900">
                    Statutory AI Assistant
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Navigation Links */}
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Quick Portal Services
              </p>
              <Link
                to="/land-records"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/40 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-emerald-700" />
                  <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                    {t.header.myLandRecords}
                  </span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700 transition" />
              </Link>

              <Link
                to="/gis"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="h-4 w-4 text-blue-700" />
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                    {t.sidebar.gisCadastreMap}
                  </span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-700 transition" />
              </Link>

              <Link
                to="/assistant"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/40 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Bot className="h-4 w-4 text-purple-700" />
                  <span className="text-xs font-bold text-slate-800 group-hover:text-purple-900">
                    {t.sidebar.statutoryAi}
                  </span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-purple-700 transition" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Statutory Compliance & DILRMP Institutional Banner ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">
              Digital India Land Records Modernization Programme (DILRMP) Compliance
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Sovereign cadastral and geospatial land governance standards aligned with Ministry of Rural Development, Department of Land Resources (DoLR), Government of India.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-mono font-bold text-slate-700">
            ISO 19152 LADM
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-mono font-bold text-slate-700">
            OGC WFS/WMS
          </span>
        </div>
      </div>
    </div>
  );
}
