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
    const { user } = useAuth();
    const { students, grades, attendance, users } = useData();

    if (user?.role !== 'director' && user?.role !== 'superadmin') {
        return (
            <div className="flex items-center justify-center h-96">
                <Card className="p-8 text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Accès restreint</h2>
                    <p className="text-gray-600">Cette page est réservée aux directeurs et super-administrateurs.</p>
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
        return {
            date,
            rate: rate.toFixed(0),
            label: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' })
        };
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tableau de bord analytique</h1>
                    <p className="text-gray-600">Vue d'ensemble des performances de l'école</p>
                </div>
                <Button variant="primary" icon={Download}>
                    Exporter le rapport
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
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Total Élèves</h3>
                    <p className="text-3xl font-bold text-gray-900">{students.length}</p>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <GraduationCap className="text-orange-600" size={28} />
                        </div>
                        <TrendingUp className="text-orange-600" size={20} />
                    </div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Moyenne Générale</h3>
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
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Présence Aujourd'hui</h3>
                    <p className="text-3xl font-bold text-gray-900">{attendanceRate}%</p>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <GraduationCap className="text-purple-600" size={28} />
                        </div>
                        <TrendingUp className="text-purple-600" size={20} />
                    </div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Enseignants</h3>
                    <p className="text-3xl font-bold text-gray-900">{teachers.length}</p>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attendance Trend */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Tendance de présence (7 derniers jours)</h2>
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
                        <h2 className="text-xl font-bold text-gray-900">Distribution des notes</h2>
                        <BarChart3 className="text-gray-400" size={20} />
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                            <div>
                                <p className="font-semibold text-green-900">Excellent (80-100%)</p>
                                <p className="text-sm text-green-600">{((gradeDistribution.excellent / grades.length) * 100).toFixed(0)}% des notes</p>
                            </div>
                            <span className="text-3xl font-bold text-green-600">{gradeDistribution.excellent}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div>
                                <p className="font-semibold text-blue-900">Bien (60-79%)</p>
                                <p className="text-sm text-blue-600">{((gradeDistribution.good / grades.length) * 100).toFixed(0)}% des notes</p>
                            </div>
                            <span className="text-3xl font-bold text-blue-600">{gradeDistribution.good}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                            <div>
                                <p className="font-semibold text-yellow-900">Moyen (40-59%)</p>
                                <p className="text-sm text-yellow-600">{((gradeDistribution.average / grades.length) * 100).toFixed(0)}% des notes</p>
                            </div>
                            <span className="text-3xl font-bold text-yellow-600">{gradeDistribution.average}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                            <div>
                                <p className="font-semibold text-red-900">Insuffisant (\u003c40%)</p>
                                <p className="text-sm text-red-600">{((gradeDistribution.poor / grades.length) * 100).toFixed(0)}% des notes</p>
                            </div>
                            <span className="text-3xl font-bold text-red-600">{gradeDistribution.poor}</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Subject Performance */}
            <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Performance par matière</h2>
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
                                        <p className="text-sm text-gray-500">{subjectGrades.length} notes</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${avg >= 80 ? 'bg-green-100 text-green-700' :
                                            avg >= 60 ? 'bg-blue-100 text-blue-700' :
                                                'bg-orange-100 text-orange-700'
                                        }`}>
                                        {avg >= 80 ? 'Excellent' : avg >= 60 ? 'Bien' : 'Moyen'}
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
                    <h3 className="font-bold text-gray-900 mb-4">Top Performers</h3>
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
                    <h3 className="font-bold text-gray-900 mb-4">Insights clés</h3>
                    <div className="space-y-3 text-sm">
                        <p className="text-gray-700">
                            <span className="font-semibold text-green-600">{gradeDistribution.excellent}</span> élèves avec une moyenne excellente
                        </p>
                        <p className="text-gray-700">
                            Taux de présence moyen: <span className="font-semibold">{attendanceRate}%</span>
                        </p>
                        <p className="text-gray-700">
                            <span className="font-semibold">{grades.length}</span> notes enregistrées ce trimestre
                        </p>
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
                    <h3 className="font-bold text-gray-900 mb-4">Actions recommandées</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                        <p>• Planifier des sessions de rattrapage</p>
                        <p>• Contacter les parents d'élèves en difficulté</p>
                        <p>• Organiser une réunion pédagogique</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Analytics;
