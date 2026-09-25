import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { ExploreDomainItem } from '../types/explore';

interface ExploreDomainCardProps {
  item: ExploreDomainItem;
}

const COLOR_MAP = {
  emerald: {
    badge: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    iconBg: 'bg-emerald-100/70 text-emerald-800',
    borderHover: 'hover:border-emerald-300',
    cta: 'text-emerald-800 group-hover:text-emerald-950',
    bullet: 'text-emerald-600',
  },
  blue: {
    badge: 'bg-blue-50 text-blue-900 border-blue-200',
    iconBg: 'bg-blue-100/70 text-blue-800',
    borderHover: 'hover:border-blue-300',
    cta: 'text-blue-800 group-hover:text-blue-950',
    bullet: 'text-blue-600',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-900 border-amber-200',
    iconBg: 'bg-amber-100/70 text-amber-800',
    borderHover: 'hover:border-amber-300',
    cta: 'text-amber-800 group-hover:text-amber-950',
    bullet: 'text-amber-600',
  },
  indigo: {
    badge: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    iconBg: 'bg-indigo-100/70 text-indigo-800',
    borderHover: 'hover:border-indigo-300',
    cta: 'text-indigo-800 group-hover:text-indigo-950',
    bullet: 'text-indigo-600',
  },
  teal: {
    badge: 'bg-teal-50 text-teal-900 border-teal-200',
    iconBg: 'bg-teal-100/70 text-teal-800',
    borderHover: 'hover:border-teal-300',
    cta: 'text-teal-800 group-hover:text-teal-950',
    bullet: 'text-teal-600',
  },
};

export function ExploreDomainCard({ item }: ExploreDomainCardProps) {
  const Icon = item.icon;
  const colors = COLOR_MAP[item.colorScheme] || COLOR_MAP.emerald;

  return (
    <article className={`group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${colors.borderHover} motion-reduce:hover:translate-y-0`}>
      <div className="space-y-4">
        {/* Header with Icon and Category */}
        <div className="flex items-center justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.iconBg}`}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors.badge}`}>
            {item.category}
          </span>
        </div>

        {/* Title and Summary */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
            {item.title}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            {item.description}
          </p>
        </div>

        {/* Key Features Bullet List */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            What you can explore
          </span>
          {item.explorePoints.map((pt, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
              <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${colors.bullet}`} aria-hidden="true" />
              <span>{pt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <Link
          to={item.to}
          className={`inline-flex items-center gap-1.5 text-xs font-bold ${colors.cta} focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 rounded-md py-1`}
        >
          <span>{item.ctaText}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
