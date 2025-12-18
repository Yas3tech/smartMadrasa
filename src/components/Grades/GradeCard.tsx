import { useTranslation } from 'react-i18next';
import type { Grade } from '../../types';
import { FileText, User } from 'lucide-react';

interface GradeCardProps {
  grade: Grade;
  teacherName?: string;
}

const GradeCard = ({ grade, teacherName }: GradeCardProps) => {
  const { t, i18n } = useTranslation();
  const percentage = Math.round((grade.score / grade.maxScore) * 100);
  const isPassing = percentage >= 50;

  // Radius for circle
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const strokeColor = isPassing
    ? percentage >= 80
      ? 'text-green-500'
      : 'text-blue-500'
    : 'text-red-500';

  const bgColor = isPassing
    ? percentage >= 80
      ? 'bg-green-50 dark:bg-green-900/20'
      : 'bg-blue-50 dark:bg-blue-900/20'
    : 'bg-red-50 dark:bg-red-900/20';

  const borderColor = isPassing
    ? percentage >= 80
      ? 'border-green-100 dark:border-green-800'
      : 'border-blue-100 dark:border-blue-800'
    : 'border-red-100 dark:border-red-800';

  return (
    <div
      className={`p-6 rounded-2xl border ${borderColor} ${bgColor} transition-shadow hover:shadow-md`}
    >
      <div className="flex gap-4">
        {/* Circular Progress */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              className="text-gray-200 dark:text-gray-700"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="32"
              cy="32"
            />
            <circle
              className={`${strokeColor} transition-all duration-1000 ease-out`}
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="32"
              cy="32"
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-gray-900 dark:text-white">
            {percentage}%
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white truncate pr-2">
                {grade.title || `${t('grades.evaluation')} ${grade.subject}`}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium uppercase border ${
                    isPassing
                      ? 'bg-blue-100 dark:bg-blue-600 border-blue-200 dark:border-blue-500 text-blue-700 dark:text-white'
                      : 'bg-red-100 dark:bg-red-600 border-red-200 dark:border-red-500 text-red-700 dark:text-white'
                  }`}
                >
                  {grade.subject.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  {new Date(grade.date).toLocaleDateString(i18n.language, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-900 dark:text-white">
                {grade.score}
                <span className="text-gray-400 dark:text-gray-500 text-sm">/{grade.maxScore}</span>
              </div>
            </div>
          </div>

          {/* Feedback / Details */}
          {grade.feedback && (
            <div className="mt-4 flex gap-3 text-sm text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-slate-800/60 p-3 rounded-xl">
              {teacherName ? (
                <div
                  className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center flex-shrink-0"
                  title={teacherName}
                >
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                    {teacherName.charAt(0)}
                  </span>
                </div>
              ) : (
                <User size={20} className="text-gray-400 dark:text-gray-500 mt-1" />
              )}
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white mb-0.5">
                  {teacherName || t('grades.teacher')}
                </p>
                <p className="italic text-gray-600 dark:text-gray-400 leading-relaxed">
                  "{grade.feedback}"
                </p>
              </div>
            </div>
          )}

          {!grade.feedback && (
            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <FileText size={14} />
              <span>{grade.type === 'exam' ? t('grades.exam') : t('grades.homework')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GradeCard;
