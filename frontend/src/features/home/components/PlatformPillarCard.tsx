import { Link } from 'react-router-dom';
import { ArrowRight, type LucideIcon } from 'lucide-react';

interface PlatformPillarCardProps {
  to: string;
  icon: LucideIcon;
  title: string;
  category: string;
  description: string;
  ctaText: string;
  colorScheme: 'emerald' | 'blue' | 'amber' | 'teal';
}

const COLOR_CLASSES = {
  emerald: {
    badge: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    icon: 'text-emerald-700 bg-emerald-100/60',
    borderHover: 'hover:border-emerald-300',
    cta: 'text-emerald-800 group-hover:text-emerald-900',
  },
  blue: {
    badge: 'bg-blue-50 text-blue-900 border-blue-200',
    icon: 'text-blue-700 bg-blue-100/60',
    borderHover: 'hover:border-blue-300',
    cta: 'text-blue-800 group-hover:text-blue-900',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-900 border-amber-200',
    icon: 'text-amber-700 bg-amber-100/60',
    borderHover: 'hover:border-amber-300',
    cta: 'text-amber-800 group-hover:text-amber-900',
  },
  teal: {
    badge: 'bg-teal-50 text-teal-900 border-teal-200',
    icon: 'text-teal-700 bg-teal-100/60',
    borderHover: 'hover:border-teal-300',
    cta: 'text-teal-800 group-hover:text-teal-900',
  },
};

export function PlatformPillarCard({
  to,
  icon: Icon,
  title,
  category,
  description,
  ctaText,
  colorScheme,
}: PlatformPillarCardProps) {
  const scheme = COLOR_CLASSES[colorScheme];

  return (
    <Link
      to={to}
      className={`group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${scheme.borderHover} focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0`}
    >
      <div className="space-y-4">
        {/* Header with Icon and Category Badge */}
        <div className="flex items-center justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${scheme.icon}`}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${scheme.badge}`}>
            {category}
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-950 transition-colors">
            {title}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            {description}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className={`mt-6 flex items-center gap-1.5 text-xs font-bold pt-4 border-t border-slate-100 ${scheme.cta}`}>
        <span>{ctaText}</span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0" aria-hidden="true" />
      </div>
    </Link>
  );
}
