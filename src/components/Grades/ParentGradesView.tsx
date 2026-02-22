import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../UI';
import { FileText, GraduationCap, Clock } from 'lucide-react';
import GradeCard from './GradeCard';
import { useGradeStats } from '../../hooks/useGradeStats';
import { useAuth } from '../../context/AuthContext';
import StudentSelector from '../Common/StudentSelector';

const ParentGradesView = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [selectedChildId, setSelectedChildId] = useState('');

  // Use the optimized hook
  const { stats, studentGrades } = useGradeStats(selectedChildId);

  if (!user || user.role !== 'parent') return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('grades.schoolReports')}
        </h1>
        <div className="min-w-[200px]">
          <StudentSelector
            onSelect={(student) => setSelectedChildId(student.id)}
            selectedStudentId={selectedChildId}
          />
        </div>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="text-orange-600" />
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {t('grades.generalAverage')}
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.avgGrade}%</p>
              <div className="mt-2 text-sm text-gray-500">
                {stats.avgGrade >= 80 ? (
                  <span className="text-green-600">{t('grades.excellent')}</span>
                ) : stats.avgGrade >= 60 ? (
                  <span className="text-blue-600">{t('grades.good')}</span>
                ) : (
                  <span className="text-orange-600">{t('grades.needsImprovement')}</span>
                )}
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="text-blue-600" />
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {t('grades.attendanceRate')}
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.attendanceRate}%
              </p>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="text-green-600" />
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {t('grades.totalGrades')}
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalGrades}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {studentGrades.length > 0 ? (
              studentGrades.map((grade) => <GradeCard key={grade.id} grade={grade} />)
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                <FileText size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>{t('grades.noGradesYet')}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ParentGradesView;
