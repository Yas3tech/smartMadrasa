import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Button } from '../UI';
import { useData } from '../../context/DataContext';
import { X, Plus } from 'lucide-react';
import type { Course } from '../../types';
import { toast } from 'react-hot-toast';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Omit<Course, 'id'>) => Promise<void>;
  editingCourse?: Course | null;
  classId?: string;
  teacherId: string;
}

const DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

const CourseModal = ({
  isOpen,
  onClose,
  onSave,
  editingCourse,
  classId: propClassId,
  teacherId,
}: CourseModalProps) => {
  const { t } = useTranslation();
  const { classes, courses } = useData();
  const [loading, setLoading] = useState(false);

  const [subject, setSubject] = useState('');
  const [classId, setClassId] = useState(propClassId || '');
  const [dayOfWeek, setDayOfWeek] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [room, setRoom] = useState('');
  const [notes, setNotes] = useState('');

  const [isRecurring, setIsRecurring] = useState(true);
  const [recurrenceType, setRecurrenceType] = useState<'all_year' | 'custom_period'>('all_year');
  const [recurrenceStart, setRecurrenceStart] = useState('');
  const [recurrenceEnd, setRecurrenceEnd] = useState('');
  const [specificDate, setSpecificDate] = useState('');

  useEffect(() => {
    if (editingCourse) {
      setSubject(editingCourse.subject);
      setClassId(editingCourse.classId);
      setDayOfWeek(editingCourse.dayOfWeek as typeof dayOfWeek);
      setStartTime(editingCourse.startTime);
      setEndTime(editingCourse.endTime);
      setRoom(editingCourse.room || '');
      setNotes(editingCourse.notes || '');
      setIsRecurring(editingCourse.isRecurring || false);

      if (editingCourse.isRecurring) {
        if (editingCourse.recurrenceStart && editingCourse.recurrenceEnd) {
          setRecurrenceType('custom_period');
          setRecurrenceStart(editingCourse.recurrenceStart);
          setRecurrenceEnd(editingCourse.recurrenceEnd);
        } else {
          setRecurrenceType('all_year');
        }
      } else {
        setSpecificDate(editingCourse.specificDate || '');
      }
    } else {
      setSubject('');
      if (!propClassId) setClassId('');
      setDayOfWeek(1);
      setStartTime('08:00');
      setEndTime('09:00');
      setRoom('');
      setNotes('');
      setIsRecurring(true);
      setRecurrenceType('all_year');
      setRecurrenceStart('');
      setRecurrenceEnd('');
      setSpecificDate('');
    }
  }, [editingCourse, isOpen, propClassId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !startTime || !endTime || !classId) {
      toast.error(t('schedule.fillRequiredFields'));
      return;
    }

    if (!isRecurring && !specificDate) {
      toast.error(t('schedule.selectDateError'));
      return;
    }

    if (isRecurring && recurrenceType === 'custom_period' && (!recurrenceStart || !recurrenceEnd)) {
      toast.error(t('schedule.definePeriodError'));
      return;
    }

    setLoading(true);
    try {
      const courseData: Omit<Course, 'id'> & {
        room?: string;
        notes?: string;
        recurrenceStart?: string;
        recurrenceEnd?: string;
        specificDate?: string;
      } = {
        classId,
        teacherId,
        subject,
        dayOfWeek,
        startTime,
        endTime,
        isRecurring,
      };

      if (isRecurring && recurrenceType === 'custom_period') {
        courseData.recurrenceStart = recurrenceStart;
        courseData.recurrenceEnd = recurrenceEnd;
      } else if (isRecurring && recurrenceType === 'all_year') {
        // User requested "All Year" to start from today
        courseData.recurrenceStart = new Date().toISOString().split('T')[0];
      }

      if (room) courseData.room = room;
      if (notes) courseData.notes = notes;

      await onSave(courseData);
      toast.success(editingCourse ? t('schedule.courseUpdated') : t('schedule.courseAdded'));
      onClose();
    } catch {
      toast.error(t('schedule.courseSaveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingCourse ? t('schedule.editCourseTitle') : t('schedule.addCourse')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!propClassId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.classes')} *
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                required
              >
                <option value="">{t('schedule.selectClass')}</option>
                {classes
                  .filter((c) => c.teacherId === teacherId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('schedule.subject')} *
            </label>
            <input
              list="subjects-list"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
              placeholder={t('schedule.subjectPlaceholder')}
              required
            />
            <datalist id="subjects-list">
              {courses
                .filter((c) => c.teacherId === teacherId)
                .map((c) => c.subject)
                .filter((value, index, self) => self.indexOf(value) === index) // Unique values
                .map((s) => (
                  <option key={`existing-${s}`} value={s} />
                ))}
            </datalist>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={isRecurring}
                onChange={() => setIsRecurring(true)}
                className="text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-800 dark:text-white">
                {t('schedule.weekly')}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!isRecurring}
                onChange={() => setIsRecurring(false)}
                className="text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-800 dark:text-white">
                {t('schedule.oneTime')}
              </span>
            </label>
          </div>

          {!isRecurring && (
            <Input
              label={`${t('common.date')} *`}
              type="date"
              value={specificDate}
              onChange={(e) => {
                setSpecificDate(e.target.value);
                // Auto-set day of week based on date
                const date = new Date(e.target.value);
                const day = date.getDay() || 7;
                setDayOfWeek(day as 1 | 2 | 3 | 4 | 5 | 6 | 7);
              }}
              required
            />
          )}

          {isRecurring && (
            <div className="space-y-3 pl-4 border-l-2 border-orange-100">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={recurrenceType === 'all_year'}
                    onChange={() => setRecurrenceType('all_year')}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-white">
                    {t('schedule.allYear')}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={recurrenceType === 'custom_period'}
                    onChange={() => setRecurrenceType('custom_period')}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-white">
                    {t('schedule.customPeriod')}
                  </span>
                </label>
              </div>

              {recurrenceType === 'custom_period' && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={`${t('schedule.from')} *`}
                    type="date"
                    value={recurrenceStart}
                    onChange={(e) => setRecurrenceStart(e.target.value)}
                    required
                  />
                  <Input
                    label={`${t('schedule.to')} *`}
                    type="date"
                    value={recurrenceEnd}
                    onChange={(e) => setRecurrenceEnd(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          )}

          {isRecurring && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('schedule.day')} *
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6 | 7)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                required
              >
                {DAY_KEYS.map((dayKey, index) => (
                  <option key={index + 1} value={index + 1}>
                    {t(`schedule.${dayKey}`)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`${t('schedule.startTime')} *`}
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label={`${t('schedule.endTime')} *`}
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          {/* Recurring Checkbox Removed (replaced by radio buttons above) */}

          <Input
            label={t('schedule.roomOptional')}
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="ex: Salle 101"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('schedule.notesOptional')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
              placeholder={t('schedule.notesPlaceholder')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={onClose} type="button">
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit" disabled={loading} icon={Plus}>
              {loading
                ? t('schedule.saving')
                : editingCourse
                  ? t('common.edit')
                  : t('schedule.add')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CourseModal;
