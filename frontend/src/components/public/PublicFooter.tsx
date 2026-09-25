import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 transition-colors" role="contentinfo">
      {/* Upper Multi-Column Navigation */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Mission Column */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo size="md" subtitle="Digital Land Governance Platform" />
            <p className="text-xs leading-relaxed text-slate-500 max-w-sm">
              Sovereign digital land infrastructure uniting PostGIS cadastral parcel mapping,
              state revenue governance indicators, and pre-retrieval authorized statutory AI intelligence.
            </p>
            <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-[11px] font-semibold text-emerald-900">
              <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>Evidence-Grounded · Smart India Hackathon PS26019</span>
            </div>
          </div>

          {/* Column 1: Governance & Spatial */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Governance & Spatial
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/governance" className="hover:text-emerald-700 transition">
                  Governance Dashboard
                </Link>
              </li>
              <li>
                <Link to="/governance/compare" className="hover:text-emerald-700 transition">
                  Temporal Audit Comparison
                </Link>
              </li>
              <li>
                <Link to="/gis" className="hover:text-emerald-700 transition">
                  Interactive GIS Cadastre
                </Link>
              </li>
              <li>
                <Link to="/land-records" className="hover:text-emerald-700 transition">
                  Cadastral Land Records
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Research & AI */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Research & AI
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/research" className="hover:text-emerald-700 transition">
                  Research Hub & Circulars
                </Link>
              </li>
              <li>
                <Link to="/knowledge" className="hover:text-emerald-700 transition">
                  Semantic Knowledge Search
                </Link>
              </li>
              <li>
                <Link to="/assistant" className="hover:text-emerald-700 transition">
                  Statutory AI Assistant
                </Link>
              </li>
              <li>
                <Link to="/saved-research" className="hover:text-emerald-700 transition">
                  Saved Research Dossiers
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Collaboration & Access */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Workspaces & Access
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/workspaces" className="hover:text-emerald-700 transition">
                  Collaboration Workspaces
                </Link>
              </li>
              <li>
                <Link to="/scenarios/compare" className="hover:text-emerald-700 transition">
                  Policy Scenario Comparison
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-700 transition">
                  Platform Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-emerald-700 transition">
                  Citizen Account Registration
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Provenance Strip */}
      <div className="border-t border-slate-200/80 bg-slate-50/70 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <p className="text-[11px] text-slate-500 max-w-2xl">
            <strong>BHOOMI-DRISHTI</strong> is an evidence-grounded land governance prototype developed for
            Smart India Hackathon PS26019. Not an official government service. All statutory interpretations require formal revenue authority confirmation.
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 shrink-0">
            <span>PostGIS 3.5 Spatial Cadastre</span>
            <span>&middot;</span>
            <span>FastEmbed 384-Dim Vectors</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
