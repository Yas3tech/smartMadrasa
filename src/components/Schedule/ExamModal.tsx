import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Button } from '../UI';
import { X, Save } from 'lucide-react';
import { useData } from '../../context/DataContext';
import toast from 'react-hot-toast';
import type { Event } from '../../types';

interface ExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exam: Omit<Event, 'id'>) => Promise<void>;
  editingEvent?: Event | null;
  classId?: string;
  teacherId?: string;
}

const ExamModal = ({
  isOpen,
  onClose,
  onSave,
  editingEvent,
  classId: propClassId,
  teacherId,
}: ExamModalProps) => {
  const { t } = useTranslation();
  const { classes } = useData();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'exam' | 'evaluation'>('exam');
  const [classId, setClassId] = useState(propClassId || '');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [room, setRoom] = useState('');

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDescription(editingEvent.description);

      setType(editingEvent.type === 'evaluation' ? 'evaluation' : 'exam');
      setClassId(editingEvent.classId || '');

      const startDate = new Date(editingEvent.start);
      const endDate = new Date(editingEvent.end);

      setDate(startDate.toISOString().split('T')[0]);
      setStartTime(startDate.toTimeString().slice(0, 5));
      setEndTime(endDate.toTimeString().slice(0, 5));
    } else {

      setTitle('');
      setDescription('');
      setType('exam');
      if (!propClassId) setClassId('');
      setDate('');
      setStartTime('10:00');
      setEndTime('12:00');
      setRoom('');
    }
  }, [editingEvent, isOpen, propClassId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !startTime || !endTime || !classId) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);

      const eventData: Omit<Event, 'id'> = {
        title,
        description: room ? `${description} (${t('schedule.room')}: ${room})` : description,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        type,
        classId,
      };

      await onSave(eventData);
      toast.success(editingEvent ? t('schedule.eventUpdated') : t('schedule.eventAdded'));
      onClose();
    } catch (error) {
      toast.error(t('schedule.eventSaveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingEvent ? t('schedule.editEvent') : t('schedule.addEvent')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="w-1/3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.type')}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'exam' | 'evaluation')}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
              >
                <option value="exam">{t('grades.exam')}</option>
                <option value="evaluation">{t('grades.evaluation')}</option>
              </select>
            </div>
            <div className="flex-1">
              <Input
                label={`${t('grades.gradeTitle')} *`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('schedule.eventTitlePlaceholder')}
                required
              />
            </div>
          </div>


          {!propClassId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.class')} *
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                required
              >
                <option value="">{t('grades.selectClass')}</option>
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
              {t('common.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
              placeholder={t('schedule.descriptionPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`${t('common.date')} *`}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Input
              label={`${t('schedule.room')} (optionnel)`}
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder={t('schedule.roomPlaceholder')}
            />
          </div>

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

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={onClose} type="button">
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit" disabled={loading} icon={Save}>
              {loading ? t('common.saving') : editingEvent ? t('common.edit') : t('common.add')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ExamModal;
