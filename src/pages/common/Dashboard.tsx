/**
 * Dashboard Page - Refactored
 *
 * Uses useDashboard hook and sub-components for role-specific views.
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge, Button, Modal } from '../../components/UI';
import { Clock, X, Calendar as CalendarIcon, GraduationCap, TrendingUp } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { DirectorDashboard, TeacherDashboard, StudentDashboard } from '../../components/Dashboard';

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const dash = useDashboard();

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {t('dashboard.header.welcome', { name: user.name.split(' ')[0] })}
          </h1>
          <p className="text-gray-600">{t('dashboard.header.subtitle')}</p>
        </div>
        <Badge variant="success" className="text-sm px-4 py-2">
          <Clock size={14} className="mr-2" />
          {new Date().toLocaleDateString(i18n.language, {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </Badge>
      </div>

      {(user.role === 'director' || user.role === 'superadmin') && (
        <DirectorDashboard
          students={dash.students}
          teachers={dash.teachers}
          weeklyAttendanceData={dash.weeklyAttendanceData}
          attendanceRate={dash.attendanceRate}
          avgGrade={dash.avgGrade}
          weeklyAttendanceData={dash.weeklyAttendanceData}
          gradeDistributionData={dash.gradeDistributionData}
          subjectPerformanceData={dash.subjectPerformanceData}
        />
      )}

      {user.role === 'teacher' && <TeacherDashboard upcomingEvents={dash.upcomingEvents} />}

      {(user.role === 'student' || user.role === 'parent') && (
        <StudentDashboard
          user={user}
          selectedChild={dash.selectedChild}
          parentChildren={dash.parentChildren}
          setSelectedChildId={dash.setSelectedChildId}
          myGrades={dash.myGrades}
          pendingHomeworks={dash.pendingHomeworks}
          unreadMessages={dash.unreadMessages}
          childClass={dash.childClass}
          onOpenHomework={dash.handleOpenHomework}
        />
      )}

      {/* Homework Detail Modal */}
      <Modal
        isOpen={dash.showHomeworkModal}
        onClose={() => {
          dash.setShowHomeworkModal(false);
          dash.setSelectedHomework(null);
        }}
      >
        {dash.selectedHomework && (
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{dash.selectedHomework.title}</h2>
                <p className="text-gray-500">{dash.selectedHomework.subject}</p>
              </div>
              <button
                onClick={() => {
                  dash.setShowHomeworkModal(false);
                  dash.setSelectedHomework(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <CalendarIcon className="text-orange-500" size={20} />
                <div>
                  <p className="text-sm text-gray-500">{t('homework.dueDate')}</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(dash.selectedHomework.dueDate).toLocaleDateString(i18n.language, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">{t('homework.description')}</p>
                <p className="text-gray-800 whitespace-pre-wrap">
                  {dash.selectedHomework.description || t('homework.noDescription')}
                </p>
              </div>

              {dash.selectedHomework.assignedBy && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <GraduationCap size={16} />
                  <span>
                    {t('homework.assignedBy')}: {dash.selectedHomework.assignedBy}
                  </span>
                </div>
              )}

              {dash.selectedHomework.maxGrade && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <TrendingUp size={16} />
                  <span>
                    {t('homework.maxGrade')}: {dash.selectedHomework.maxGrade} pts
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  dash.setShowHomeworkModal(false);
                  navigate('/homework');
                }}
              >
                {t('homework.submit')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
