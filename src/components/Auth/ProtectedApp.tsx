import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from '../../context/DataContext';
import ProtectedRoute from './ProtectedRoute';
import { PageLoader } from '../UI';

// Lazy load layout and pages
const MainLayout = lazy(() => import('../Layout/MainLayout'));
const Dashboard = lazy(() => import('../../pages/common/Dashboard'));
const Messages = lazy(() => import('../../pages/common/Messages'));
const Grades = lazy(() => import('../../pages/teacher/Grades'));
const Attendance = lazy(() => import('../../pages/teacher/Attendance'));
const Classes = lazy(() => import('../../pages/director/Classes'));
const Profile = lazy(() => import('../../pages/common/Profile'));
const Settings = lazy(() => import('../../pages/common/Settings'));
const Homework = lazy(() => import('../../pages/common/Homework'));
const Schedule = lazy(() => import('../../pages/common/Schedule'));
const Announcements = lazy(() => import('../../pages/common/Announcements'));
const Resources = lazy(() => import('../../pages/common/Resources'));
const UserManagement = lazy(() => import('../../pages/admin/Users'));
const DatabaseAdmin = lazy(() => import('../../pages/admin/DatabaseAdmin'));
const AcademicYearConfig = lazy(() => import('../../pages/director/AcademicYearConfig'));
const BulletinDashboard = lazy(() => import('../../pages/director/BulletinDashboard'));
const TeacherBulletinGrades = lazy(() => import('../../pages/teacher/BulletinGrades'));
const StudentBulletin = lazy(() => import('../../pages/student/StudentBulletin'));

const ProtectedApp = () => {
    return (
        <ProtectedRoute>
            <DataProvider>
                <Suspense fallback={<PageLoader />}>
                    <MainLayout>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/messages" element={<Messages />} />
                            <Route
                                path="/classes"
                                element={
                                    <ProtectedRoute allowedRoles={['director', 'superadmin', 'teacher']}>
                                        <Classes />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/grades"
                                element={
                                    <ProtectedRoute allowedRoles={['director', 'superadmin', 'teacher']}>
                                        <Grades />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/attendance"
                                element={
                                    <ProtectedRoute allowedRoles={['director', 'superadmin', 'teacher']}>
                                        <Attendance />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/homework" element={<Homework />} />
                            <Route path="/schedule" element={<Schedule />} />
                            <Route path="/announcements" element={<Announcements />} />
                            <Route path="/resources" element={<Resources />} />
                            <Route
                                path="/users"
                                element={
                                    <ProtectedRoute allowedRoles={['director', 'superadmin']}>
                                        <UserManagement />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/database"
                                element={
                                    <ProtectedRoute allowedRoles={['director', 'superadmin']}>
                                        <DatabaseAdmin />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Bulletin System Routes */}
                            <Route
                                path="/bulletins/config"
                                element={
                                    <ProtectedRoute allowedRoles={['director', 'superadmin']}>
                                        <AcademicYearConfig />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/bulletins/dashboard"
                                element={
                                    <ProtectedRoute allowedRoles={['director', 'superadmin']}>
                                        <BulletinDashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/bulletins/grades"
                                element={
                                    <ProtectedRoute allowedRoles={['teacher', 'director', 'superadmin']}>
                                        <TeacherBulletinGrades />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/bulletins/view"
                                element={
                                    <ProtectedRoute allowedRoles={['student', 'parent', 'director', 'superadmin']}>
                                        <StudentBulletin />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </MainLayout>
                </Suspense>
            </DataProvider>
        </ProtectedRoute>
    );
};

export default ProtectedApp;
