import { useTranslation } from 'react-i18next';
import { Modal, Button, Badge } from '../UI';
import { X, Calendar, User, FileText, BookOpen } from 'lucide-react';
import type { Homework } from '../../types';
import { isSafeUrl } from '../../utils/security';

interface HomeworkDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  homework: Homework | null;
}

const HomeworkDetailModal = ({ isOpen, onClose, homework }: HomeworkDetailModalProps) => {
  const { t, i18n } = useTranslation();

  if (!homework) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isOverdue = new Date(homework.dueDate) < new Date();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BookOpen className="text-orange-600" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{homework.title}</h2>
                <p className="text-sm text-gray-500">{homework.subject}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="text-gray-400" size={18} />
            <div>
              <p className="text-gray-500">{t('homework.dueDate')}</p>
              <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                {formatDate(homework.dueDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="text-gray-400" size={18} />
            <div>
              <p className="text-gray-500">{t('homework.assignedBy')}</p>
              <p className="font-medium text-gray-900">{homework.assignedBy}</p>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {homework.maxGrade && (
            <Badge variant="info">
              {t('homework.maxGrade')}: {homework.maxGrade}
            </Badge>
          )}
          {homework.allowOnlineSubmission && (
            <Badge variant="success">{t('homework.allowOnlineSubmission')}</Badge>
          )}
          {isOverdue && <Badge variant="error">{t('homework.overdue')}</Badge>}
        </div>

        {/* Description */}
        {homework.description && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">{t('homework.description')}</h3>
            <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
              {homework.description}
            </p>
          </div>
        )}

        {/* Attachments */}
        {homework.attachments && homework.attachments.filter(isSafeUrl).length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">{t('homework.attachedFiles')}</h3>
            <div className="space-y-2">
              {homework.attachments.filter(isSafeUrl).map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FileText size={16} className="text-blue-600" />
                  <span className="text-sm text-blue-700">
                    {t('common.file')} {index + 1}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default HomeworkDetailModal;
