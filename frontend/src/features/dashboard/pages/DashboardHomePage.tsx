import { WelcomeHeader } from '../components/WelcomeHeader';
import { InspirationDocumentsSlider } from '../components/InspirationDocumentsSlider';
import { NewInBhoomiGrid } from '../components/NewInBhoomiGrid';
import { MyIssuedLandRecords } from '../components/MyIssuedLandRecords';
import { DashboardQuickServices } from '../components/DashboardQuickServices';

/**
 * Authenticated Dashboard Home Page (/dashboard)
 * Directly inspired by DigiLocker's authenticated citizen and official interface (digilocker.gov.in/web/home).
 */
export function DashboardHomePage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* 1. Personalized Greeting (Welcome, Shivam Singh !) */}
      <WelcomeHeader />

      {/* 2. Inspiration for your first document (Horizontal Card Carousel with Slider) */}
      <InspirationDocumentsSlider />

      {/* 3. New In BHOOMI-DRISHTI (State Issuers & Services with "Available Now") */}
      <NewInBhoomiGrid />

      {/* 4. My Issued Documents & Verified Parcels */}
      <MyIssuedLandRecords />

      {/* 5. Platform Capabilities & Quick Tools */}
      <DashboardQuickServices />
    </div>
  );
}
