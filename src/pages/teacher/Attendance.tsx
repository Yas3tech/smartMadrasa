import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useUsers, useAcademics, usePerformance } from '../../context/DataContext';
import StudentAttendance from '../../components/Attendance/StudentAttendance';
import TeacherAttendance from '../../components/Attendance/TeacherAttendance';
import DirectorAttendanceView from '../../components/Attendance/DirectorAttendanceView';
import type { Student } from '../../types';

type DirectorTab = 'overview' | 'mark';

const Attendance = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { students } = useUsers();
  const { courses, classes } = useAcademics();
  const { attendance, markAttendance, updateAttendance } = usePerformance();
  const isRTL = i18n.language === 'ar';

  const [selectedChild, setSelectedChild] = useState<{
    id: string;
    name: string;
    classId: string;
  } | null>(null);

  const [directorTab, setDirectorTab] = useState<DirectorTab>('overview');

  if (user?.role === 'student' || user?.role === 'parent') {
    return (
      <StudentAttendance
        user={user as any}
        attendance={attendance}
        courses={courses as any}
        selectedChild={selectedChild}
        setSelectedChild={setSelectedChild}
        t={t}
        i18n={i18n}
      />
    );
  }

  if (user?.role === 'director' || user?.role === 'superadmin') {
    return (
      <div className="space-y-6">
        {/* Tab switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDirectorTab('overview')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              directorTab === 'overview'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600'
            }`}
          >
            {t('attendance.overviewTab')}
          </button>
          <button
            onClick={() => setDirectorTab('mark')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              directorTab === 'mark'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600'
            }`}
          >
            {t('attendance.markTab')}
          </button>
        </div>

        {directorTab === 'overview' ? (
          <DirectorAttendanceView
            students={students as Student[]}
            attendance={attendance}
            courses={courses as any}
            classes={classes}
          />
        ) : (
          <TeacherAttendance
            user={user as any}
            students={students as any}
            courses={courses as any}
            classes={classes}
            attendance={attendance}
            markAttendance={markAttendance}
            updateAttendance={updateAttendance}
            t={t}
            isRTL={isRTL}
          />
        )}
      </div>
    );
  }

  if (user?.role === 'teacher') {
    return (
      <TeacherAttendance
        user={user as any}
        students={students as any}
        courses={courses as any}
        classes={classes}
        attendance={attendance}
        markAttendance={markAttendance}
        updateAttendance={updateAttendance}
        t={t}
        isRTL={isRTL}
      />
    );
  }

  return null;
};

export default Attendance;
