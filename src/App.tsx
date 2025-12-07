import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/common/Dashboard';
import Messages from './pages/common/Messages';
import Grades from './pages/teacher/Grades';
import Attendance from './pages/teacher/Attendance';
import Classes from './pages/director/Classes';
import Profile from './pages/common/Profile';
import Settings from './pages/common/Settings';
import Homework from './pages/common/Homework';
import Schedule from './pages/common/Schedule';
import Calendar from './pages/common/Calendar';
import Announcements from './pages/common/Announcements';
import Resources from './pages/common/Resources';
import UserManagement from './pages/admin/Users';
import Analytics from './pages/admin/Analytics';
import AdminSettings from './pages/admin/AdminSettings';
import DatabaseAdmin from './pages/admin/DatabaseAdmin';
import AcademicYearConfig from './pages/director/AcademicYearConfig';
import BulletinDashboard from './pages/director/BulletinDashboard';
import TeacherBulletinGrades from './pages/teacher/BulletinGrades';
import StudentBulletin from './pages/student/StudentBulletin';
import Login from './pages/auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { seedDatabase } from './services/seedDatabase';
import { seedBulletinSystem } from './services/seedBulletinData';
import { initializeFirebaseData } from './services/initFirebase';

// Expose functions to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).seedDatabase = seedDatabase;
  (window as any).seedBulletinSystem = seedBulletinSystem;
  (window as any).initializeFirebaseData = initializeFirebaseData;
}

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Toaster position="top-right" />
          <MainLayout>
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
              <Route path="/calendar" element={
                <ProtectedRoute>
                  <Calendar />
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
          </MainLayout>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
