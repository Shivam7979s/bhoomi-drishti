import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, type LucideIcon } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface PageHeaderBadge {
  text: string;
  icon?: LucideIcon;
  variant?: 'emerald' | 'blue' | 'teal' | 'amber' | 'indigo' | 'slate';
}

interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  badge?: PageHeaderBadge;
  title: string | ReactNode;
  description?: string | ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

const BADGE_VARIANTS: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  blue: 'bg-blue-50 text-blue-800 border-blue-200',
  teal: 'bg-teal-50 text-teal-800 border-teal-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  indigo: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  slate: 'bg-slate-100 text-slate-800 border-slate-200',
};

/**
 * Standardized institutional page header.
 * Provides consistent typography, breadcrumb hierarchy, badge accents,
 * and action button alignment across all application domain screens.
 */
export function PageHeader({
  breadcrumbs,
  badge,
  title,
  description,
  actions,
  children,
  className = '',
}: PageHeaderProps) {
  const badgeClass = badge
    ? BADGE_VARIANTS[badge.variant || 'emerald'] || BADGE_VARIANTS.emerald
    : '';

  return (
    <div className={`space-y-4 border-b border-slate-200/80 pb-6 ${className}`}>
      {/* Breadcrumb Hierarchy */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />}
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    className="font-medium text-slate-600 hover:text-emerald-800 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'font-semibold text-slate-900 truncate max-w-md' : 'text-slate-500'}>
                    {crumb.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      )}

      {/* Main Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2 max-w-3xl">
          {badge && (
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${badgeClass}`}>
              {badge.icon && <badge.icon className="h-3.5 w-3.5" aria-hidden="true" />}
              <span>{badge.text}</span>
            </div>
          )}

          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            {title}
          </h1>

          {description && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
            {actions}
          </div>
        )}
      </div>

      {/* Optional Metadata / Filter Sub-row */}
      {children && <div className="pt-2">{children}</div>}
    </div>
  );
}
