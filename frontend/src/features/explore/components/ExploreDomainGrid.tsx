import { Landmark, Map, BookOpen, Sparkles, Bot } from 'lucide-react';
import type { ExploreDomainItem } from '../types/explore';
import { ExploreDomainCard } from './ExploreDomainCard';

const DOMAIN_ITEMS: ExploreDomainItem[] = [
  {
    id: 'domain-governance',
    to: '/governance',
    icon: Landmark,
    category: 'Intelligence',
    title: 'Governance Intelligence',
    description: 'Monitor state and district revenue KPIs, dispute resolution ratios, and temporal governance indicator snapshots.',
    explorePoints: [
      'Standardized Revenue Indicator Framework',
      'Mutation & Dispute Status Distributions',
      'Immutable Point-in-Time Audit Snapshots',
      'Multi-Tier District Comparisons',
    ],
    ctaText: 'Launch Governance Framework',
    colorScheme: 'emerald',
  },
  {
    id: 'domain-gis',
    to: '/gis',
    icon: Map,
    category: 'Geospatial',
    title: 'Spatial GIS Cadastre',
    description: 'Explore PostGIS cadastral parcel polygons, administrative boundary hierarchies, and spatial land classifications.',
    explorePoints: [
      'Interactive PostGIS Vector Map',
      'State-District-Tehsil-Village Hierarchy',
      'Agricultural & Commercial Zoning Context',
      'Survey Number Parcel Polygons',
    ],
    ctaText: 'Open Interactive GIS Cadastre',
    colorScheme: 'blue',
  },
  {
    id: 'domain-research',
    to: '/research',
    icon: BookOpen,
    category: 'Legal Corpus',
    title: 'Statutory Research Hub',
    description: 'Access published state revenue codes, circulars, gazettes, and academic land tenure research dossiers.',
    explorePoints: [
      'Published Statutory Acts & Codes',
      'State Revenue Circulars & Gazettes',
      'Direct Cadastral Parcel Links',
      'Institutional Authors & Metadata',
    ],
    ctaText: 'Explore Research Hub',
    colorScheme: 'amber',
  },
  {
    id: 'domain-knowledge',
    to: '/knowledge',
    icon: Sparkles,
    category: 'Evidence Layer',
    title: 'Semantic Knowledge Search',
    description: 'Query verbatim text chunk embeddings and statutory citations extracted from indexed public revenue documents.',
    explorePoints: [
      'Dense Vector Semantic Search',
      'Verbatim Clause & Article Quotes',
      'Document Origin & Lineage Metadata',
      'Keyword + Vector Hybrid Context',
    ],
    ctaText: 'Open Semantic Search',
    colorScheme: 'indigo',
  },
  {
    id: 'domain-assistant',
    to: '/assistant',
    icon: Bot,
    category: 'AI Assistant',
    title: 'Evidence-Grounded AI Assistant',
    description: 'Ask complex land administration questions with pre-retrieval role checks, source citations, and evidence sufficiency safeguards.',
    explorePoints: [
      'Statutory Question Answering',
      'Verbatim Clause-Linked Citations',
      'Evidence Sufficiency Safeguards',
      'Pre-Retrieval Authorization Filters',
    ],
    ctaText: 'Consult Statutory Assistant',
    colorScheme: 'teal',
  },
];

export function ExploreDomainGrid() {
  return (
    <section id="explore-domains" aria-labelledby="domains-heading" className="scroll-mt-20 space-y-8">
      {/* Section Header */}
      <div className="text-left space-y-2 border-b border-slate-200/80 pb-5">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
          Core Pillars
        </span>
        <h2 id="domains-heading" className="text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
          Explore by Platform Domain
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
          Navigate specialized digital modules spanning revenue intelligence, spatial parcel mapping, statutory research,
          and evidence-grounded AI synthesis.
        </p>
      </div>

      {/* Grid of 5 Domain Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DOMAIN_ITEMS.map((item) => (
          <ExploreDomainCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
