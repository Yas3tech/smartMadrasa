import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import MainLayout from './components/Layout/MainLayout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { PageLoader } from './components/UI';
import { Toaster } from 'react-hot-toast';

// Lazy load all page components for code-splitting
const Dashboard = lazy(() => import('./pages/common/Dashboard'));
const Messages = lazy(() => import('./pages/common/Messages'));
const Grades = lazy(() => import('./pages/teacher/Grades'));
const Attendance = lazy(() => import('./pages/teacher/Attendance'));
const Classes = lazy(() => import('./pages/director/Classes'));
const Profile = lazy(() => import('./pages/common/Profile'));
const Settings = lazy(() => import('./pages/common/Settings'));
const Homework = lazy(() => import('./pages/common/Homework'));
const Schedule = lazy(() => import('./pages/common/Schedule'));
const Announcements = lazy(() => import('./pages/common/Announcements'));
const Resources = lazy(() => import('./pages/common/Resources'));
const UserManagement = lazy(() => import('./pages/admin/Users'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const DatabaseAdmin = lazy(() => import('./pages/admin/DatabaseAdmin'));
const AcademicYearConfig = lazy(() => import('./pages/director/AcademicYearConfig'));
const BulletinDashboard = lazy(() => import('./pages/director/BulletinDashboard'));
const TeacherBulletinGrades = lazy(() => import('./pages/teacher/BulletinGrades'));
const StudentBulletin = lazy(() => import('./pages/student/StudentBulletin'));
const Login = lazy(() => import('./pages/auth/Login'));

// Development utilities
import { seedDatabase } from './services/seedDatabase';
import { seedBulletinSystem } from './services/seedBulletinData';
import { initializeFirebaseData } from './services/initFirebase';

// Declare window extensions for dev console access
declare global {
  interface Window {
    seedDatabase: typeof seedDatabase;
    seedBulletinSystem: typeof seedBulletinSystem;
    initializeFirebaseData: typeof initializeFirebaseData;
  }
}

// Expose functions to window for easy console access
if (typeof window !== 'undefined') {
  window.seedDatabase = seedDatabase;
  window.seedBulletinSystem = seedBulletinSystem;
  window.initializeFirebaseData = initializeFirebaseData;
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Toaster position="top-right" />
          <MainLayout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/messages" element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                } />
                <Route path="/classes" element={
                  <ProtectedRoute>
                    <Classes />
                  </ProtectedRoute>
                } />
                <Route path="/grades" element={
                  <ProtectedRoute>
                    <Grades />
                  </ProtectedRoute>
                } />
                <Route path="/attendance" element={
                  <ProtectedRoute>
                    <Attendance />
                  </ProtectedRoute>
                } />
                <Route path="/homework" element={
                  <ProtectedRoute>
                    <Homework />
                  </ProtectedRoute>
                } />
                <Route path="/schedule" element={
                  <ProtectedRoute>
                    <Schedule />
                  </ProtectedRoute>
                } />
                <Route path="/announcements" element={
                  <ProtectedRoute>
                    <Announcements />
                  </ProtectedRoute>
                } />
                <Route path="/resources" element={
                  <ProtectedRoute>
                    <Resources />
                  </ProtectedRoute>
                } />
                <Route path="/users" element={
                  <ProtectedRoute>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/analytics" element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                } />
                <Route path="/admin/settings" element={
                  <ProtectedRoute>
                    <AdminSettings />
                  </ProtectedRoute>
                } />
                <Route path="/admin/database" element={
                  <ProtectedRoute>
                    <DatabaseAdmin />
                  </ProtectedRoute>
                } />

                {/* Bulletin System Routes */}
                <Route path="/bulletins/config" element={
                  <ProtectedRoute>
                    <AcademicYearConfig />
                  </ProtectedRoute>
                } />
                <Route path="/bulletins/dashboard" element={
                  <ProtectedRoute>
                    <BulletinDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/bulletins/grades" element={
                  <ProtectedRoute>
                    <TeacherBulletinGrades />
                  </ProtectedRoute>
                } />
                <Route path="/bulletins/view" element={
                  <ProtectedRoute>
                    <StudentBulletin />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </MainLayout>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
