import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '../UI';
import { Calendar as CalendarIcon, CheckCircle2, MessageSquare, BookOpen } from 'lucide-react';
import type { Event } from '../../types';

interface TeacherDashboardProps {
  upcomingEvents: Event[];
}

export function TeacherDashboard({ upcomingEvents }: TeacherDashboardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">{t('dashboard.events.upcoming')}</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/schedule')}>
            {t('schedule.title')}
          </Button>
        </div>
        <div className="space-y-4">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl hover:shadow-md transition-all border border-gray-100 cursor-pointer"
                onClick={() => navigate('/schedule')}
              >
                <div className="w-20 font-bold text-gray-900 text-sm">
                  {new Date(event.start).toLocaleTimeString(i18n.language, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800">{event.title}</h4>
                  <p className="text-sm text-gray-500">{event.description}</p>
                </div>
                <Badge
                  variant={
                    event.type === 'exam' ? 'error' : event.type === 'homework' ? 'warning' : 'info'
                  }
                >
                  {event.type === 'exam'
                    ? t('grades.exam')
                    : event.type === 'homework'
                      ? t('grades.homework')
                      : t('dashboard.events.other')}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <CalendarIcon size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">{t('dashboard.events.noEvents')}</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4 text-gray-900">{t('dashboard.actions.title')}</h3>
        <div className="space-y-3">
          <Button
            className="w-full justify-start group"
            icon={CheckCircle2}
            onClick={() => navigate('/attendance')}
          >
            <span>{t('dashboard.actions.takeAttendance')}</span>
          </Button>
          <Button
            className="w-full justify-start"
            variant="secondary"
            icon={BookOpen}
            onClick={() => navigate('/grades')}
          >
            <span>{t('dashboard.actions.enterGrades')}</span>
          </Button>
          <Button
            className="w-full justify-start"
            variant="secondary"
            icon={MessageSquare}
            onClick={() => navigate('/messages')}
          >
            <span>{t('dashboard.actions.sendMessage')}</span>
          </Button>
          <Button
            className="w-full justify-start"
            variant="secondary"
            icon={CalendarIcon}
            onClick={() => navigate('/schedule')}
          >
            {t('schedule.title')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
