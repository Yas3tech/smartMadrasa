import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '../UI';
import {
    Calendar as CalendarIcon, CheckCircle2, TrendingUp,
    MessageSquare, BookOpen, AlertCircle
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import type { Event, Grade } from '../../types';

interface TeacherDashboardProps {
    students: any[];
    upcomingEvents: Event[];
    getWeeklyAttendanceData: () => any[];
    avgGrade: string | number;
    allGrades: Grade[];
    presentCount: number;
    unreadMessages: number;
}

export function TeacherDashboard({
    students, upcomingEvents, getWeeklyAttendanceData, avgGrade,
    allGrades, presentCount, unreadMessages
}: TeacherDashboardProps) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                {/* Attendance Chart */}
                <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{t('dashboard.charts.weeklyAttendance')}</h2>
                            <p className="text-sm text-gray-500">{t('dashboard.charts.attendanceTrends')}</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={getWeeklyAttendanceData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip />
                            <Bar dataKey="present" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name={t('attendance.present')} />
                            <Bar dataKey="late" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} name={t('attendance.late')} />
                            <Bar dataKey="absent" stackId="a" fill="#ef4444" radius={[8, 8, 0, 0]} name={t('attendance.absent')} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">{t('dashboard.events.upcoming')}</h2>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/schedule')}>
                            {t('schedule.title')}
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {upcomingEvents.length > 0 ? upcomingEvents.map((event) => (
                            <div
                                key={event.id}
                                className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl hover:shadow-md transition-all border border-gray-100 cursor-pointer"
                                onClick={() => navigate('/schedule')}
                            >
                                <div className="w-20 font-bold text-gray-900 text-sm">
                                    {new Date(event.start).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800">{event.title}</h4>
                                    <p className="text-sm text-gray-500">{event.description}</p>
                                </div>
                                <Badge variant={event.type === 'exam' ? 'error' : event.type === 'homework' ? 'warning' : 'info'}>
                                    {event.type === 'exam' ? t('grades.exam') : event.type === 'homework' ? t('grades.homework') : t('dashboard.events.other')}
                                </Badge>
                            </div>
                        )) : (
                            <div className="text-center py-12">
                                <CalendarIcon size={48} className="mx-auto mb-3 text-gray-300" />
                                <p className="text-gray-500">{t('dashboard.events.noEvents')}</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="p-6">
                    <h3 className="font-bold text-lg mb-4 text-gray-900">{t('dashboard.actions.title')}</h3>
                    <div className="space-y-3">
                        <Button className="w-full justify-start group" icon={CheckCircle2} onClick={() => navigate('/attendance')}>
                            <span>{t('dashboard.actions.takeAttendance')}</span>
                        </Button>
                        <Button className="w-full justify-start" variant="secondary" icon={BookOpen} onClick={() => navigate('/grades')}>
                            <span>{t('dashboard.actions.enterGrades')}</span>
                        </Button>
                        <Button className="w-full justify-start" variant="secondary" icon={MessageSquare} onClick={() => navigate('/messages')}>
                            <span>{t('dashboard.actions.sendMessage')}</span>
                        </Button>
                        <Button className="w-full justify-start" variant="secondary" icon={CalendarIcon} onClick={() => navigate('/schedule')}>
                            {t('schedule.title')}
                        </Button>
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 border-orange-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full -mr-16 -mt-16 opacity-30"></div>
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <TrendingUp className="text-orange-600" size={20} />
                            </div>
                            <h3 className="font-bold text-gray-900">{t('dashboard.stats.generalAverage')}</h3>
                        </div>
                        <p className="text-4xl font-bold text-gray-900 mb-2">{avgGrade}%</p>
                        <p className="text-sm text-gray-600">{t('dashboard.charts.performanceDistribution')}</p>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">{t('dashboard.dailySummary.title')}</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-blue-500/20 dark:bg-blue-500/30 rounded-lg">
                            <AlertCircle className="text-blue-600 dark:text-blue-400" size={20} />
                            <p className="text-sm text-gray-700 dark:text-slate-200">
                                <span className="font-semibold">{presentCount}/{students.length}</span> {t('dashboard.dailySummary.studentsPresent')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-green-500/20 dark:bg-green-500/30 rounded-lg">
                            <BookOpen className="text-green-600 dark:text-green-400" size={20} />
                            <p className="text-sm text-gray-700 dark:text-slate-200">
                                <span className="font-semibold">{allGrades.length}</span> {t('dashboard.dailySummary.gradesRecorded')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-orange-500/20 dark:bg-orange-500/30 rounded-lg">
                            <MessageSquare className="text-orange-600 dark:text-orange-400" size={20} />
                            <p className="text-sm text-gray-700 dark:text-slate-200">
                                <span className="font-semibold">{unreadMessages}</span> {t('dashboard.dailySummary.unreadMessages')}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
