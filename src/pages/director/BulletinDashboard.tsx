import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { subscribeToTeacherCommentsByPeriod } from '../../services/teacherComments';
import { CheckCircle, Clock, Calendar, Users, FileText, Send, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import type { TeacherComment } from '../../types/bulletin';
import type { Student } from '../../types';
import ClassBulletinListModal from '../../components/bulletin/ClassBulletinListModal';

const BulletinDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { academicPeriods, classes, publishPeriodBulletins, students, courses, grades } = useData();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [periodComments, setPeriodComments] = useState<TeacherComment[]>([]);
  const [viewingClassId, setViewingClassId] = useState<string | null>(null);
  const isRTL = i18n.language === 'ar';

  // Role check moved to after hooks
  const canAccess = user?.role === 'director' || user?.role === 'superadmin';

  // Subscribe to comments for the selected period
  useEffect(() => {
    if (selectedPeriod) {
      const unsubscribe = subscribeToTeacherCommentsByPeriod(selectedPeriod, (comments) => {
        setPeriodComments(comments);
      });
      return () => unsubscribe();
    } else {
      setPeriodComments([]);
    }
  }, [selectedPeriod]);

  const selectedPeriodData = academicPeriods.find((p) => p.id === selectedPeriod);

  // Calculate stats per class
  const classStats = useMemo(() => {
    if (!selectedPeriod) return {};

    const stats: Record<string, { total: number; validated: number; isFullyValidated: boolean }> =
      {};

    classes.forEach((cls) => {
      // Find students in this class
      const classStudents = students.filter((s) => (s as Student).classId === cls.id);

      // Find courses for this class
      const classCourses = courses.filter((c) => c.classId === cls.id);

      let totalExpected = 0;
      let validatedCount = 0;

      classStudents.forEach((student) => {
        classCourses.forEach((course) => {
          totalExpected++;
          const comment = periodComments.find(
            (c) => c.studentId === student.id && c.courseId === course.id
          );
          if (comment?.isValidated) {
            validatedCount++;
          }
        });
      });

      // If no students or no courses, it's "validated" (nothing to do)
      const isFullyValidated = totalExpected > 0 ? validatedCount === totalExpected : true;

      stats[cls.id] = {
        total: totalExpected,
        validated: validatedCount,
        isFullyValidated,
      };
    });

    return stats;
  }, [selectedPeriod, classes, students, courses, periodComments]);

  const validationStats = useMemo(() => {
    const totalClasses = classes.length;
    const validatedClasses = Object.values(classStats).filter((s) => s.isFullyValidated).length;
    const pendingClasses = totalClasses - validatedClasses;

    return { totalClasses, validatedClasses, pendingClasses };
  }, [classes, classStats]);

  const handlePublishBulletins = async () => {
    if (!selectedPeriod) {
      toast.error(t('bulletinDashboard.selectPeriodError'));
      return;
    }

    if (window.confirm(t('bulletinDashboard.confirmPublishAll'))) {
      try {
        await publishPeriodBulletins(selectedPeriod);
        toast.success(t('bulletinDashboard.publishSuccess'));
      } catch {
        toast.error(t('bulletinDashboard.publishError'));
      }
    }
  };

  const handlePublishClass = async (_classId: string) => {
    if (!selectedPeriod || !user) return;

    if (window.confirm(t('bulletinDashboard.confirmPublishClass'))) {
      try {
        // Mark the period as published so students can see it
        await publishPeriodBulletins(selectedPeriod);

        toast.success(t('bulletinDashboard.classPublishSuccess'));
      } catch {
        toast.error(t('bulletinDashboard.publishError'));
      }
    }
  };

  const handleViewBulletin = (classId: string) => {
    setViewingClassId(classId);
  };

  const canPublishAll = validationStats.validatedClasses === validationStats.totalClasses;

  // Role check - must be after all hooks
  if (!canAccess) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('bulletinDashboard.restrictedAccess')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          {t('bulletinDashboard.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{t('bulletinDashboard.subtitle')}</p>
      </div>

      {/* Period Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('bulletinDashboard.selectPeriod')}
        </label>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 dark:text-white"
        >
          <option value="">{t('bulletinDashboard.choosePeriod')}</option>
          {academicPeriods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.name} ({period.academicYear})
            </option>
          ))}
        </select>
      </div>

      {selectedPeriod && selectedPeriodData && (
        <>
          {/* Period Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">{t('bulletinDashboard.totalClasses')}</p>
                  <p className="text-3xl font-bold mt-1">{validationStats.totalClasses}</p>
                </div>
                <Users size={40} className="text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">
                    {t('bulletinDashboard.validatedClasses')}
                  </p>
                  <p className="text-3xl font-bold mt-1">{validationStats.validatedClasses}</p>
                </div>
                <CheckCircle size={40} className="text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">{t('bulletinDashboard.pendingClasses')}</p>
                  <p className="text-3xl font-bold mt-1">{validationStats.pendingClasses}</p>
                </div>
                <Clock size={40} className="text-orange-200" />
              </div>
            </div>
          </div>

          {/* Classes Validation Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText size={24} />
              {t('bulletinDashboard.validationStatusByClass')}
            </h2>
            <div className="space-y-3">
              {classes.map((classItem) => {
                const stats = classStats[classItem.id] || {
                  total: 0,
                  validated: 0,
                  isFullyValidated: false,
                };
                const isValidated = stats.isFullyValidated;
                const progress =
                  stats.total > 0 ? Math.round((stats.validated / stats.total) * 100) : 0;

                return (
                  <div
                    key={classItem.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isValidated ? (
                        <CheckCircle size={24} className="text-green-600" />
                      ) : (
                        <div className="relative">
                          <Clock size={24} className="text-orange-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {classItem.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {students.filter((s) => (s as Student).classId === classItem.id).length}{' '}
                          {t('bulletinDashboard.students')} • {progress}%{' '}
                          {t('bulletinDashboard.validated')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewBulletin(classItem.id)}
                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        title={t('bulletinDashboard.viewBulletins')}
                      >
                        <Eye size={20} />
                      </button>

                      {isValidated ? (
                        <button
                          onClick={() => handlePublishClass(classItem.id)}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium hover:bg-green-200 transition-colors flex items-center gap-1"
                        >
                          <Send size={14} />
                          {t('bulletinDashboard.publish')}
                        </button>
                      ) : (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                          {t('bulletinDashboard.pending')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Global Publication Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t('bulletinDashboard.globalPublication')}
            </h2>
            {!canPublishAll && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="text-orange-800 font-medium">⚠️ {t('bulletinDashboard.warning')}</p>
                <p className="text-orange-700 text-sm mt-1">
                  {t('bulletinDashboard.pendingClassesWarning', {
                    count: validationStats.pendingClasses,
                  })}
                </p>
              </div>
            )}
            <button
              onClick={handlePublishBulletins}
              disabled={!canPublishAll}
              className={`w-full md:w-auto px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 justify-center ${canPublishAll
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              <Send size={20} />
              {t('bulletinDashboard.publishAllBulletins')}
            </button>
          </div>
        </>
      )}

      {!selectedPeriod && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
          <Calendar size={64} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {t('bulletinDashboard.selectPeriodPrompt')}
          </p>
        </div>
      )}

      {/* Class Bulletin List Modal */}
      {viewingClassId && selectedPeriodData && (
        <ClassBulletinListModal
          classId={viewingClassId}
          className={classes.find((c) => c.id === viewingClassId)?.name || ''}
          period={selectedPeriodData}
          students={students.filter((s) => (s as Student).classId === viewingClassId)}
          courses={courses.filter((c) => c.classId === viewingClassId)}
          grades={grades}
          comments={periodComments}
          onClose={() => setViewingClassId(null)}
        />
      )}
    </div>
  );
};

export default BulletinDashboard;
