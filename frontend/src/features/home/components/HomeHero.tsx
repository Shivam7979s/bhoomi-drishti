import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Compass, Database, Layers, ShieldCheck, Sparkles } from 'lucide-react';

interface HomeHeroProps {
  backendStatus: 'checking' | 'connected' | 'offline';
  onRefreshHealth: () => void;
}

const STATUS_CONFIG = {
  connected: {
    dot: 'bg-emerald-500',
    text: 'API Connected',
    textColor: 'text-slate-600',
  },
  checking: {
    dot: 'bg-amber-500 animate-pulse',
    text: 'Checking API...',
    textColor: 'text-amber-700',
  },
  offline: {
    dot: 'bg-rose-500',
    text: 'API Offline',
    textColor: 'text-rose-700',
  },
};

export function HomeHero({ backendStatus, onRefreshHealth }: HomeHeroProps) {
  const statusInfo = STATUS_CONFIG[backendStatus] || STATUS_CONFIG.checking;

  return (
    <section
      aria-label="Platform Introduction"
      className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-white py-16 sm:py-24"
    >
      {/* Subtle Spatial Grid Background Graphic */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:32px_32px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Mission, Value Proposition & Actions */}
          <div className="space-y-6 text-left lg:col-span-7">
            {/* Context Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1 text-xs font-semibold text-emerald-900 shadow-2xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-600" />
              <span>Smart India Hackathon PS26019 Prototype</span>
              <span className="text-emerald-300">·</span>
              <span className="text-emerald-800">Public Digital Platform</span>
            </div>

            {/* Platform Title */}
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl sm:leading-tight">
              Digital Platform for <span className="text-emerald-800">Land Governance</span>
            </h1>

            {/* Descriptive Body */}
            <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Explore cadastral parcel mapping, state revenue governance indicators, published statutory and policy documents,
              and evidence-grounded AI intelligence through one connected, transparent platform.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-900 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 active:scale-98"
              >
                <span>Explore Platform</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Link
                to="/assistant"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 active:scale-98"
              >
                <Bot className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                <span>Ask AI Assistant</span>
              </Link>

              <Link
                to="/gis"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition"
              >
                <Compass className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span>GIS Cadastre Map</span>
              </Link>
            </div>

            {/* Platform Capabilities Row */}
            <div className="pt-4 border-t border-slate-200/80 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Layers className="h-4 w-4 text-blue-600 shrink-0" aria-hidden="true" />
                <span>PostGIS Cadastre</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Database className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>Revenue Indicators</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
                <span>Source-Linked Documents</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Sparkles className="h-4 w-4 text-teal-600 shrink-0" aria-hidden="true" />
                <span>Grounded AI</span>
              </div>
            </div>
          </div>

          {/* Right Column: Spatial Visual Preview & System Health */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-bold text-slate-700">
                    Spatial Cadastre Preview (Illustrative)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onRefreshHealth}
                  title="Click to recheck backend API status"
                  className="flex items-center gap-1.5 rounded-md px-2 py-0.5 hover:bg-slate-100 transition focus:outline-hidden focus-visible:ring-1 focus-visible:ring-slate-400"
                >
                  <span className={`inline-block h-2 w-2 rounded-full ${statusInfo.dot}`} />
                  <span className={`text-[10px] font-medium ${statusInfo.textColor}`}>
                    {statusInfo.text}
                  </span>
                </button>
              </div>

              {/* Stylized Spatial Cadastral Grid Graphic */}
              <div className="relative my-4 h-64 w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-900 p-4 text-white">
                {/* SVG Cadastral Mesh */}
                <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 400 240" fill="none">
                  {/* Grid Lines */}
                  <path d="M0 40 H400 M0 80 H400 M0 120 H400 M0 160 H400 M0 200 H400" stroke="#1e293b" strokeWidth="1" />
                  <path d="M40 0 V240 M80 0 V240 M120 0 V240 M160 0 V240 M200 0 V240 M240 0 V240 M280 0 V240 M320 0 V240 M360 0 V240" stroke="#1e293b" strokeWidth="1" />

                  {/* Sample Polygon 1 */}
                  <polygon
                    points="60,30 180,45 165,115 50,95"
                    fill="#065f46"
                    fillOpacity="0.4"
                    stroke="#10b981"
                    strokeWidth="1.5"
                  />
                  <text x="75" y="75" fill="#6ee7b7" fontSize="10" fontWeight="bold">Sample #104/A</text>
                  <text x="75" y="88" fill="#a7f3d0" fontSize="8">Agricultural Zone</text>

                  {/* Sample Polygon 2 */}
                  <polygon
                    points="185,45 320,60 300,140 170,115"
                    fill="#1e3a8a"
                    fillOpacity="0.4"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                  />
                  <text x="200" y="85" fill="#93c5fd" fontSize="10" fontWeight="bold">Sample #105/B</text>
                  <text x="200" y="98" fill="#bfdbfe" fontSize="8">Residential Zone</text>

                  {/* Sample Polygon 3 */}
                  <polygon
                    points="50,120 165,135 150,210 35,190"
                    fill="#134e4a"
                    fillOpacity="0.4"
                    stroke="#14b8a6"
                    strokeWidth="1.5"
                  />
                  <text x="60" y="165" fill="#5eead4" fontSize="10" fontWeight="bold">Sample Reserve</text>
                  <text x="60" y="178" fill="#99f6e4" fontSize="8">Illustrative Boundary Tract</text>

                  {/* Sample Polygon 4 */}
                  <polygon
                    points="175,140 295,160 280,225 155,210"
                    fill="#78350f"
                    fillOpacity="0.4"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                  />
                  <text x="185" y="180" fill="#fcd34d" fontSize="10" fontWeight="bold">Sample #108</text>
                  <text x="185" y="193" fill="#fef3c7" fontSize="8">Commercial Zone</text>
                </svg>

                {/* Floating Cadastre Badge */}
                <div className="absolute bottom-3 left-3 rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 backdrop-blur-xs text-[11px]">
                  <span className="font-semibold text-emerald-400">PostgreSQL + PostGIS</span>
                  <span className="block text-slate-400 text-[9px]">Illustrative Cadastral Mesh · WGS-84</span>
                </div>
              </div>

              {/* Quick Jump Action */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 font-medium">Illustrative preview · Open GIS map for live database cadastre records</span>
                <Link
                  to="/gis"
                  className="font-bold text-emerald-800 hover:text-emerald-900 hover:underline flex items-center gap-1 shrink-0 ml-2"
                >
                  <span>Open GIS Map</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
