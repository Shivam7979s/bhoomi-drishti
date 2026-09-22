import { RefreshCw, Server, ServerOff } from 'lucide-react';
import { HEALTH_ENDPOINT_PATH } from '../services/healthService';
import type { BackendStatus, HealthResponse } from '../types/health';
import { apiBaseUrl } from '../utils/env';

interface BackendStatusCardProps {
  status: BackendStatus;
  health: HealthResponse | null;
  error: string | null;
  lastCheckedAt: Date | null;
  onRefresh: () => void;
}

const STATUS_LABEL: Record<BackendStatus, string> = {
  checking: 'Checking...',
  connected: 'Connected',
  offline: 'Offline',
};

const STATUS_TEXT_COLOR: Record<BackendStatus, string> = {
  checking: 'text-amber-600',
  connected: 'text-emerald-600',
  offline: 'text-rose-600',
};

const STATUS_DOT_COLOR: Record<BackendStatus, string> = {
  checking: 'bg-amber-500 animate-pulse',
  connected: 'bg-emerald-500',
  offline: 'bg-rose-500',
};

export function BackendStatusCard({ status, health, error, lastCheckedAt, onRefresh }: BackendStatusCardProps) {
  return (
    <section
      aria-label="Backend connectivity"
      className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {status === 'offline' ? (
            <ServerOff className="h-5 w-5 shrink-0 text-rose-500" aria-hidden="true" />
          ) : (
            <Server className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
          )}
          <p role="status" aria-live="polite" className="text-base font-medium text-slate-800">
            Backend Status:{' '}
            <span className={`font-semibold ${STATUS_TEXT_COLOR[status]}`}>{STATUS_LABEL[status]}</span>
          </p>
        </div>
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT_COLOR[status]}`} aria-hidden="true" />
      </div>

      <dl className="mt-5 space-y-2 text-sm text-slate-600">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <dt className="font-medium text-slate-500">Endpoint</dt>
          <dd className="font-mono text-xs break-all text-slate-700">
            {apiBaseUrl}
            {HEALTH_ENDPOINT_PATH}
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <dt className="font-medium text-slate-500">Service</dt>
          <dd className="font-mono text-xs break-all text-slate-700">{health?.service ?? 'unknown'}</dd>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <dt className="font-medium text-slate-500">Last checked</dt>
          <dd>{lastCheckedAt ? lastCheckedAt.toLocaleTimeString() : 'not checked yet'}</dd>
        </div>
      </dl>

      {error && <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}

      <button
        type="button"
        onClick={onRefresh}
        disabled={status === 'checking'}
        className="mt-5 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${status === 'checking' ? 'animate-spin' : ''}`} aria-hidden="true" />
        Check again
      </button>
    </section>
  );
}