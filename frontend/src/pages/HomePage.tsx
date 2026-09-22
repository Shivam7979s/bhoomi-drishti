import { BackendStatusCard } from '../components/BackendStatusCard';
import { useBackendHealth } from '../hooks/useBackendHealth';

export function HomePage() {
  const { status, health, error, lastCheckedAt, refresh } = useBackendHealth();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">BHOOMI-DRISHTI</h1>
        <p className="text-lg text-slate-600">AI-Powered Land Governance Platform</p>
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
