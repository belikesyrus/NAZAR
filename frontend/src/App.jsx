import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import ProjectsPage from './pages/ProjectsPage'
import InspectionsPage from './pages/InspectionsPage'
import InspectionDetailPage from './pages/InspectionDetailPage'
import InspectionSubmitPage from './pages/InspectionSubmitPage'
import CCTVPage from './pages/CCTVPage'
import GeoMapPage from './pages/GeoMapPage'
import AttendancePage from './pages/AttendancePage'
import AnomalyPage from './pages/AnomalyPage'
import CompliancePage from './pages/CompliancePage'
import AlertsPage from './pages/AlertsPage'
import NotificationsPage from './pages/NotificationsPage'
import FeedbackPage from './pages/FeedbackPage'
import BeneficiariesPage from './pages/BeneficiariesPage'
import ReportsPage from './pages/ReportsPage'
import ReportDetailPage from './pages/ReportDetailPage'
import UsersPage from './pages/UsersPage'
import SettingsPage from './pages/SettingsPage'
import VideoConferencingPage from './pages/VideoConferencingPage'
import LiveMonitoringPage from './pages/LiveMonitoringPage'
import NotFoundPage from './pages/NotFoundPage'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="monitoring/live" element={<LiveMonitoringPage />} />
        <Route path="monitoring/cctv" element={<CCTVPage />} />
        <Route path="monitoring/vc" element={<VideoConferencingPage />} />
        <Route path="monitoring/map" element={<GeoMapPage />} />
        <Route path="projects" element={<ProjectsPage type="all" />} />
        <Route path="projects/institutes" element={<ProjectsPage type="institute" />} />
        <Route path="projects/ngos" element={<ProjectsPage type="ngo" />} />
        <Route path="projects/beneficiaries" element={<BeneficiariesPage />} />
        <Route path="inspections" element={<InspectionsPage />} />
        <Route path="inspections/mine" element={<InspectionsPage mine />} />
        <Route path="inspections/surprise" element={<InspectionsPage type="surprise" />} />
        <Route path="inspections/:id" element={<InspectionDetailPage />} />
        <Route path="inspections/:id/submit" element={<InspectionSubmitPage />} />
        <Route path="inspections/reports" element={<ReportsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="reports/:id" element={<ReportDetailPage />} />
        <Route path="analytics/attendance" element={<AttendancePage />} />
        <Route path="analytics/anomalies" element={<AnomalyPage />} />
        <Route path="analytics/compliance" element={<CompliancePage />} />
        <Route path="analytics/performance" element={<CompliancePage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="users" element={<ProtectedRoute roles={['department_official','district_authority']}><UsersPage /></ProtectedRoute>} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
