import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileCheck,
  FileText,
  Landmark,
  LogIn,
  MapPin,
  Pause,
  Play,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';

/* ─────────────────────────────────────────────────────────────────────────────
   SLIDE 1: Cadastral Intelligence Visual (PostGIS Parcel Digital Twin)
───────────────────────────────────────────────────────────────────────────── */
function CadastreIllustration() {
  return (
    <div className="relative w-full h-[320px] sm:h-[360px] lg:h-[380px] flex items-center justify-center">
      {/* Background glow orb */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 via-emerald-400/20 to-indigo-400/20 rounded-3xl blur-2xl -z-10" />

      {/* Main 3D Iso Cadastral Surface */}
      <div className="relative w-full max-w-[440px] rounded-2xl bg-white/90 p-4 shadow-2xl border border-blue-100 backdrop-blur-md">
        {/* Top header bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800">PostGIS Live Cadastre</span>
            <span className="text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5">WGS-84</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">23.2599° N, 77.4126° E</span>
        </div>

        {/* Spatial Polygons SVG */}
        <div className="relative my-3 h-48 w-full rounded-xl bg-slate-950 overflow-hidden border border-slate-800">
          {/* Satellite grid */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" fill="none">
            <defs>
              <pattern id="cadastre-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
              </pattern>
              <linearGradient id="grad-poly-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="grad-poly-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="grad-poly-3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#b45309" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            <rect width="100%" height="100%" fill="url(#cadastre-grid)" />

            {/* Land Polygons */}
            <polygon points="40,25 180,40 160,115 35,95" fill="url(#grad-poly-1)" stroke="#34d399" strokeWidth="1.5" />
            <polygon points="188,40 330,55 305,130 168,115" fill="url(#grad-poly-2)" stroke="#60a5fa" strokeWidth="1.5" />
            <polygon points="35,102 160,122 145,185 25,170" fill="url(#grad-poly-3)" stroke="#fbbf24" strokeWidth="1.5" />
            <polygon points="168,122 305,137 285,190 152,185" fill="#6366f1" fillOpacity="0.65" stroke="#a5b4fc" strokeWidth="1.5" />

            {/* Pulsing Coordinates */}
            <circle cx="105" cy="70" r="5" fill="#ffffff">
              <animate attributeName="r" values="4;7;4" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="240" cy="85" r="5" fill="#ffffff">
              <animate attributeName="r" values="4;7;4" dur="2.5s" begin="1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2.5s" begin="1s" repeatCount="indefinite" />
            </circle>
          </svg>

          {/* Floating Plot Badges inside preview */}
          <div className="absolute top-2 left-2 rounded-md bg-black/75 px-2 py-1 border border-white/20 backdrop-blur-xs">
            <span className="text-[10px] font-bold text-emerald-400">Parcel #104/A</span>
            <span className="text-[8px] text-slate-300 block">Khasra 42 · 1.45 Ha</span>
          </div>

          <div className="absolute bottom-2 right-2 rounded-md bg-black/75 px-2 py-1 border border-white/20 backdrop-blur-xs">
            <span className="text-[10px] font-bold text-blue-400">Parcel #108/B</span>
            <span className="text-[8px] text-slate-300 block">Commercial Zone</span>
          </div>
        </div>

        {/* Bottom verification badge row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            <span>Digital Khasra Deed Verified</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-500">Tamper-Proof PostGIS Record</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SLIDE 2: Revenue Governance Visual
───────────────────────────────────────────────────────────────────────────── */
function GovernanceIllustration() {
  const bars = [68, 85, 52, 94, 62, 79, 91];
  return (
    <div className="relative w-full h-[320px] sm:h-[360px] lg:h-[380px] flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-tr from-teal-400/20 via-blue-400/20 to-emerald-400/20 rounded-3xl blur-2xl -z-10" />

      <div className="relative w-full max-w-[440px] rounded-2xl bg-white/90 p-5 shadow-2xl border border-teal-100 backdrop-blur-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-900 block">State Revenue Governance Index</span>
            <span className="text-[10px] text-slate-500">52 Monitored Districts · Real-Time KPIs</span>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-100 rounded-full px-2.5 py-0.5">
            <TrendingUp className="h-3 w-3" /> +14.2% YoY
          </span>
        </div>

        {/* 4 Metric Tiles */}
        <div className="grid grid-cols-2 gap-2.5 my-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
            <span className="text-[10px] text-slate-500 font-semibold block">Collection Velocity</span>
            <span className="text-lg font-black text-slate-900">82.4%</span>
            <span className="text-[9px] text-emerald-700 font-bold block mt-0.5">▲ Exceeding Target</span>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
            <span className="text-[10px] text-slate-500 font-semibold block">Mutation Pendency</span>
            <span className="text-lg font-black text-slate-900">&lt; 14 Days</span>
            <span className="text-[9px] text-blue-700 font-bold block mt-0.5">Automated Workflow</span>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
            <span className="text-[10px] text-slate-500 font-semibold block">Dispute Disposal</span>
            <span className="text-lg font-black text-slate-900">91.2%</span>
            <span className="text-[9px] text-teal-700 font-bold block mt-0.5">Revenue Court Bench</span>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
            <span className="text-[10px] text-slate-500 font-semibold block">Compliance Score</span>
            <span className="text-lg font-black text-slate-900">96 / 100</span>
            <span className="text-[9px] text-amber-700 font-bold block mt-0.5">Grade A Certified</span>
          </div>
        </div>

        {/* Chart representation */}
        <div className="flex items-end gap-2 h-14 pt-2 border-t border-slate-100">
          {bars.map((height, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-teal-600 to-blue-600"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[8px] text-slate-500 font-semibold mt-1">
          <span>Jan</span>
          <span>Feb</span>
          <span>Mar</span>
          <span>Apr</span>
          <span>May</span>
          <span>Jun</span>
          <span>Jul</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SLIDE 3: Evidence-Grounded AI Assistant Visual
───────────────────────────────────────────────────────────────────────────── */
function AssistantIllustration() {
  return (
    <div className="relative w-full h-[320px] sm:h-[360px] lg:h-[380px] flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-400/20 via-purple-400/20 to-blue-400/20 rounded-3xl blur-2xl -z-10" />

      <div className="relative w-full max-w-[440px] rounded-2xl bg-white/90 p-5 shadow-2xl border border-indigo-100 backdrop-blur-md space-y-3">
        {/* Assistant Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Bhoomi AI Assistant</span>
              <span className="text-[10px] text-indigo-700 font-medium">Statutory Pre-Retrieval Grounding</span>
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
            <Sparkles className="h-3 w-3" /> Verbatim Citations
          </span>
        </div>

        {/* User Question */}
        <div className="rounded-xl bg-blue-50/80 border border-blue-100 p-2.5 text-right">
          <p className="text-xs font-semibold text-blue-950">
            What is the compensation formula under RFCTLARR Act 2013 for rural land?
          </p>
        </div>

        {/* AI Answer with Citation Box */}
        <div className="rounded-xl bg-slate-50 border border-slate-200/90 p-3 space-y-2">
          <p className="text-xs text-slate-800 leading-relaxed">
            Under <strong>Section 26 &amp; First Schedule</strong> of RFCTLARR Act, 2013: Market value is multiplied by a factor of <strong>1.00 to 2.00</strong> (rural area factor) plus a <strong>100% Solatium</strong> allowance.
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-[10px] text-emerald-900">
            <Scale className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
            <span className="font-semibold">Statutory Source: RFCTLARR Act (No. 30 of 2013), Sec. 26(2)</span>
          </div>
        </div>

        {/* Verification Guarantee */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
          <span>FastEmbed 384-Dim Vector Match</span>
          <span className="font-bold text-emerald-700">100% Citation Grounded</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SLIDE 4: Legal Corpus & Research Hub Visual
───────────────────────────────────────────────────────────────────────────── */
function ResearchIllustration() {
  const documents = [
    { title: 'Right to Fair Compensation & Transparency Act', year: '2013', tag: 'CENTRAL ACT', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { title: 'Model Agricultural Land Leasing Act (NITI Aayog)', year: '2016', tag: 'MODEL CODE', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { title: 'DILRMP Cadastral Modernization Circular', year: '2023', tag: 'CIRCULAR', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  ];

  return (
    <div className="relative w-full h-[320px] sm:h-[360px] lg:h-[380px] flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 via-blue-400/20 to-emerald-400/20 rounded-3xl blur-2xl -z-10" />

      <div className="relative w-full max-w-[440px] rounded-2xl bg-white/90 p-5 shadow-2xl border border-amber-100 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-900 block">Unified Statutory Land Corpus</span>
            <span className="text-[10px] text-slate-500">1,240+ Digitized Acts, Circulars &amp; Gazettes</span>
          </div>
          <FileCheck className="h-5 w-5 text-amber-600" />
        </div>

        {/* Simulated Search Bar */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-3 py-2 text-xs text-slate-500">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span>Search land acquisition, mutation, tenancy laws...</span>
        </div>

        {/* Document Cards */}
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.title} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 hover:bg-slate-100/80 transition">
              <div className="min-w-0 flex-1 pr-2">
                <span className={`inline-block rounded-md border px-1.5 py-0.2 text-[9px] font-bold ${doc.color} mb-1`}>
                  {doc.tag}
                </span>
                <p className="text-xs font-semibold text-slate-800 truncate">{doc.title}</p>
              </div>
              <span className="text-[10px] font-bold text-slate-500 shrink-0">{doc.year}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
          <span>Semantic Vector Search Index</span>
          <span className="font-bold text-blue-700">Open Public Access</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SLIDES DEFINITION (DigiLocker Creative Aesthetics)
───────────────────────────────────────────────────────────────────────────── */
const SLIDES = [
  {
    id: 'cadastre',
    badge: 'National Spatial Cadastre',
    headline: 'Every Land Parcel in India,',
    accent: 'Digitally Mapped & Verified',
    subtitle: 'Access PostGIS WGS-84 cadastral boundaries, khasra classifications, and registered ownership deeds with tamper-evident audit guarantees.',
    pills: [
      { icon: ShieldCheck, title: 'PostGIS Cadastre', subtitle: 'WGS-84 Coordinate Mapped' },
      { icon: MapPin, title: 'Spatial Polygons', subtitle: 'Geo-Referenced Survey Numbers' },
      { icon: Zap, title: 'Instant Verification', subtitle: 'Direct Khasra & Mutation Lookup' },
    ],
    bgGradient: 'from-blue-50/90 via-indigo-50/50 to-purple-50/40',
    cardBorder: 'border-blue-100',
    accentColor: 'text-blue-600',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    Visual: CadastreIllustration,
  },
  {
    id: 'governance',
    badge: 'State Revenue Intelligence',
    headline: 'State Revenue Governance',
    accent: 'at Real-time Scale',
    subtitle: 'Monitor district-level KPIs, land revenue collection benchmarks, administrative mutation velocity, and compliance audit snapshots.',
    pills: [
      { icon: Landmark, title: '52 Districts', subtitle: 'Real-Time Revenue Index' },
      { icon: TrendingUp, title: 'Mutation Velocity', subtitle: 'Disposal & Pendency Analytics' },
      { icon: FileCheck, title: 'Audit Trail', subtitle: 'Temporal Snapshot Comparison' },
    ],
    bgGradient: 'from-teal-50/90 via-emerald-50/50 to-blue-50/40',
    cardBorder: 'border-teal-100',
    accentColor: 'text-teal-700',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    Visual: GovernanceIllustration,
  },
  {
    id: 'assistant',
    badge: 'Evidence-Grounded AI',
    headline: 'Statutory Land Law Q&A,',
    accent: 'Grounded in Official Acts',
    subtitle: 'Pre-retrieval authorized AI assistant delivering verbatim citations from central land acquisition codes, tenancy rules, and revenue circulars.',
    pills: [
      { icon: Bot, title: 'Statutory AI', subtitle: 'FastEmbed 384-Dim Engine' },
      { icon: Scale, title: 'Verbatim Citations', subtitle: 'Zero Generative Hallucination' },
      { icon: Sparkles, title: 'Multi-State Coverage', subtitle: 'RFCTLARR 2013 & State Codes' },
    ],
    bgGradient: 'from-indigo-50/90 via-purple-50/50 to-blue-50/40',
    cardBorder: 'border-indigo-100',
    accentColor: 'text-indigo-600',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    Visual: AssistantIllustration,
  },
  {
    id: 'research',
    badge: 'Statutory Legal Corpus',
    headline: 'Unified Legal Vault &',
    accent: 'Published Evidence Hub',
    subtitle: 'Explore 1,240+ digitized central and state land reform acts, revenue notifications, and academic research through semantic search.',
    pills: [
      { icon: FileText, title: '1,240+ Instruments', subtitle: 'Central & State Land Codes' },
      { icon: Search, title: 'Vector Search', subtitle: 'Semantic Legal Discovery' },
      { icon: CheckCircle2, title: 'Open Access', subtitle: 'Official Gazette & Circular Vault' },
    ],
    bgGradient: 'from-amber-50/90 via-orange-50/50 to-blue-50/40',
    cardBorder: 'border-amber-100',
    accentColor: 'text-amber-700',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    Visual: ResearchIllustration,
  },
];

export function SlidingHero() {
  const { isAuthenticated } = useAuth();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % SLIDES.length);
  }, []);

  const togglePause = useCallback(() => {
    setPaused((p) => !p);
  }, []);

  // Auto-scroll every 5 seconds unless paused
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, paused]);

  const slide = SLIDES[current];
  const { Visual } = slide;

  return (
    <section aria-label="Platform Hero Banner" className="relative pt-6 pb-12 sm:pt-8 sm:pb-16 bg-gradient-to-b from-blue-50/60 via-slate-50/40 to-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* ── Main DigiLocker Rounded Hero Card ── */}
        <div
          className={`relative rounded-3xl lg:rounded-[32px] border ${slide.cardBorder} bg-gradient-to-br ${slide.bgGradient} shadow-xl p-6 sm:p-10 lg:p-14 overflow-hidden transition-all duration-700`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Subtle Grid Overlay */}
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #0f172a 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            
            {/* ── Left Content ── */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Pillar Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-bold shadow-2xs">
                <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                <span className={slide.badgeColor}>{slide.badge}</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                {slide.headline}{' '}
                <span className={slide.accentColor}>{slide.accent}</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                {slide.subtitle}
              </p>

              {/* 3 Value Pillars (DigiLocker Style: Secure, Easy Access, Paperless) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {slide.pills.map((pill) => {
                  const Icon = pill.icon;
                  return (
                    <div
                      key={pill.title}
                      className="flex sm:flex-col items-center sm:items-start gap-2.5 rounded-xl bg-white/80 border border-slate-200/80 p-3 shadow-2xs backdrop-blur-xs"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{pill.title}</p>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{pill.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons: Strict Auth Rules Applied */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {!isAuthenticated ? (
                  /* ── When Not Logged In: ONLY show buttons they CAN access! ── */
                  <>
                    <Link
                      to="/explore"
                      className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-7 py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition active:scale-95"
                    >
                      <Compass className="h-4 w-4" />
                      <span>Explore Platform</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/90 px-6 py-3.5 text-sm font-semibold text-slate-800 hover:bg-white hover:text-blue-700 shadow-2xs transition active:scale-95"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>Login / Register</span>
                    </Link>
                  </>
                ) : (
                  /* ── When Logged In: Direct access to module ── */
                  <Link
                    to={
                      slide.id === 'cadastre'
                        ? '/gis'
                        : slide.id === 'governance'
                        ? '/governance'
                        : slide.id === 'assistant'
                        ? '/assistant'
                        : '/research'
                    }
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-7 py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition active:scale-95"
                  >
                    <span>Launch {slide.badge}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>

            {/* ── Right Visual Illustration ── */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <Visual />
            </div>
          </div>

          {/* ── DigiLocker Bottom-Right Floating Controls (< || >) ── */}
          <div className="absolute bottom-5 right-5 sm:bottom-6 sm:right-8 z-20 flex items-center gap-2 bg-white/90 p-1.5 rounded-full shadow-lg border border-slate-200/80 backdrop-blur-md">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition shadow-2xs focus:outline-hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={togglePause}
              aria-label={paused ? 'Resume slideshow' : 'Pause slideshow'}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition shadow-2xs focus:outline-hidden"
            >
              {paused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5 fill-current" />}
            </button>

            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition shadow-2xs focus:outline-hidden"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Slide Navigation Dots Below ── */}
        <div className="mt-6 flex items-center justify-center gap-2" role="tablist" aria-label="Slide selector">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`Slide ${i + 1}: ${s.badge}`}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 focus:outline-hidden ${
                i === current
                  ? 'w-8 h-2.5 bg-blue-600'
                  : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
