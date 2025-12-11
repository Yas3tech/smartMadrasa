import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../UI';
import { StatCard } from './StatCard';
import { Users, GraduationCap, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface DirectorDashboardProps {
    students: any[];
    teachers: any[];
    attendanceRate: string | number;
    avgGrade: string | number;
    getWeeklyAttendanceData: () => any[];
    getGradeDistributionData: () => any[];
    getSubjectPerformanceData: () => any[];
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export function DirectorDashboard({
    students, teachers, attendanceRate, avgGrade,
    getWeeklyAttendanceData, getGradeDistributionData, getSubjectPerformanceData
}: DirectorDashboardProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
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
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                            <Legend />
                            <Line type="monotone" dataKey="présents" stroke="#10b981" strokeWidth={3} name={t('attendance.present')} />
                            <Line type="monotone" dataKey="absents" stroke="#ef4444" strokeWidth={3} name={t('attendance.absent')} />
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
                                cx="50%" cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                outerRadius={80}
                                dataKey="value"
                            >
                                {getGradeDistributionData().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
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
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                        <Legend />
                        <Bar dataKey="moyenne" fill="#f97316" name={t('dashboard.charts.average') + " %"} radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </>
    );
}

export default DirectorDashboard;
