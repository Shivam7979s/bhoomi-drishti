import { Landmark, Map } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BackendStatusCard } from '../components/BackendStatusCard';
import { useBackendHealth } from '../hooks/useBackendHealth';

export function HomePage() {
  const { status, health, error, lastCheckedAt, refresh } = useBackendHealth();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center px-4 py-16 max-w-5xl mx-auto w-full">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">BHOOMI-DRISHTI</h1>
        <p className="text-lg text-slate-600">AI-Powered Land Governance Platform</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/governance"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-800 transition"
        >
          <Landmark className="h-4 w-4" />
          Governance Dashboard
        </Link>
        <Link
          to="/gis"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
        >
          <Map className="h-4 w-4 text-emerald-700" />
          GIS Map
        </Link>
      </div>

      <BackendStatusCard
        status={status}
        health={health}
        error={error}
        lastCheckedAt={lastCheckedAt}
        onRefresh={refresh}
      />

      <p className="max-w-xl text-sm text-slate-500">
        Phase 1 delivers the project foundation: this React application shell, the Spring Boot API and the
        PostgreSQL + PostGIS database. Land governance modules are added in the phases that follow.
      </p>
    </div>
  );
}
