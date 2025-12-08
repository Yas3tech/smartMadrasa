import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Button, Badge } from '../../components/UI';
import {
    Users,
    GraduationCap,
    Clock,
    TrendingUp,
    AlertCircle,
    BookOpen,
    CheckCircle2,
    MessageSquare,
    Calendar as CalendarIcon,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3
} from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

const Dashboard = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { students, users, grades, attendance, messages, events } = useData();
    const navigate = useNavigate();

    if (!user) return null;

    // Calculate real stats
    const teachers = users.filter(u => u.role === 'teacher');
    const todayDate = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === todayDate);
    const presentCount = todayAttendance.filter(a => a.status === 'present').length;
    const attendanceRate = students.length > 0 ? ((presentCount / students.length) * 100).toFixed(0) : 0;

    const allGrades = grades.filter(g => g.score > 0);
    const avgGrade = allGrades.length > 0
        ? (allGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / allGrades.length).toFixed(1)
        : 0;

    const unreadMessages = messages.filter(m => m.receiverId === user.id && !m.read).length;

    const upcomingEvents = events
        .filter(e => new Date(e.start) >= new Date())
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 3);

    // Prepare chart data
    const getWeeklyAttendanceData = () => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date.toISOString().split('T')[0];
        });

        return last7Days.map(date => {
            const dayAttendance = attendance.filter(a => a.date === date);
            const present = dayAttendance.filter(a => a.status === 'present').length;
            const absent = dayAttendance.filter(a => a.status === 'absent').length;
            const late = dayAttendance.filter(a => a.status === 'late').length;

            return {
                date: new Date(date).toLocaleDateString(i18n.language, { weekday: 'short' }),
                present,
                absent,
                late,
                rate: dayAttendance.length > 0 ? ((present / dayAttendance.length) * 100).toFixed(0) : 0
            };
        });
    };

    const getGradeDistributionData = () => {
        const ranges = [
            { name: '0-50%', min: 0, max: 50, count: 0 },
            { name: '50-60%', min: 50, max: 60, count: 0 },
            { name: '60-70%', min: 60, max: 70, count: 0 },
            { name: '70-80%', min: 70, max: 80, count: 0 },
            { name: '80-90%', min: 80, max: 90, count: 0 },
            { name: '90-100%', min: 90, max: 100, count: 0 }
        ];

        grades.forEach(grade => {
            const percentage = (grade.score / grade.maxScore) * 100;
            const range = ranges.find(r => percentage >= r.min && percentage < r.max);
            if (range) range.count++;
        });

        return ranges.filter(r => r.count > 0);
    };

    const getSubjectPerformanceData = () => {
        const subjects = [...new Set(grades.map(g => g.subject))];
        return subjects.map(subject => {
            const subjectGrades = grades.filter(g => g.subject === subject);
            const avg = subjectGrades.length > 0
                ? (subjectGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / subjectGrades.length)
                : 0;
            return {
                subject,
                average: parseFloat(avg.toFixed(1)),
                count: subjectGrades.length
            };
        });
    };

    const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    interface StatCardProps {
        title: string;
        value: number | string;
        icon: React.ElementType;
        trend?: 'up' | 'down';
        trendValue?: string;
        color: string;
        onClick?: () => void;
    }

    const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, onClick }: StatCardProps) => (
        <Card
            className={`p-6 border-l-4 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 ${color}`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${color.split('-')[1]}-50 rounded-xl`}>
                    <Icon size={24} className={`text-${color.split('-')[1]}-600`} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        <span className="text-sm font-semibold">{trendValue}</span>
                    </div>
                )}
            </div>
            <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </Card>
    );

    const renderDirectorStats = () => (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title={t('dashboard.stats.totalStudents')}
                    value={students.length}
                    icon={Users}
                    color="border-l-blue-500"
                    trend="up"
                    trendValue="+5%"
                    onClick={() => navigate('/users')}
                />
                <StatCard
                    title={t('dashboard.stats.totalTeachers')}
                    value={teachers.length}
                    icon={GraduationCap}
                    color="border-l-orange-500"
                    onClick={() => navigate('/users')}
                />
                <StatCard
                    title={t('dashboard.stats.attendanceToday')}
                    value={`${attendanceRate}%`}
                    icon={CheckCircle2}
                    color="border-l-green-500"
                    trend={Number(attendanceRate) >= 90 ? 'up' : 'down'}
                    trendValue={`${attendanceRate}%`}
                    onClick={() => navigate('/attendance')}
                />
                <StatCard
                    title={t('dashboard.stats.generalAverage')}
                    value={`${avgGrade}%`}
                    icon={TrendingUp}
                    color="border-l-purple-500"
                    trend={Number(avgGrade) >= 75 ? 'up' : 'down'}
                    trendValue={`${avgGrade}%`}
                    onClick={() => navigate('/grades')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Weekly Attendance Chart */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{t('dashboard.charts.weeklyAttendance')}</h2>
                            <p className="text-sm text-gray-500">{t('dashboard.charts.attendanceTrends')}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/analytics')}>
                            <BarChart3 size={18} className="mr-2" />
                            {t('dashboard.charts.viewAnalytics')}
                        </Button>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={getWeeklyAttendanceData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={3} name={t('attendance.present')} />
                            <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={3} name={t('attendance.absent')} />
                            <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={3} name={t('attendance.late')} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                {/* Grade Distribution */}
                <Card className="p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900">{t('dashboard.charts.gradeDistribution')}</h2>
                        <p className="text-sm text-gray-500">{t('dashboard.charts.performanceDistribution')}</p>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={getGradeDistributionData()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                            >
                                {getGradeDistributionData().map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Subject Performance */}
            <Card className="p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{t('dashboard.charts.subjectPerformance')}</h2>
                        <p className="text-sm text-gray-500">{t('dashboard.charts.averageScoreBySubject')}</p>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getSubjectPerformanceData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="subject" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                        <Legend />
                        <Bar dataKey="average" fill="#f97316" name={t('dashboard.charts.average') + " %"} radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </>
    );

    const renderTeacherView = () => (
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
                        <Button variant="ghost" size="sm" onClick={() => navigate('/calendar')}>
                            {t('dashboard.events.viewCalendar')}
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {upcomingEvents.length > 0 ? upcomingEvents.map((event) => (
                            <div
                                key={event.id}
                                className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl hover:shadow-md transition-all border border-gray-100 cursor-pointer"
                                onClick={() => navigate('/calendar')}
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
                        <Button className="w-full justify-start" variant="secondary" icon={CalendarIcon} onClick={() => navigate('/calendar')}>
                            <span>{t('dashboard.actions.addEvent')}</span>
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

    const renderStudentView = () => {
        const myGrades = grades.filter(g => g.studentId === user.id);
        const myAvg = myGrades.length > 0
            ? (myGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / myGrades.length).toFixed(1)
            : 0;

        const mySubjectPerformance = [...new Set(myGrades.map(g => g.subject))].map(subject => {
            const subjectGrades = myGrades.filter(g => g.subject === subject);
            const avg = subjectGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / subjectGrades.length;
            return {
                subject,
                average: parseFloat(avg.toFixed(1))
            };
        });

        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Performance Chart */}
                    <Card className="p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900">{t('dashboard.student.yourPerformance')}</h2>
                            <p className="text-sm text-gray-500">{t('dashboard.charts.averageScoreBySubject')}</p>
                        </div>
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

                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">{t('dashboard.events.upcoming')}</h2>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/calendar')}>
                                {t('dashboard.events.viewCalendar')}
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {upcomingEvents.slice(0, 4).map(event => (
                                <div
                                    key={event.id}
                                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-orange-50 rounded-lg hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => navigate('/calendar')}
                                >
                                    <CalendarIcon className="text-orange-500 flex-shrink-0" size={18} />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm text-gray-900 truncate">{event.title}</h4>
                                        <p className="text-xs text-gray-500">
                                            {new Date(event.start).toLocaleDateString(i18n.language)} à {new Date(event.start).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <Badge variant={event.type === 'exam' ? 'error' : 'info'} className="flex-shrink-0">
                                        {event.type === 'exam' ? t('grades.exam') : event.type === 'homework' ? t('grades.homework') : t('dashboard.events.other')}
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
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <TrendingUp className="text-orange-600" size={20} />
                                </div>
                                <h3 className="font-bold text-gray-900">{t('dashboard.student.yourAverage')}</h3>
                            </div>
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
        );
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">
                        {t('dashboard.header.welcome', { name: user.name.split(' ')[0] })}
                    </h1>
                    <p className="text-gray-600">{t('dashboard.header.subtitle')}</p>
                </div>
                <Badge variant="success" className="text-sm px-4 py-2">
                    <Clock size={14} className="mr-2" />
                    {new Date().toLocaleDateString(i18n.language, { weekday: 'long', month: 'short', day: 'numeric' })}
                </Badge>
            </div>

            {(user.role === 'director' || user.role === 'superadmin') && renderDirectorStats()}
            {user.role === 'teacher' && renderTeacherView()}
            {(user.role === 'student' || user.role === 'parent') && renderStudentView()}
        </div>
    );
};

export default Dashboard;
