import { Link } from 'react-router-dom';
import { Landmark, Map, BookOpen, Bot, ArrowRight, Compass } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { PlatformPillarCard } from './PlatformPillarCard';

export function ExplorePlatform() {
  const { isAuthenticated } = useAuth();

  return (
    <section aria-labelledby="explore-heading" className="py-16 sm:py-20 bg-slate-50/70 border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
            Platform Capabilities
          </span>
          <h2 id="explore-heading" className="text-2xl font-black text-slate-900 sm:text-4xl tracking-tight">
            Explore BHOOMI-DRISHTI
          </h2>
          <p className="text-sm text-slate-600 sm:text-base leading-relaxed">
            Four interconnected pillars designed for revenue officers, statutory researchers, policy analysts,
            and citizens seeking verifiable land administration intelligence.
          </p>
        </div>

        {/* 4 Pillar Cards Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <PlatformPillarCard
            to={isAuthenticated ? '/governance' : '/explore?domain=governance'}
            icon={Landmark}
            category="Intelligence"
            title="Governance Intelligence"
            description="Monitor state and district KPIs, administrative mutation velocity, dispute resolution benchmarks, and temporal audit snapshots."
            ctaText={isAuthenticated ? 'Launch Governance Dashboard' : 'Explore Governance Data'}
            colorScheme="teal"
          />

          <PlatformPillarCard
            to={isAuthenticated ? '/gis' : '/explore?domain=cadastral'}
            icon={Map}
            category="Geospatial"
            title="Spatial GIS Cadastre"
            description="Explore PostGIS land polygons, multi-tier survey parcel boundaries, spatial classification, and cadastral registry records."
            ctaText={isAuthenticated ? 'Open GIS Cadastre Map' : 'Explore Spatial Cadastre'}
            colorScheme="blue"
          />

          <PlatformPillarCard
            to={isAuthenticated ? '/research' : '/explore?type=ACT'}
            icon={BookOpen}
            category="Corpus"
            title="Statutory Research Hub"
            description="Search published state revenue codes, circulars, gazettes, and land administration research dossiers."
            ctaText={isAuthenticated ? 'Search Legal Corpus' : 'Explore Legal Acts'}
            colorScheme="amber"
          />

          <PlatformPillarCard
            to={isAuthenticated ? '/assistant' : '/explore?domain=assistant'}
            icon={Bot}
            category="AI Assistant"
            title="Evidence-Grounded AI"
            description="Ask complex statutory questions answered with verbatim source citations, evidence sufficiency safeguards, and strict role checks."
            ctaText={isAuthenticated ? 'Consult Statutory Assistant' : 'Explore Legal AI Answers'}
            colorScheme="emerald"
          />
        </div>

        {/* Link to Unified Public Discovery Portal */}
        <div className="mt-10 text-center">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-700 hover:border-blue-400 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Compass className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <span>Open Public Explore &amp; Discovery Portal</span>
            <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
