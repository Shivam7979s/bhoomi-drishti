import type { ReactNode } from 'react';
import { AlertCircle, RefreshCw, type LucideIcon } from 'lucide-react';

interface ErrorStateProps {
  icon?: LucideIcon;
  title: string;
  description: string | ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Standardized institutional error state component.
 * Non-leaking, human-readable error messaging with retry capabilities.
 */
export function ErrorState({
  icon: Icon = AlertCircle,
  title,
  description,
  onRetry,
  retryLabel = 'Try Again',
  action,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`rounded-2xl border border-rose-200 bg-rose-50/70 p-6 sm:p-8 text-center max-w-lg mx-auto space-y-3 shadow-2xs ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mx-auto">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm sm:text-base font-bold text-rose-900">{title}</h3>
        <div className="text-xs text-rose-700 leading-relaxed max-w-md mx-auto">{description}</div>
      </div>

      {(onRetry || action) && (
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-800 shadow-2xs hover:bg-rose-50 transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{retryLabel}</span>
            </button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
