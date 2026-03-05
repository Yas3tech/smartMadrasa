import React from 'react';
import { Card } from '../UI';
import { Check, X, Clock, Calendar, AlertCircle } from 'lucide-react';
import StudentSelector from '../Common/StudentSelector';
import type { User, Course, Attendance } from '../../types';

interface StudentAttendanceProps {
  user: User;
  attendance: Attendance[];
  courses: Course[];
  selectedChild: { id: string; name: string; classId: string } | null;
  setSelectedChild: (child: { id: string; name: string; classId: string } | null) => void;
  t: (key: string) => string;
  i18n: { language: string };
}

const StudentAttendance: React.FC<StudentAttendanceProps> = ({
  user,
  attendance,
  courses,
  selectedChild,
  setSelectedChild,
  t,
  i18n,
}) => {
  const getStudentStats = (studentId: string) => {
    const studentRecords = attendance.filter((a) => a.studentId === studentId);
    const present = studentRecords.filter((r) => r.status === 'present').length;
    const absent = studentRecords.filter((r) => r.status === 'absent').length;
    const late = studentRecords.filter((r) => r.status === 'late').length;

    return { present, absent, late, total: studentRecords.length, records: studentRecords };
  };

  const targetStudentId = user.role === 'student' ? user.id : selectedChild?.id;

  if (user.role === 'parent' && !targetStudentId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('attendance.title')}
        </h1>
        <StudentSelector onSelect={setSelectedChild} selectedStudentId={selectedChild?.id} />
        <div className="text-center py-12 text-gray-500">{t('attendance.selectChildDesc')}</div>
      </div>
    );
  }

  if (!targetStudentId) return null;

  const { present, absent, late, records } = getStudentStats(targetStudentId);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('attendance.myAttendance')}
          </h1>
          <p className="text-gray-600 dark:text-slate-400">{t('attendance.subtitle')}</p>
        </div>
        {user.role === 'parent' && (
          <div className="w-full md:w-auto">
            <StudentSelector onSelect={setSelectedChild} selectedStudentId={selectedChild?.id} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
                {t('attendance.present')}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{present}</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm">
              <Check className="text-green-500" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
                {t('attendance.absent')}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{absent}</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm">
              <X className="text-red-500" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
                {t('attendance.late')}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{late}</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm">
              <Clock className="text-yellow-500" size={24} />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar size={20} className="text-orange-500" />
            {t('attendance.history')}
          </h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-slate-700">
          {records
            .filter((record) => record.status !== 'present')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((record) => {
              const course = courses.find((c) => c.id === record.courseId);
              return (
                <div
                  key={record.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        record.status === 'present'
                          ? 'bg-green-100 text-green-600'
                          : record.status === 'absent'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-yellow-100 text-yellow-600'
                      }`}
                    >
                      {record.status === 'present' ? (
                        <Check size={20} />
                      ) : record.status === 'absent' ? (
                        <X size={20} />
                      ) : (
                        <Clock size={20} />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Date(record.date).toLocaleDateString(i18n.language, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <div className="text-sm text-gray-500">
                        {course ? (
                          <span>{course.subject}</span>
                        ) : (
                          <span className="italic opacity-50">{t('attendance.unknownCourse')}</span>
                        )}
                        {record.justification && (
                          <span className="ml-2 text-gray-400 italic">
                            ({record.justification})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        record.status === 'present'
                          ? 'bg-green-100 text-green-700'
                          : record.status === 'absent'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {t(`attendance.${record.status}`)}
                    </span>
                    {(record.status === 'absent' || record.status === 'late') && (
                      <div className="mt-1 text-xs">
                        {record.isJustified ? (
                          <span className="text-green-600 font-medium flex items-center justify-end gap-1">
                            <Check size={12} /> {t('attendance.justified')}
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center justify-end gap-1">
                            <AlertCircle size={12} /> {t('attendance.notJustified')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          {records.filter((record) => record.status !== 'present').length === 0 && (
            <div className="p-8 text-center text-gray-500">{t('attendance.noRecords')}</div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StudentAttendance;
