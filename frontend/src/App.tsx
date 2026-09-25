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
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route
              path="/governance"
              element={
                <ProtectedRoute>
                  <GovernanceDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/governance/compare"
              element={
                <ProtectedRoute>
                  <GovernanceComparisonPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gis"
              element={
                <ProtectedRoute>
                  <GisDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workspaces"
              element={
                <ProtectedRoute>
                  <WorkspacesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workspaces/:idOrSlug"
              element={
                <ProtectedRoute>
                  <WorkspaceDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId"
              element={
                <ProtectedRoute>
                  <ProjectDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId/scenarios/:scenarioId"
              element={
                <ProtectedRoute>
                  <ScenarioWorkspacePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId/scenarios/compare"
              element={
                <ProtectedRoute>
                  <ScenarioComparisonPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scenarios/compare"
              element={
                <ProtectedRoute>
                  <ScenarioComparisonPage />
                </ProtectedRoute>
              }
            />
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
            <Route
              path="/research"
              element={
                <ProtectedRoute>
                  <ResearchHubPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant"
              element={
                <ProtectedRoute>
                  <AssistantPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/knowledge"
              element={
                <ProtectedRoute>
                  <KnowledgeSearchPage />
                </ProtectedRoute>
              }
            />
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
