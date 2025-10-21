



import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserRole } from './types';

// Pages
import LoginPage from './pages/LoginPage';
import UserHomePage from './pages/user/UserHomePage';
import SurveyPage from './pages/user/SurveyPage';
import CompanyDashboardPage from './pages/company/CompanyDashboardPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminCampaignsPage from './pages/admin/AdminCampaignsPage';
import CampaignEditorPage from './pages/admin/CampaignEditorPage';
import AdminCompaniesPage from './pages/admin/AdminCompaniesPage';
import RewardsPage from './pages/RewardsPage';
import AdminCalendarPage from './pages/admin/AdminCalendarPage';
import AdminResearchersPage from './pages/admin/AdminResearchersPage';
import AdminAdministratorsPage from './pages/admin/AdminAdministratorsPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import ProfilePage from './pages/ProfilePage';
import AdminTrackingPage from './pages/admin/AdminTrackingPage';

// A wrapper for protected routes
const ProtectedRoute: React.FC<{ allowedRoles: UserRole[] }> = ({ allowedRoles }) => {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};


function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/rewards/:campaignId" element={<RewardsPage />} />

            {/* User Routes */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.USER]} />}>
                <Route path="/user/home" element={<UserHomePage />} />
                <Route path="/user/survey/:id" element={<SurveyPage />} />
                <Route path="/user/profile" element={<ProfilePage />} />
            </Route>

            {/* Company Routes */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.COMPANY]} />}>
                <Route path="/company/dashboard" element={<CompanyDashboardPage />} />
                <Route path="/company/profile" element={<ProfilePage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
                <Route element={<AdminLayout />}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboardPage />} />
                    <Route path="tracking" element={<AdminTrackingPage />} />
                    <Route path="campaigns" element={<AdminCampaignsPage />} />
                    <Route path="campaigns/new" element={<CampaignEditorPage />} />
                    <Route path="campaigns/edit/:id" element={<CampaignEditorPage />} />
                    <Route path="companies" element={<AdminCompaniesPage />} />
                    <Route path="researchers" element={<AdminResearchersPage />} />
                    <Route path="administrators" element={<AdminAdministratorsPage />} />
                    <Route path="calendar" element={<AdminCalendarPage />} />
                    <Route path="profile" element={<AdminProfilePage />} />
                </Route>
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;