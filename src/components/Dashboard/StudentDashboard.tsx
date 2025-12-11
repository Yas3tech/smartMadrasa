import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '../UI';
import {
    FileText, Calendar as CalendarIcon,
    MessageSquare, BookOpen
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import type { User, Grade, Homework, Event } from '../../types';

interface StudentDashboardProps {
    user: User;
    selectedChild: User | null;
    parentChildren: User[];
    setSelectedChildId: (id: string) => void;
    myGrades: Grade[];
    myAvg: string | number;
    mySubjectPerformance: any[];
    pendingHomeworks: Homework[];
    upcomingEvents: Event[];
    unreadMessages: number;
    childClass?: { name: string };
    onOpenHomework: (homework: Homework) => void;
}

export function StudentDashboard({
    user, selectedChild, parentChildren, setSelectedChildId,
    myGrades, myAvg, mySubjectPerformance, pendingHomeworks,
    upcomingEvents, unreadMessages, childClass, onOpenHomework
}: StudentDashboardProps) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isParent = user.role === 'parent';

    return (
        <div className="space-y-6">
            {/* Parent Child Selector */}
            {isParent && parentChildren.length > 1 && (
                <Card className="p-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-sm font-medium text-gray-700">{t('dashboard.parent.selectChild')}:</span>
                        <div className="flex gap-2 flex-wrap">
                            {parentChildren.map(child => (
                                <button
                                    key={child.id}
                                    onClick={() => setSelectedChildId(child.id)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${child.id === selectedChild?.id
                                        ? 'bg-orange-500 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {child.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>
            )}

            {/* Show selected child info for parent */}
            {isParent && selectedChild && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl">
                        {selectedChild.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{selectedChild.name}</h3>
                        <p className="text-sm text-gray-600">{childClass?.name || t('profile.notAssigned')}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Performance Chart */}
                    <Card className="p-6">

                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={mySubjectPerformance}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="subject" stroke="#6b7280" fontSize={12} />
                                <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                                <Tooltip />
                                <Bar dataKey="average" fill="#f97316" radius={[8, 8, 0, 0]} name={t('dashboard.charts.average')} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">{t('dashboard.student.recentGrades')}</h2>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/grades')}>
                                {t('dashboard.student.viewAll')}
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {myGrades.slice(0, 5).map(grade => {
                                const percentage = (grade.score / grade.maxScore) * 100;
                                const color = percentage >= 80 ? 'green' : percentage >= 60 ? 'orange' : 'red';
                                return (
                                    <div key={grade.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">{grade.subject}</h4>
                                            <p className="text-sm text-gray-500">{new Date(grade.date).toLocaleDateString(i18n.language)}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-2xl font-bold text-${color}-600`}>{grade.score}/{grade.maxScore}</span>
                                            <p className={`text-sm text-${color}-600 font-semibold`}>{percentage.toFixed(0)}%</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Pending Homeworks */}
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">{t('homework.title')}</h2>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/homework')}>
                                {t('dashboard.student.viewAll')}
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {pendingHomeworks.length > 0 ? pendingHomeworks.map(hw => {
                                const dueDate = new Date(hw.dueDate);
                                const daysLeft = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                const isUrgent = daysLeft <= 2;
                                return (
                                    <div
                                        key={hw.id}
                                        className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all hover:shadow-md ${isUrgent ? 'bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-400' : 'bg-gradient-to-r from-gray-50 to-orange-50'}`}
                                        onClick={() => onOpenHomework(hw)}
                                    >
                                        <FileText className={`flex-shrink-0 ${isUrgent ? 'text-red-500' : 'text-orange-500'}`} size={20} />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 truncate">{hw.title}</h4>
                                            <p className="text-xs text-gray-500">{hw.subject}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <Badge variant={isUrgent ? 'error' : 'warning'}>
                                                {daysLeft === 0 ? t('homework.dueToday') : t('homework.daysRemaining', { count: daysLeft })}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-8">
                                    <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                                    <p className="text-gray-500">{t('homework.noHomework')}</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex justify-end items-center mb-6">
                            <Button variant="ghost" size="sm" onClick={() => navigate('/schedule')}>
                                {t('schedule.title')}
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {upcomingEvents.slice(0, 4).map(event => (
                                <div
                                    key={event.id}
                                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-orange-50 rounded-lg hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => navigate('/schedule')}
                                >
                                    <CalendarIcon className="text-orange-500 flex-shrink-0" size={18} />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm text-gray-900 truncate">{event.title}</h4>
                                        <p className="text-xs text-gray-500">
                                            {new Date(event.start).toLocaleDateString(i18n.language)} à {new Date(event.start).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <Badge variant={event.type === 'exam' ? 'error' : 'info'} className="flex-shrink-0">
                                        {event.type === 'exam' ? t('grades.exam') : event.type === 'homework' ? t('grades.homework') : t('events.other')}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-6 bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 border-orange-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full -mr-16 -mt-16 opacity-30"></div>
                        <div className="relative">

                            <p className="text-4xl font-bold text-gray-900 mb-2">{myAvg}%</p>
                            <p className="text-sm text-gray-600">
                                {Number(myAvg) >= 80 ? t('dashboard.student.excellent') : Number(myAvg) >= 60 ? t('dashboard.student.good') : t('dashboard.student.needsImprovement')}
                            </p>
                        </div>
                    </Card>

                    {unreadMessages > 0 && (
                        <Card className="p-6 cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1" onClick={() => navigate('/messages')}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-orange-50 rounded-lg">
                                    <MessageSquare className="text-orange-500" size={20} />
                                </div>
                                <h3 className="font-bold text-gray-900">{t('messages.title')}</h3>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 mb-1">{unreadMessages}</p>
                            <p className="text-sm text-gray-600">{t('dashboard.dailySummary.unreadMessages')}</p>
                        </Card>
                    )}

                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white rounded-lg">
                                <BookOpen className="text-blue-600" size={20} />
                            </div>
                            <h3 className="font-bold text-gray-900">{t('dashboard.studyTip.title')}</h3>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            "{t('dashboard.studyTip.quote')}"
                        </p>
                        <p className="text-xs text-gray-500 mt-2">- Robert Collier</p>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;
