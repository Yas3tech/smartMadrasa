import { useTranslation } from 'react-i18next';
import { Card, Button, Badge } from '../UI';
import { Clock, Edit2, Trash2, Eye, Send, BookOpen } from 'lucide-react';
import type { Homework } from '../../types';

interface HomeworkCardProps {
  homework: Homework;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  daysRemaining: number;
  isPast?: boolean;
  isTeacher?: boolean;
  onEdit?: (homework: Homework) => void;
  onDelete?: (id: string) => void;
  onViewSubmissions?: (homework: Homework) => void;
  onSubmit?: (homework: Homework) => void;
  submission?: { grade?: number; content?: string };
}

export function HomeworkCard({
  homework,
  status,
  daysRemaining,
  isPast = false,
  isTeacher = false,
  onEdit,
  onDelete,
  onViewSubmissions,
  onSubmit,
  submission,
}: HomeworkCardProps) {
  const { t, i18n } = useTranslation();

  const getStatusBadge = () => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">{t('homework.pending')}</Badge>;
      case 'submitted':
        return <Badge variant="info">{t('homework.submitted')}</Badge>;
      case 'graded':
        return <Badge variant="success">{t('homework.graded')}</Badge>;
      case 'overdue':
        return <Badge variant="error">{t('homework.overdue')}</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className={`p-6 ${isPast ? 'opacity-75' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{homework.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{homework.subject}</p>
        </div>
        {getStatusBadge()}
      </div>

      {homework.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {homework.description}
        </p>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Clock size={16} />
        <span>
          {t('homework.dueFor')}: {new Date(homework.dueDate).toLocaleDateString(i18n.language)}
        </span>
        {!isPast && daysRemaining > 0 && (
          <Badge variant={daysRemaining <= 2 ? 'error' : 'warning'} className="ml-2">
            {t('homework.daysRemaining', { count: daysRemaining })}
          </Badge>
        )}
      </div>

      {/* Grade display for graded submissions */}
      {submission?.grade !== undefined && homework.maxGrade && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg mb-4">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            {t('homework.grade')}: {submission.grade}/{homework.maxGrade}
          </p>
        </div>
      )}

      {/* Teacher actions */}
      {isTeacher && (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Eye}
            onClick={() => onViewSubmissions?.(homework)}
          >
            {t('homework.viewSubmissions')}
          </Button>
          <Button variant="ghost" size="sm" icon={Edit2} onClick={() => onEdit?.(homework)} />
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => onDelete?.(homework.id)}
            className="text-red-500 hover:text-red-700"
          />
        </div>
      )}

      {/* Student actions */}
      {!isTeacher && status !== 'graded' && homework.allowOnlineSubmission && (
        <div className="flex gap-2">
          <Button
            variant={status === 'submitted' ? 'secondary' : 'primary'}
            size="sm"
            icon={status === 'submitted' ? Edit2 : Send}
            onClick={() => onSubmit?.(homework)}
          >
            {status === 'submitted' ? t('common.edit') : t('homework.submit')}
          </Button>
        </div>
      )}

      {/* Classroom only indicator */}
      {!isTeacher && !homework.allowOnlineSubmission && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <BookOpen size={16} />
          <span>{t('homework.classroomOnly')}</span>
        </div>
      )}
    </Card>
  );
}

export default HomeworkCard;
