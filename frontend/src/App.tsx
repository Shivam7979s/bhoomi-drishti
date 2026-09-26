import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './features/auth/context/AuthContext';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { AuthCallbackPage } from './features/auth/pages/AuthCallbackPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { ProfilePage } from './features/auth/pages/ProfilePage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { LandRecordsPage } from './features/land-records/pages/LandRecordsPage';
import { ResearchHubPage } from './features/research/pages/ResearchHubPage';
import { KnowledgeSearchPage } from './features/knowledge/pages/KnowledgeSearchPage';
import { AssistantPage } from './features/assistant/pages/AssistantPage';
import { GisDashboardPage } from './features/gis/pages/GisDashboardPage';
import { WorkspacesPage } from './features/collaboration/pages/WorkspacesPage';
import { WorkspaceDashboardPage } from './features/collaboration/pages/WorkspaceDashboardPage';
import { ProjectDetailsPage } from './features/collaboration/pages/ProjectDetailsPage';
import { SavedResearchPage } from './features/collaboration/pages/SavedResearchPage';
import { ScenarioWorkspacePage } from './features/policy/pages/ScenarioWorkspacePage';
import { ScenarioComparisonPage } from './features/policy/pages/ScenarioComparisonPage';
import { GovernanceDashboardPage } from './features/governance/pages/GovernanceDashboardPage';
import { GovernanceComparisonPage } from './features/governance/pages/GovernanceComparisonPage';
import { MainLayout } from './layouts/MainLayout';
import { AuthenticatedLayout } from './layouts/AuthenticatedLayout';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { DashboardHomePage } from './features/dashboard/pages/DashboardHomePage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route
              path="/projects/:projectId/scenarios/:scenarioId"
              element={
                <ProtectedRoute allowedRoles={['RESEARCHER', 'ACADEMIA', 'GOVERNMENT_OFFICIAL', 'ADMIN']}>
                  <ScenarioWorkspacePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId/scenarios/compare"
              element={
                <ProtectedRoute allowedRoles={['RESEARCHER', 'ACADEMIA', 'GOVERNMENT_OFFICIAL', 'ADMIN']}>
                  <ScenarioComparisonPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scenarios/compare"
              element={
                <ProtectedRoute allowedRoles={['RESEARCHER', 'ACADEMIA', 'GOVERNMENT_OFFICIAL', 'ADMIN']}>
                  <ScenarioComparisonPage />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route
              path="/research"
              element={
                <ProtectedRoute allowedRoles={['RESEARCHER', 'ACADEMIA', 'GOVERNMENT_OFFICIAL', 'ADMIN']}>
                  <ResearchHubPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/knowledge"
              element={
                <ProtectedRoute allowedRoles={['RESEARCHER', 'ACADEMIA', 'GOVERNMENT_OFFICIAL', 'ADMIN']}>
                  <KnowledgeSearchPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* ── DigiLocker-Inspired Authenticated App Shell ── */}
          <Route
            element={
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardHomePage />} />
            <Route path="/web/home" element={<DashboardHomePage />} />
            <Route path="/land-records" element={<LandRecordsPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/gis" element={<GisDashboardPage />} />
            <Route
              path="/governance"
              element={
                <ProtectedRoute allowedRoles={['GOVERNMENT_OFFICIAL', 'RESEARCHER', 'ACADEMIA', 'ADMIN']}>
                  <GovernanceDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/governance/compare"
              element={
                <ProtectedRoute allowedRoles={['GOVERNMENT_OFFICIAL', 'RESEARCHER', 'ACADEMIA', 'ADMIN']}>
                  <GovernanceComparisonPage />
                </ProtectedRoute>
              }
            />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route
              path="/workspaces"
              element={
                <ProtectedRoute allowedRoles={['RESEARCHER', 'ACADEMIA', 'GOVERNMENT_OFFICIAL', 'ADMIN']}>
                  <WorkspacesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workspaces/:idOrSlug"
              element={
                <ProtectedRoute allowedRoles={['RESEARCHER', 'ACADEMIA', 'GOVERNMENT_OFFICIAL', 'ADMIN']}>
                  <WorkspaceDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId"
              element={
                <ProtectedRoute allowedRoles={['RESEARCHER', 'ACADEMIA', 'GOVERNMENT_OFFICIAL', 'ADMIN']}>
                  <ProjectDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved-research"
              element={
                <ProtectedRoute allowedRoles={['RESEARCHER', 'ACADEMIA', 'GOVERNMENT_OFFICIAL', 'ADMIN']}>
                  <SavedResearchPage />
                </ProtectedRoute>
              }
            />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  </BrowserRouter>
  );
}
