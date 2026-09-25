import { AlertTriangle, FileQuestion, Layers, ShieldCheck } from 'lucide-react';
import type { GroundingStatus } from '../types/assistant';

interface GroundingStatusBadgeProps {
  status: GroundingStatus;
  className?: string;
  showDescription?: boolean;
}

export function GroundingStatusBadge({
  status,
  className = '',
  showDescription = false,
}: GroundingStatusBadgeProps) {
  switch (status) {
    case 'GROUNDED':
      return (
        <div className={`inline-flex flex-col ${className}`}>
          <span
            role="status"
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-2xs"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>Evidence Grounded</span>
          </span>
          {showDescription && (
            <p className="mt-1 text-xs text-emerald-700">
              Synthesized response strictly supported by verified research and statutory evidence.
            </p>
          )}
        </div>
      );

    case 'WEAK_EVIDENCE':
      return (
        <div className={`inline-flex flex-col ${className}`}>
          <span
            role="status"
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 shadow-2xs"
          >
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
            <span>Weak Evidence (Extractive Excerpts)</span>
          </span>
          {showDescription && (
            <p className="mt-1 text-xs text-amber-700">
              Retrieved evidence has marginal relevance. Generative synthesis was withheld to prevent hallucination; verbatim excerpts are provided below.
            </p>
          )}
        </div>
      );

    case 'NO_EVIDENCE':
      return (
        <div className={`inline-flex flex-col ${className}`}>
          <span
            role="status"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 shadow-2xs"
          >
            <FileQuestion className="h-4 w-4 text-slate-600 shrink-0" aria-hidden="true" />
            <span>No Sufficient Evidence Found</span>
          </span>
          {showDescription && (
            <p className="mt-1 text-xs text-slate-600">
              No relevant statutory provisions or research documents met the evidence retrieval threshold.
            </p>
          )}
        </div>
      );

    case 'FALLBACK':
      return (
        <div className={`inline-flex flex-col ${className}`}>
          <span
            role="status"
            className="inline-flex items-center gap-1.5 rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 shadow-2xs"
          >
            <Layers className="h-4 w-4 text-sky-600 shrink-0" aria-hidden="true" />
            <span>Extractive Fallback</span>
          </span>
          {showDescription && (
            <p className="mt-1 text-xs text-sky-700">
              Generative synthesis service was unavailable; deterministic verbatim excerpts are presented directly from source documents.
            </p>
          )}
        </div>
      );

    default:
      return null;
  }
}
