import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '../UI';
import { StatCard } from './StatCard';
import {
  Users,
  GraduationCap,
  UserPlus,
  School,
  ClipboardCheck,
  BookOpen,
  MessageSquare,
  CalendarPlus,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Student, Teacher } from '../../types';

interface DirectorDashboardProps {
  students: Student[];
  teachers: Teacher[];
  attendanceRate: string | number;
  avgGrade: string | number;
  getWeeklyAttendanceData: () => { name: string; présents: number; absents: number }[];
  getGradeDistributionData: () => { name: string; value: number; color: string }[];
  getSubjectPerformanceData: () => { subject: string; moyenne: number }[];
import type { User } from '../../types';

interface DirectorDashboardProps {
  students: User[];
  teachers: User[];
  attendanceRate: string | number;
  avgGrade: string | number;
  weeklyAttendanceData: { name: string; présents: number; absents: number }[];
  gradeDistributionData: { name: string; value: number; color: string }[];
  subjectPerformanceData: { subject: string; moyenne: number }[];
  weeklyAttendanceData: any[];
  gradeDistributionData: any[];
  subjectPerformanceData: any[];
}

export function DirectorDashboard({
  students,
  teachers,
  weeklyAttendanceData,
}: DirectorDashboardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: UserPlus,
      label: t('actions.addStudent'),
      color: 'bg-blue-500',
      onClick: () => navigate('/users?action=add&role=student'),
    },
    {
      icon: GraduationCap,
      label: t('actions.addTeacher'),
      color: 'bg-orange-500',
      onClick: () => navigate('/users?action=add&role=teacher'),
    },
    {
      icon: School,
      label: t('actions.createClass'),
      color: 'bg-green-500',
      onClick: () => navigate('/classes?action=add'),
    },
    {
      icon: ClipboardCheck,
      label: t('actions.takeAttendance'),
      color: 'bg-purple-500',
      onClick: () => navigate('/attendance'),
    },
    {
      icon: BookOpen,
      label: t('actions.enterGrades'),
      color: 'bg-red-500',
      onClick: () => navigate('/grades'),
    },
    {
      icon: MessageSquare,
      label: t('actions.sendMessage'),
      color: 'bg-indigo-500',
      onClick: () => navigate('/messages?action=compose'),
    },
    {
      icon: CalendarPlus,
      label: t('actions.addEvent'),
      color: 'bg-pink-500',
      onClick: () => navigate('/announcements'),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard
          title={t('dashboard.stats.totalStudents')}
          value={students.length}
          icon={Users}
          color="border-l-blue-500"
          onClick={() => navigate('/users')}
        />
        <StatCard
          title={t('dashboard.stats.totalTeachers')}
          value={teachers.length}
          icon={GraduationCap}
          color="border-l-orange-500"
          onClick={() => navigate('/users')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Weekly Attendance Chart */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {t('dashboard.charts.weeklyAttendance')}
            </h2>
            <p className="text-sm text-gray-500">{t('dashboard.charts.attendanceTrends')}</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyAttendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="présents"
                stroke="#10b981"
                strokeWidth={3}
                name={t('attendance.present')}
              />
              <Line
                type="monotone"
                dataKey="absents"
                stroke="#ef4444"
                strokeWidth={3}
                name={t('attendance.absent')}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('actions.title')}</h2>
            <p className="text-sm text-gray-500">{t('dashboard.header.subtitle')}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div
                  className={`p-3 ${action.color} rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <action.icon size={20} />
                </div>
                <span className="text-sm font-medium text-gray-700 text-left">{action.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

export default DirectorDashboard;
