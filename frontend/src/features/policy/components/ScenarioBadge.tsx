import { Clock, Play, CheckCircle2, Archive, Layers } from 'lucide-react';
import type { ScenarioStatus, ScenarioType } from '../types/policy';

interface ScenarioStatusBadgeProps {
  status: ScenarioStatus;
  size?: 'sm' | 'md';
}

export function ScenarioStatusBadge({ status, size = 'md' }: ScenarioStatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'DRAFT':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}
        >
          <Clock className="h-3 w-3 text-slate-500" />
          Draft
        </span>
      );
    case 'RUNNING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}
        >
          <Play className="h-3 w-3 text-amber-600 animate-pulse" />
          Running
        </span>
      );
    case 'COMPLETED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-teal-50 text-teal-800 border border-teal-200 ${sizeClasses}`}
        >
          <CheckCircle2 className="h-3 w-3 text-teal-600" />
          Completed
        </span>
      );
    case 'ARCHIVED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 ${sizeClasses}`}
        >
          <Archive className="h-3 w-3 text-zinc-500" />
          Archived
        </span>
      );
  }
}

interface ScenarioTypeBadgeProps {
  type: ScenarioType;
  size?: 'sm' | 'md';
}

export function ScenarioTypeBadge({ type, size = 'md' }: ScenarioTypeBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const typeConfig: Record<ScenarioType, { label: string; bg: string; text: string; border: string }> = {
    LAND_USE_CONVERSION: {
      label: 'Land-Use Conversion',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    LAND_CEILING_REDISTRIBUTION: {
      label: 'Ceiling Redistribution',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
    },
    DISPUTE_RISK_ASSESSMENT: {
      label: 'Dispute Vulnerability',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
    },
    CORRIDOR_BUFFER_INTERVENTION: {
      label: 'Corridor Buffer',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
    PROJECT_PARCEL_EVALUATION: {
      label: 'Project Parcels',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
  };

  const config = typeConfig[type] || {
    label: type,
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <Layers className="h-3 w-3 opacity-70" />
      {config.label}
    </span>
  );
}
