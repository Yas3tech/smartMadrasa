import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button } from '../UI';
import { X, Save } from 'lucide-react';
import type { Grade, Student } from '../../types';

export interface BulkGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  className: string;
  students: Student[];
  onSave: (grades: Omit<Grade, 'id'>[]) => Promise<void>;
  availableSubjects?: string[];
}

const BulkGradeModal = ({
  isOpen,
  onClose,
  onSave,
  className,
  students,
  availableSubjects = [],
}: BulkGradeModalProps) => {
  const { t } = useTranslation();
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<'exam' | 'homework' | 'participation' | 'evaluation'>('exam');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxScore, setMaxScore] = useState(20);


  const [scores, setScores] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [absences, setAbsences] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (isOpen) {
      setSubject('');
      setType('exam');
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setMaxScore(20);
      setScores({});
      setFeedback({});
      setAbsences({});
    }
  }, [isOpen]);

  const handleScoreChange = (studentId: string, value: string) => {
    if (
      value === '' ||
      (!isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= maxScore)
    ) {
      setScores((prev) => ({ ...prev, [studentId]: value }));
    }
  };

  const handleFeedbackChange = (studentId: string, value: string) => {
    setFeedback((prev) => ({ ...prev, [studentId]: value }));
  };

  const toggleAbsence = (studentId: string) => {
    setAbsences((prev) => {
      const isAbsent = !prev[studentId];
      if (isAbsent) {
        setScores((prevScores) => {
          const newScores = { ...prevScores };
          delete newScores[studentId];
          return newScores;
        });
      }
      return { ...prev, [studentId]: isAbsent };
    });
  };

  const handleSubmit = async () => {
    if (!subject || !date) return;

    setLoading(true);
    try {
      const gradesToSave: Omit<Grade, 'id'>[] = [];

      students.forEach((student) => {
        const isAbsent = absences[student.id];
        const scoreStr = scores[student.id];

        if (isAbsent || (scoreStr !== undefined && scoreStr !== '')) {
          gradesToSave.push({
            studentId: student.id,
            subject,
            score: isAbsent ? 0 : Number(scoreStr),
            maxScore,
            type,
            title: title || undefined,
            date: new Date(date).toISOString(),
            feedback: feedback[student.id],
            status: isAbsent ? 'absent' : 'present',
            studentName: student.name,
            className: className,
          } as Omit<Grade, 'id'>);
        }
      });

      if (gradesToSave.length > 0) {
        await onSave(gradesToSave);
      } else {
        // No grades to save
      }
    } catch (error) {
      // Error handled by caller
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-4xl w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('grades.bulkEntryTitle')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.class')}
              </p>
              <p className="px-4 py-2 rounded-xl bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 text-gray-900 dark:text-white">
                {className}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.subject')} *
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
              >
                <option value="">{t('common.selectSubject')}</option>
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('grades.gradeTitle')} (Optionnel)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('grades.gradeTitlePlaceholder')}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.type')} *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
              >
                <option value="exam">{t('grades.exam')}</option>
                <option value="homework">{t('grades.homework')}</option>
                <option value="participation">{t('grades.participation')}</option>
                <option value="evaluation">{t('grades.evaluation')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.date')} *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('grades.maxScore')} *
              </label>
              <input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                min="1"
              />
            </div>
          </div>

          {/* Students List */}
          {students.length > 0 && (
            <div className="border dark:border-slate-600 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      {t('common.student')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300 w-32">
                      {t('grades.scoreArg', { max: maxScore })}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300 w-24">
                      {t('status.absent')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      {t('grades.comment')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {student.name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={scores[student.id] || ''}
                          onChange={(e) => handleScoreChange(student.id, e.target.value)}
                          disabled={absences[student.id]}
                          className="w-full px-3 py-1 text-center rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                          placeholder="-"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!absences[student.id]}
                          onChange={() => toggleAbsence(student.id)}
                          className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={feedback[student.id] || ''}
                          onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                          className="w-full px-3 py-1 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                          placeholder={t('grades.feedbackPlaceholder')}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {students.length === 0 && (
                <div className="p-8 text-center text-gray-500">{t('grades.noStudents')}</div>
              )}
            </div>
          )}


          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={onClose} type="button">
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={loading || students.length === 0}
              icon={Save}
              type="button"
            >
              {loading ? t('common.saving') : t('grades.saveGrades')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BulkGradeModal;
