import { Landmark, Map, BookOpen, Bot } from 'lucide-react';
import { PlatformPillarCard } from './PlatformPillarCard';

export function ExplorePlatform() {
  return (
    <section aria-labelledby="explore-heading" className="py-16 sm:py-20 bg-slate-50/60 border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
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
            to="/governance"
            icon={Landmark}
            category="Intelligence"
            title="Governance Intelligence"
            description="Monitor state and district KPIs, administrative mutation velocity, dispute resolution benchmarks, and temporal audit snapshots."
            ctaText="Launch Governance Dashboard"
            colorScheme="emerald"
          />

          <PlatformPillarCard
            to="/gis"
            icon={Map}
            category="Geospatial"
            title="Spatial GIS Cadastre"
            description="Explore PostGIS land polygons, multi-tier survey parcel boundaries, spatial classification, and cadastral registry records."
            ctaText="Open GIS Cadastre Map"
            colorScheme="blue"
          />

          <PlatformPillarCard
            to="/research"
            icon={BookOpen}
            category="Corpus"
            title="Statutory Research Hub"
            description="Search published state revenue codes, circulars, gazettes, and land administration research dossiers."
            ctaText="Search Legal Corpus"
            colorScheme="amber"
          />

          <PlatformPillarCard
            to="/assistant"
            icon={Bot}
            category="AI Assistant"
            title="Evidence-Grounded AI"
            description="Ask complex statutory questions answered with verbatim source citations, evidence sufficiency safeguards, and strict pre-retrieval role checks."
            ctaText="Consult Statutory Assistant"
            colorScheme="teal"
          />
        </div>
      </div>
    </section>
  );
}
