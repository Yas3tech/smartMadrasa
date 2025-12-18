import { useTranslation } from 'react-i18next';
import { Modal, Button } from '../UI';
import { X, Calendar, Clock, BookOpen, FileText, GraduationCap } from 'lucide-react';
import type { Event, Homework } from '../../types';

interface UpcomingEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: Event[];
  homeworks: Homework[];
}

type UpcomingItem =
  | { type: 'event'; data: Event; date: Date }
  | { type: 'homework'; data: Homework; date: Date };

const UpcomingEventsModal = ({ isOpen, onClose, events, homeworks }: UpcomingEventsModalProps) => {
  const { t, i18n } = useTranslation();

  // Combine events and homeworks
  const upcomingItems: UpcomingItem[] = [
    ...events
      .filter((e) => new Date(e.start) >= new Date())
      .map((e) => ({ type: 'event' as const, data: e, date: new Date(e.start) })),
    ...homeworks
      .filter((h) => new Date(h.dueDate) >= new Date())
      .map((h) => ({ type: 'homework' as const, data: h, date: new Date(h.dueDate) })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const eventTypeConfig = {
    lesson: {
      icon: BookOpen,
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      label: t('calendar.lesson'),
    },
    homework: {
      icon: FileText,
      color: 'bg-green-100 text-green-700 border-green-300',
      label: t('calendar.homework'),
    },
    exam: {
      icon: GraduationCap,
      color: 'bg-red-100 text-red-700 border-red-300',
      label: t('calendar.exam'),
    },
    event: {
      icon: Calendar,
      color: 'bg-purple-100 text-purple-700 border-purple-300',
      label: t('calendar.event'),
    },
    evaluation: {
      icon: GraduationCap,
      color: 'bg-orange-100 text-orange-700 border-orange-300',
      label: t('grades.evaluation'),
    },
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(i18n.language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-slate-800 pb-4 border-b dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="text-orange-600" size={28} />
            {t('calendar.upcoming')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {upcomingItems.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">{t('calendar.noUpcomingEvents')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingItems.map((item) => {
              if (item.type === 'event') {
                const event = item.data;
                const config = eventTypeConfig[event.type] || eventTypeConfig.event;
                const Icon = config.icon;

                return (
                  <div
                    key={`event-${event.id}`}
                    className="p-4 rounded-xl border-2 hover:shadow-md transition-shadow bg-white dark:bg-slate-700 dark:border-slate-600"
                  >
                    <div className="flex items-start gap-4">
                      {/* Type Badge */}
                      <div
                        className={`px-3 py-1 rounded-lg text-sm font-medium border-2 ${config.color} flex items-center gap-2`}
                      >
                        <Icon size={16} />
                        {config.label}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                          {event.title}
                        </h3>
                        {event.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            {event.description}
                          </p>
                        )}

                        {/* Date and Time */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(item.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatTime(new Date(event.start))} - {formatTime(new Date(event.end))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Homework
                const homework = item.data;
                const Icon = BookOpen;
                const config = eventTypeConfig.homework;

                return (
                  <div
                    key={`homework-${homework.id}`}
                    className="p-4 rounded-xl border-2 hover:shadow-md transition-shadow bg-white dark:bg-slate-700 dark:border-slate-600"
                  >
                    <div className="flex items-start gap-4">
                      {/* Type Badge */}
                      <div
                        className={`px-3 py-1 rounded-lg text-sm font-medium border-2 ${config.color} flex items-center gap-2`}
                      >
                        <Icon size={16} />
                        {config.label}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                          {homework.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {homework.subject}
                        </p>
                        {homework.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                            {homework.description}
                          </p>
                        )}

                        {/* Date */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {t('homework.dueFor')} : {formatDate(item.date)}
                          </span>
                          {homework.maxGrade && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              /{homework.maxGrade} pts
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}

        <div className="mt-6 pt-4 border-t flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UpcomingEventsModal;
