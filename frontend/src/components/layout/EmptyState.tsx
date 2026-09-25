import type { ReactNode } from 'react';
import { FileQuestion, type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string | ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * Standardized institutional empty state card.
 * Clearly articulates what is empty, why it is empty, and actionable next steps.
 */
export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 sm:p-10 text-center max-w-lg mx-auto space-y-4 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mx-auto">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-sm sm:text-base font-bold text-slate-800">{title}</h3>
        <div className="text-xs text-slate-600 leading-relaxed">{description}</div>
      </div>

      {action && <div className="pt-2 flex justify-center">{action}</div>}
    </div>
  );
}
