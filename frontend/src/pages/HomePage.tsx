import { useState } from 'react';
import { ChevronDown, Server } from 'lucide-react';
import { BackendStatusCard } from '../components/BackendStatusCard';
import { useBackendHealth } from '../hooks/useBackendHealth';
import { useHomeData } from '../features/home/hooks/useHomeData';
import { HomeHero } from '../features/home/components/HomeHero';
import { ExplorePlatform } from '../features/home/components/ExplorePlatform';
import { GovernanceSpotlight } from '../features/home/components/GovernanceSpotlight';
import { GeographicExplorerPreview } from '../features/home/components/GeographicExplorerPreview';
import { ResearchEvidenceShowcase } from '../features/home/components/ResearchEvidenceShowcase';
import { AssistantShowcase } from '../features/home/components/AssistantShowcase';
import { HowItWorks } from '../features/home/components/HowItWorks';
import { EvidenceTrustSection } from '../features/home/components/EvidenceTrustSection';
import { HomeFinalCta } from '../features/home/components/HomeFinalCta';

export function HomePage() {
  const { status, health, error: healthError, lastCheckedAt, refresh: refreshHealth } = useBackendHealth();
  const {
    indicators,
    isIndicatorsLoading,
    indicatorsError,
    researchDocuments,
    isResearchLoading,
    researchError,
    gisOptions,
    isGisLoading,
  } = useHomeData();

  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  return (
    <div className="flex flex-col w-full text-slate-900">
      {/* 1. Platform Hero with Spatial Visual */}
      <HomeHero backendStatus={status} onRefreshHealth={refreshHealth} />

      {/* 2. Four Platform Capability Pillars */}
      <ExplorePlatform />

      {/* 3. Governance Intelligence & Revenue Indicators */}
      <GovernanceSpotlight
        indicators={indicators}
        isLoading={isIndicatorsLoading}
        error={indicatorsError}
      />

      {/* 4. Geographic & Cadastral Exploration Preview */}
      <GeographicExplorerPreview
        gisOptions={gisOptions}
        isLoading={isGisLoading}
      />

      {/* 5. Research Hub & Published Evidence Showcase */}
      <ResearchEvidenceShowcase
        documents={researchDocuments}
        isLoading={isResearchLoading}
        error={researchError}
      />

      {/* 6. Evidence-Grounded AI Assistant Showcase */}
      <AssistantShowcase />

      {/* 7. How BHOOMI-DRISHTI Works Data Pipeline */}
      <HowItWorks />

      {/* 8. Evidence-Backed Architectural Trust */}
      <EvidenceTrustSection />

      {/* 9. Final Call to Action */}
      <HomeFinalCta />

      {/* 10. Technical Evaluator & Service Provenance Disclosure */}
      <section aria-label="System Health and Technical Verification" className="bg-slate-100/80 border-t border-slate-200 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              aria-expanded={showTechnicalDetails}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 transition"
            >
              <Server className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              <span>{showTechnicalDetails ? 'Hide System Health Diagnostics' : 'Inspect System Health Diagnostics'}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-400 transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {showTechnicalDetails && (
              <div className="w-full flex justify-center animate-in fade-in duration-200">
                <BackendStatusCard
                  status={status}
                  health={health}
                  error={healthError}
                  lastCheckedAt={lastCheckedAt}
                  onRefresh={refreshHealth}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
