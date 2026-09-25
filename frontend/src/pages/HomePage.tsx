import { useState } from 'react';
import { ChevronDown, Server } from 'lucide-react';
import { BackendStatusCard } from '../components/BackendStatusCard';
import { useBackendHealth } from '../hooks/useBackendHealth';
import { SlidingHero } from '../features/home/components/SlidingHero';
import { NationalStatsStrip } from '../features/home/components/NationalStatsStrip';
import { NewInBhoomiSection } from '../features/home/components/NewInBhoomiSection';
import { ExploreCategoriesSection } from '../features/home/components/ExploreCategoriesSection';
import { ExploreByStateSection } from '../features/home/components/ExploreByStateSection';
import { AboutBhoomiSection } from '../features/home/components/AboutBhoomiSection';
import { GettingStartedSection } from '../features/home/components/GettingStartedSection';
import { PartnerIntegrationSection } from '../features/home/components/PartnerIntegrationSection';
import { HomeFinalCta } from '../features/home/components/HomeFinalCta';

export function HomePage() {
  const { status, health, error: healthError, lastCheckedAt, refresh: refreshHealth } = useBackendHealth();
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  return (
    <div className="flex flex-col w-full text-slate-900 bg-white">
      {/* 1. DigiLocker-Style Sliding Hero Banner */}
      <SlidingHero />

      {/* 2. Floating National Land Infrastructure Metrics Strip */}
      <NationalStatsStrip />

      {/* 3. New in BHOOMI-DRISHTI / Popular Land Services & Acts (DigiLocker Inspired) */}
      <NewInBhoomiSection />

      {/* 4. Explore Land Governance by Categories (DigiLocker Category Grid) */}
      <ExploreCategoriesSection />

      {/* 5. Explore Land Records by State (DigiLocker State Issuers Grid) */}
      <ExploreByStateSection />

      {/* 6. About BHOOMI-DRISHTI & National Platform Benchmarks */}
      <AboutBhoomiSection />

      {/* 7. Getting Started is Quick and Easy (DigiLocker 4-Step Process) */}
      <GettingStartedSection />

      {/* 8. Institutional Integration & Open Spatial API Ecosystem */}
      <PartnerIntegrationSection />

      {/* 9. Final Call to Action */}
      <HomeFinalCta />

      {/* 10. Technical Evaluator & Service Diagnostics (Accessible via toggle) */}
      <section aria-label="System Health and Technical Verification" className="bg-slate-50 border-t border-slate-200 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              aria-expanded={showTechnicalDetails}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-100 transition"
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
