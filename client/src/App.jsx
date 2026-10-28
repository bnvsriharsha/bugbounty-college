import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './layouts/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import IssuesListPage from './pages/IssuesListPage';
import IssueDetailPage from './pages/IssueDetailPage';
import CreateReportPage from './pages/CreateReportPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserManagementPage from './pages/UserManagementPage';
import CategoryManagementPage from './pages/CategoryManagementPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              {/* Public Routes */}
              <Route index element={<LandingPage />} />
              <Route path="issues" element={<IssuesListPage />} />
              <Route path="issues/:id" element={<IssueDetailPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="unauthorized" element={<UnauthorizedPage />} />

              {/* Authenticated Student Routes */}
              <Route element={<ProtectedRoute allowedRoles={['student', 'staff', 'admin']} />}>
                <Route path="report/new" element={<CreateReportPage />} />
                <Route path="student" element={<StudentDashboard />} />
              </Route>

              {/* Maintenance Staff & Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['staff', 'admin']} />}>
                <Route path="staff" element={<StaffDashboard />} />
              </Route>

              {/* Administrator Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="admin/users" element={<UserManagementPage />} />
                <Route path="admin/categories" element={<CategoryManagementPage />} />
              </Route>

              {/* Catch All 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
