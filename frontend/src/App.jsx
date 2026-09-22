import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { UnitProvider } from './context/UnitContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ProtectedAdminRoute } from './components/layout/ProtectedAdminRoute';
import { AppLayout } from './components/layout/AppLayout';
import { AdminLayout } from './components/admin/AdminLayout';

// User pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { WeightPage } from './pages/WeightPage';
import { MeasurementsPage } from './pages/MeasurementsPage';
import { WorkoutsPage } from './pages/WorkoutsPage';
import { PRAnalyticsPage } from './pages/PRAnalyticsPage';
import { PhotosPage } from './pages/PhotosPage';
import { NutritionPage } from './pages/NutritionPage';
import { HabitsPage } from './pages/HabitsPage';
import { CalculatorsPage } from './pages/CalculatorsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { JourneyTimelinePage } from './pages/JourneyTimelinePage';
import { AchievementsPage } from './pages/AchievementsPage';
import { SettingsPage } from './pages/SettingsPage';

// Admin pages
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminActivityPage } from './pages/admin/AdminActivityPage';
import { AdminBroadcastPage } from './pages/admin/AdminBroadcastPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <UnitProvider>
          <AuthProvider>
            <Routes>
              {/* ── Public ── */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* ── Protected user app ── */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard"    element={<DashboardPage />} />
                <Route path="/profile"      element={<ProfilePage />} />
                <Route path="/weights"      element={<WeightPage />} />
                <Route path="/measurements" element={<MeasurementsPage />} />
                <Route path="/workouts"     element={<WorkoutsPage />} />
                <Route path="/prs"          element={<PRAnalyticsPage />} />
                <Route path="/photos"       element={<PhotosPage />} />
                <Route path="/nutrition"    element={<NutritionPage />} />
                <Route path="/habits"       element={<HabitsPage />} />
                <Route path="/calculators"  element={<CalculatorsPage />} />
                <Route path="/analytics"    element={<AnalyticsPage />} />
                <Route path="/journey"      element={<JourneyTimelinePage />} />
                <Route path="/achievements" element={<AchievementsPage />} />
                <Route path="/settings"     element={<SettingsPage />} />
              </Route>

              {/* ── Admin panel ── */}
              <Route
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout />
                  </ProtectedAdminRoute>
                }
              >
                <Route path="/admin"            element={<AdminOverviewPage />} />
                <Route path="/admin/users"      element={<AdminUsersPage />} />
                <Route path="/admin/activity"   element={<AdminActivityPage />} />
                <Route path="/admin/broadcast"  element={<AdminBroadcastPage />} />
              </Route>

              {/* ── Catch all ── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </UnitProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
