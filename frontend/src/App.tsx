import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './features/auth/context/AuthContext';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { AuthCallbackPage } from './features/auth/pages/AuthCallbackPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { ProfilePage } from './features/auth/pages/ProfilePage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { LandRecordsPage } from './features/land-records/pages/LandRecordsPage';
import { ResearchHubPage } from './features/research/pages/ResearchHubPage';
import { KnowledgeSearchPage } from './features/knowledge/pages/KnowledgeSearchPage';
import { GisDashboardPage } from './features/gis/pages/GisDashboardPage';
import { WorkspacesPage } from './features/collaboration/pages/WorkspacesPage';
import { WorkspaceDashboardPage } from './features/collaboration/pages/WorkspaceDashboardPage';
import { ProjectDetailsPage } from './features/collaboration/pages/ProjectDetailsPage';
import { SavedResearchPage } from './features/collaboration/pages/SavedResearchPage';
import { ScenarioWorkspacePage } from './features/policy/pages/ScenarioWorkspacePage';
import { ScenarioComparisonPage } from './features/policy/pages/ScenarioComparisonPage';
import { GovernanceDashboardPage } from './features/governance/pages/GovernanceDashboardPage';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/governance" element={<GovernanceDashboardPage />} />
            <Route path="/gis" element={<GisDashboardPage />} />
            <Route path="/workspaces" element={<WorkspacesPage />} />
            <Route path="/workspaces/:idOrSlug" element={<WorkspaceDashboardPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
            <Route path="/projects/:projectId/scenarios/:scenarioId" element={<ScenarioWorkspacePage />} />
            <Route path="/projects/:projectId/scenarios/compare" element={<ScenarioComparisonPage />} />
            <Route path="/scenarios/compare" element={<ScenarioComparisonPage />} />
            <Route
              path="/saved-research"
              element={
                <ProtectedRoute>
                  <SavedResearchPage />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route
              path="/land-records"
              element={
                <ProtectedRoute>
                  <LandRecordsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/research" element={<ResearchHubPage />} />
            <Route path="/knowledge" element={<KnowledgeSearchPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="/dashboard" element={<Navigate to="/profile" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
