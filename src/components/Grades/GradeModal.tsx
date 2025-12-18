import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Button } from '../UI';
import { X, Plus } from 'lucide-react';
import type { Grade, Student } from '../../types';
import { useData } from '../../context/DataContext';

interface GradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (grade: Omit<Grade, 'id'>) => Promise<void>;
  editingGrade?: Grade | null;
  classId?: string;
  availableSubjects?: string[];
}

const GradeModal = ({
  isOpen,
  onClose,
  onSave,
  editingGrade,
  classId,
  availableSubjects = [],
}: GradeModalProps) => {
  const { t } = useTranslation();
  const { students } = useData();
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<'exam' | 'homework' | 'participation' | 'evaluation'>('exam');
  const [title, setTitle] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('20');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter students by class if classId is provided
  const classStudents = classId
    ? students.filter((s) => (s as Student).classId === classId)
    : students;

  useEffect(() => {
    if (editingGrade) {
      setStudentId(editingGrade.studentId);
      setSubject(editingGrade.subject);
      setType(editingGrade.type);
      setTitle(editingGrade.title || '');
      setScore(editingGrade.score.toString());
      setMaxScore(editingGrade.maxScore.toString());
      setDate(new Date(editingGrade.date).toISOString().split('T')[0]);
      setFeedback(editingGrade.feedback || '');
    } else {
      // Reset form
      setStudentId('');
      setSubject('');
      setType('exam');
      setTitle('');
      setScore('');
      setMaxScore('20');
      setDate(new Date().toISOString().split('T')[0]);
      setFeedback('');
    }
  }, [editingGrade, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !subject || !score || !maxScore) return;

    setLoading(true);
    try {
      await onSave({
        studentId,
        subject,
        type,
        title: title || undefined,
        score: parseFloat(score),
        maxScore: parseFloat(maxScore),
        date: new Date(date).toISOString(),
        feedback: feedback || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error saving grade:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingGrade ? t('grades.editGrade') : t('grades.addGrade')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('common.student')} *
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
              required
            >
              <option value="">{t('grades.selectStudent')}</option>
              {classStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('common.subject')} *
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
              required
            >
              <option value="">{t('common.selectSubject')}</option>
              {availableSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.type')} *
              </label>
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as 'exam' | 'homework' | 'participation' | 'evaluation')
                }
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                required
              >
                <option value="exam">{t('grades.exam')}</option>
                <option value="homework">{t('grades.homework')}</option>
                <option value="participation">{t('grades.participation')}</option>
                <option value="evaluation">{t('grades.evaluation')}</option>
              </select>
            </div>
            <Input
              label={`${t('grades.gradeTitle')} (optionnel)`}
              placeholder={t('grades.gradeTitlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Score and Max Score */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`${t('grades.score')} *`}
              type="number"
              step="0.5"
              min="0"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              required
            />
            <Input
              label={`${t('grades.maxScore')} *`}
              type="number"
              step="0.5"
              min="0"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              required
            />
          </div>

          {/* Date */}
          <Input
            label={`${t('common.date')} *`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('grades.comment')} (optionnel)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
              placeholder={t('grades.feedbackDescPlaceholder')}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={onClose} type="button">
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit" disabled={loading} icon={Plus}>
              {loading ? t('common.saving') : editingGrade ? t('common.edit') : t('common.add')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default GradeModal;
