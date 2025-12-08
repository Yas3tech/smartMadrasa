import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../../context/DataContext';
import { Card, Button, Modal, Input } from '../../components/UI';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Clock, BookOpen } from 'lucide-react';
import type { Event } from '../../types';
import Schedule from './Schedule';

const Calendar = () => {
    const { t, i18n } = useTranslation();
    const { events, addEvent, updateEvent, deleteEvent } = useData();

    const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 20));
    const [view, setView] = useState<'month' | 'upcoming' | 'schedule'>('month');
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [eventType, setEventType] = useState<'lesson' | 'homework' | 'exam' | 'event' | 'evaluation'>('lesson');

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek };
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

    const getEventsForDay = (day: number) => {
        const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
        return events.filter(event => event.start.startsWith(dateStr));
    };

    const eventTypeColors = {
        lesson: 'bg-blue-100 text-blue-700 border-blue-300',
        homework: 'bg-green-100 text-green-700 border-green-300',
        exam: 'bg-red-100 text-red-700 border-red-300',
        event: 'bg-purple-100 text-purple-700 border-purple-300',
        evaluation: 'bg-orange-100 text-orange-700 border-orange-300'
    };

    const handleOpenNewEvent = () => {
        setEditingEvent(null);
        setTitle('');
        setDescription('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setStartTime('09:00');
        setEndTime('10:00');
        setEventType('lesson');
        setIsEventModalOpen(true);
    };

    const handleEditEvent = (event: Event) => {
        setEditingEvent(event);
        setTitle(event.title);
        setDescription(event.description);
        setStartDate(event.start.split('T')[0]);
        setStartTime(new Date(event.start).toTimeString().slice(0, 5));
        setEndTime(new Date(event.end).toTimeString().slice(0, 5));
        setEventType(event.type);
        setIsEventModalOpen(true);
    };

    const handleSaveEvent = () => {
        if (!title || !startDate || !startTime || !endTime) return;

        const start = new Date(`${startDate}T${startTime}:00`).toISOString();
        const end = new Date(`${startDate}T${endTime}:00`).toISOString();

        if (editingEvent) {
            updateEvent(editingEvent.id, {
                title,
                description,
                start,
                end,
                type: eventType
            });
        } else {
            addEvent({
                title,
                description,
                start,
                end,
                type: eventType,
                classId: 'c1'
            });
        }

        setIsEventModalOpen(false);
    };

    const handleDeleteEvent = () => {
        if (editingEvent) {
            deleteEvent(editingEvent.id);
            setIsEventModalOpen(false);
        }
    };

    const upcomingEvents = events
        .filter(e => new Date(e.start) >= new Date())
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 10);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">{t('calendar.title')}</h1>
                <div className="flex gap-3">
                    <Button
                        variant={view === 'month' ? 'primary' : 'secondary'}
                        onClick={() => setView('month')}
                        icon={CalendarIcon}
                    >
                        {t('calendar.month')}
                    </Button>
                    <Button
                        variant={view === 'upcoming' ? 'primary' : 'secondary'}
                        onClick={() => setView('upcoming')}
                        icon={Clock}
                    >
                        {t('calendar.upcoming')}
                    </Button>
                    <Button
                        variant={view === 'schedule' ? 'primary' : 'secondary'}
                        onClick={() => setView('schedule')}
                        icon={BookOpen}
                    >
                        {t('calendar.schedule')}
                    </Button>
                    <Button variant="primary" icon={Plus} onClick={handleOpenNewEvent}>
                        {t('calendar.newEvent')}
                    </Button>
                </div>
            </div>

            {view === 'schedule' ? (
                <Schedule />
            ) : view === 'month' ? (
                <Card>
                    {/* Month Navigation */}
                    <div className="flex justify-between items-center mb-6 p-4 border-b">
                        <h2 className="text-xl font-bold">
                            {currentDate.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                icon={ChevronLeft}
                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                            />
                            <Button
                                variant="secondary"
                                icon={ChevronRight}
                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                            />
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2 p-4">
                        {[t('calendar.days.sun'), t('calendar.days.mon'), t('calendar.days.tue'), t('calendar.days.wed'), t('calendar.days.thu'), t('calendar.days.fri'), t('calendar.days.sat')].map(day => (
                            <div key={day} className="text-center font-semibold text-sm text-gray-600 pb-2">
                                {day}
                            </div>
                        ))}

                        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-24" />
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dayEvents = getEventsForDay(day);
                            const isToday = day === new Date().getDate() &&
                                currentDate.getMonth() === new Date().getMonth() &&
                                currentDate.getFullYear() === new Date().getFullYear();

                            return (
                                <div
                                    key={day}
                                    className={`min-h-24 p-2 rounded-lg border ${isToday ? 'bg-orange-50 border-orange-300' : 'bg-white border-gray-200'
                                        } hover:shadow-md transition-shadow`}
                                >
                                    <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-orange-600' : 'text-gray-700'}`}>
                                        {day}
                                    </div>
                                    <div className="space-y-1">
                                        {dayEvents.slice(0, 2).map(event => (
                                            <div
                                                key={event.id}
                                                className={`text-xs px-2 py-1 rounded border cursor-pointer hover:scale-105 transition-transform ${eventTypeColors[event.type]}`}
                                                onClick={() => handleEditEvent(event)}
                                            >
                                                {event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div className="text-xs text-gray-500">+{dayEvents.length - 2} {t('calendar.more')}</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            ) : (
                <Card>
                    <h2 className="text-xl font-bold mb-4 p-4 border-b">{t('calendar.upcomingEvents')}</h2>
                    <div className="divide-y">
                        {upcomingEvents.map(event => (
                            <div
                                key={event.id}
                                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => handleEditEvent(event)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`px-3 py-1 rounded-lg text-sm font-medium ${eventTypeColors[event.type]}`}>
                                        {event.type}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900">{event.title}</h3>
                                        <p className="text-sm text-gray-600">{event.description}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <CalendarIcon size={14} />
                                                {new Date(event.start).toLocaleDateString('fr-FR')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {new Date(event.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                {' - '}
                                                {new Date(event.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Event Modal */}
            <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {editingEvent ? t('calendar.editEvent') : t('calendar.newEvent')}
                        </h2>
                        <button onClick={() => setIsEventModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <Input
                            label={t('calendar.title_field')}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('calendar.titlePlaceholder')}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('calendar.description')}</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                                placeholder={t('calendar.descriptionPlaceholder')}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('calendar.type')}</label>
                            <select
                                value={eventType}
                                onChange={(e) => setEventType(e.target.value as any)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                            >
                                <option value="lesson">{t('calendar.lesson')}</option>
                                <option value="homework">{t('calendar.homework')}</option>
                                <option value="exam">{t('calendar.exam')}</option>
                                <option value="evaluation">{t('grades.evaluation')}</option>
                                <option value="event">{t('calendar.event')}</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <Input
                                label={t('calendar.date')}
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <Input
                                label={t('calendar.start')}
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                            <Input
                                label={t('calendar.end')}
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-between gap-3 pt-4">
                            {editingEvent && (
                                <Button variant="danger" onClick={handleDeleteEvent}>
                                    {t('common.delete')}
                                </Button>
                            )}
                            <div className="flex gap-3 ml-auto">
                                <Button variant="secondary" onClick={() => setIsEventModalOpen(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button variant="primary" onClick={handleSaveEvent}>
                                    {editingEvent ? t('common.save') : t('common.create')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Calendar;
