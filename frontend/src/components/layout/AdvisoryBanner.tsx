import type { ReactNode } from 'react';
import { Info, ShieldAlert, ShieldCheck, AlertTriangle, type LucideIcon } from 'lucide-react';

export interface AdvisoryBannerProps {
  title?: string;
  children: ReactNode;
  variant?: 'info' | 'statutory' | 'warning' | 'audit' | 'spatial';
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}

const BANNER_STYLES: Record<string, { container: string; iconColor: string; defaultIcon: LucideIcon }> = {
  info: {
    container: 'border-blue-200 bg-blue-50/70 text-blue-950',
    iconColor: 'text-blue-700',
    defaultIcon: Info,
  },
  statutory: {
    container: 'border-teal-200 bg-teal-50/70 text-teal-950',
    iconColor: 'text-teal-700',
    defaultIcon: ShieldCheck,
  },
  audit: {
    container: 'border-indigo-200 bg-indigo-50/70 text-indigo-950',
    iconColor: 'text-indigo-700',
    defaultIcon: Info,
  },
  warning: {
    container: 'border-amber-200 bg-amber-50/70 text-amber-950',
    iconColor: 'text-amber-700',
    defaultIcon: AlertTriangle,
  },
  spatial: {
    container: 'border-slate-200 bg-slate-50/80 text-slate-800',
    iconColor: 'text-blue-700',
    defaultIcon: ShieldAlert,
  },
};

/**
 * Standardized institutional advisory and compliance notice banner.
 * Used across governance audit comparisons, statutory AI synthesis,
 * policy scenarios, and cadastral spatial disclosures.
 */
export function AdvisoryBanner({
  title,
  children,
  variant = 'info',
  icon,
  action,
  className = '',
}: AdvisoryBannerProps) {
  const style = BANNER_STYLES[variant] || BANNER_STYLES.info;
  const IconComponent = icon || style.defaultIcon;

  return (
    <div
      role="note"
      className={`rounded-2xl border p-4 sm:p-5 shadow-2xs ${style.container} ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
        <div className="flex items-start gap-3 min-w-0">
          <IconComponent className={`h-5 w-5 shrink-0 mt-0.5 ${style.iconColor}`} aria-hidden="true" />
          <div className="space-y-1 text-xs leading-relaxed min-w-0">
            {title && <h3 className="font-bold text-sm text-slate-900">{title}</h3>}
            <div className="text-slate-700 space-y-1">{children}</div>
          </div>
        </div>

        {action && <div className="shrink-0 pt-1 sm:pt-0">{action}</div>}
      </div>
    </div>
  );
}
