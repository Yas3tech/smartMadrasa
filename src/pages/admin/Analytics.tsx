import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, Button } from '../../components/UI';
import {
    TrendingUp,
    TrendingDown,
    Users,
    GraduationCap,
    Clock,
    BarChart3,
    Calendar,
    Download
} from 'lucide-react';

const Analytics = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { students, grades, attendance, users } = useData();
    const isRTL = i18n.language === 'ar';

    if (user?.role !== 'director' && user?.role !== 'superadmin') {
        return (
            <div className="flex items-center justify-center h-96">
                <Card className="p-8 text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{t('analytics.restrictedAccess')}</h2>
                    <p className="text-gray-600">{t('analytics.restrictedAccessDesc')}</p>
                </Card>
            </div>
        );
    }

    // Calculate statistics
    const teachers = users.filter(u => u.role === 'teacher');
    const todayDate = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === todayDate);
    const presentCount = todayAttendance.filter(a => a.status === 'present').length;
    const attendanceRate = students.length > 0 ? ((presentCount / students.length) * 100).toFixed(0) : 0;

    const avgGrade = grades.length > 0
        ? (grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / grades.length).toFixed(1)
        : 0;

    // Grade distribution
    const gradeDistribution = {
        excellent: grades.filter(g => (g.score / g.maxScore) * 100 >= 80).length,
        good: grades.filter(g => {
            const pct = (g.score / g.maxScore) * 100;
            return pct >= 60 && pct < 80;
        }).length,
        average: grades.filter(g => {
            const pct = (g.score / g.maxScore) * 100;
            return pct >= 40 && pct < 60;
        }).length,
        poor: grades.filter(g => (g.score / g.maxScore) * 100 < 40).length
    };

    // Attendance trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
    }).reverse();

    const attendanceTrend = last7Days.map(date => {
        const dayAttendance = attendance.filter(a => a.date === date);
        const present = dayAttendance.filter(a => a.status === 'present').length;
        const rate = dayAttendance.length > 0 ? (present / dayAttendance.length) * 100 : 0;
        const locale = i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'nl' ? 'nl-NL' : 'fr-FR';
        return {
            date,
            rate: rate.toFixed(0),
            label: new Date(date).toLocaleDateString(locale, { weekday: 'short' })
        };
    });

    return (
        <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('analytics.title')}</h1>
                    <p className="text-gray-600">{t('analytics.subtitle')}</p>
                </div>
                <Button variant="primary" icon={Download}>
                    {t('analytics.exportReport')}
                </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <Users className="text-blue-600" size={28} />
                        </div>
                        <TrendingUp className="text-blue-600" size={20} />
                    </div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">{t('analytics.totalStudents')}</h3>
                    <p className="text-3xl font-bold text-gray-900">{students.length}</p>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <GraduationCap className="text-orange-600" size={28} />
                        </div>
                        <TrendingUp className="text-orange-600" size={20} />
                    </div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">{t('analytics.generalAverage')}</h3>
                    <p className="text-3xl font-bold text-gray-900">{avgGrade}%</p>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <Clock className="text-green-600" size={28} />
                        </div>
                        {Number(attendanceRate) >= 90 ? (
                            <TrendingUp className="text-green-600" size={20} />
                        ) : (
                            <TrendingDown className="text-red-600" size={20} />
                        )}
                    </div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">{t('analytics.attendanceToday')}</h3>
                    <p className="text-3xl font-bold text-gray-900">{attendanceRate}%</p>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <GraduationCap className="text-purple-600" size={28} />
                        </div>
                        <TrendingUp className="text-purple-600" size={20} />
                    </div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">{t('analytics.teachers')}</h3>
                    <p className="text-3xl font-bold text-gray-900">{teachers.length}</p>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attendance Trend */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">{t('analytics.attendanceTrendTitle')}</h2>
                        <Calendar className="text-gray-400" size={20} />
                    </div>
                    <div className="space-y-3">
                        {attendanceTrend.map((day, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-gray-700">{day.label}</span>
                                    <span className="text-sm font-bold text-gray-900">{day.rate}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${Number(day.rate) >= 90 ? 'bg-green-500' :
                                            Number(day.rate) >= 70 ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}
                                        style={{ width: `${day.rate}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Grade Distribution */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">{t('analytics.gradeDistribution')}</h2>
                        <BarChart3 className="text-gray-400" size={20} />
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                            <div>
                                <p className="font-semibold text-green-900">{t('analytics.excellent')} (80-100%)</p>
                                <p className="text-sm text-green-600">{grades.length > 0 ? ((gradeDistribution.excellent / grades.length) * 100).toFixed(0) : 0}% {t('analytics.ofGrades')}</p>
                            </div>
                            <span className="text-3xl font-bold text-green-600">{gradeDistribution.excellent}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div>
                                <p className="font-semibold text-blue-900">{t('analytics.good')} (60-79%)</p>
                                <p className="text-sm text-blue-600">{grades.length > 0 ? ((gradeDistribution.good / grades.length) * 100).toFixed(0) : 0}% {t('analytics.ofGrades')}</p>
                            </div>
                            <span className="text-3xl font-bold text-blue-600">{gradeDistribution.good}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                            <div>
                                <p className="font-semibold text-yellow-900">{t('analytics.average')} (40-59%)</p>
                                <p className="text-sm text-yellow-600">{grades.length > 0 ? ((gradeDistribution.average / grades.length) * 100).toFixed(0) : 0}% {t('analytics.ofGrades')}</p>
                            </div>
                            <span className="text-3xl font-bold text-yellow-600">{gradeDistribution.average}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                            <div>
                                <p className="font-semibold text-red-900">{t('analytics.insufficient')} (&lt;40%)</p>
                                <p className="text-sm text-red-600">{grades.length > 0 ? ((gradeDistribution.poor / grades.length) * 100).toFixed(0) : 0}% {t('analytics.ofGrades')}</p>
                            </div>
                            <span className="text-3xl font-bold text-red-600">{gradeDistribution.poor}</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Subject Performance */}
            <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">{t('analytics.performanceBySubject')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {['Mathématiques', 'Français', 'Arabe', 'Sciences', 'Histoire'].map(subject => {
                        const subjectGrades = grades.filter(g => g.subject === subject);
                        const avg = subjectGrades.length > 0
                            ? (subjectGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / subjectGrades.length)
                            : 0;

                        return (
                            <div key={subject} className="p-4 bg-gray-50 rounded-xl">
                                <h3 className="font-semibold text-gray-900 mb-3">{subject}</h3>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-3xl font-bold text-gray-900">{avg.toFixed(1)}%</p>
                                        <p className="text-sm text-gray-500">{subjectGrades.length} {t('analytics.grades')}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${avg >= 80 ? 'bg-green-100 text-green-700' :
                                        avg >= 60 ? 'bg-blue-100 text-blue-700' :
                                            'bg-orange-100 text-orange-700'
                                        }`}>
                                        {avg >= 80 ? t('analytics.excellent') : avg >= 60 ? t('analytics.good') : t('analytics.average')}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                    <h3 className="font-bold text-gray-900 mb-4">{t('analytics.topPerformers')}</h3>
                    <div className="space-y-3">
                        {students
                            .map(s => ({
                                student: s,
                                avg: grades.filter(g => g.studentId === s.id).reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / grades.filter(g => g.studentId === s.id).length || 0
                            }))
                            .sort((a, b) => b.avg - a.avg)
                            .slice(0, 5)
                            .map(({ student, avg }) => (
                                <div key={student.id} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">{student.name}</span>
                                    <span className="font-bold text-green-600">{avg.toFixed(1)}%</span>
                                </div>
                            ))}
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="font-bold text-gray-900 mb-4">{t('analytics.keyInsights')}</h3>
                    <div className="space-y-3 text-sm">
                        <p className="text-gray-700">
                            <span className="font-semibold text-green-600">{gradeDistribution.excellent}</span> {t('analytics.studentsExcellent')}
                        </p>
                        <p className="text-gray-700">
                            {t('analytics.avgAttendanceRate')}: <span className="font-semibold">{attendanceRate}%</span>
                        </p>
                        <p className="text-gray-700">
                            <span className="font-semibold">{grades.length}</span> {t('analytics.gradesThisQuarter')}
                        </p>
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
                    <h3 className="font-bold text-gray-900 mb-4">{t('analytics.recommendedActions')}</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                        <p>• {t('analytics.action1')}</p>
                        <p>• {t('analytics.action2')}</p>
                        <p>• {t('analytics.action3')}</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Analytics;
