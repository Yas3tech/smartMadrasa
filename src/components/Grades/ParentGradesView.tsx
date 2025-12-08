import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../UI';
import {
    FileText,
    GraduationCap,
    Clock
} from 'lucide-react';
import GradeCard from './GradeCard';
import { useGradeStats } from '../../hooks/useGradeStats';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

const ParentGradesView = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { students, grades } = useData();
    const { calculateStudentStats } = useGradeStats();

    const [selectedChildId, setSelectedChildId] = useState('');

    if (!user) return null;

    const children = students.filter(s => s.parentId === user.id);
    const activeChildId = selectedChildId || (children.length > 0 ? children[0].id : '');
    const activeChild = children.find(c => c.id === activeChildId);
    const stats = activeChild ? calculateStudentStats(activeChild.id) : null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">{t('grades.schoolReports')}</h1>
                {children.length > 1 && (
                    <select
                        value={activeChildId}
                        onChange={(e) => setSelectedChildId(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-gray-200 outline-none"
                    >
                        {children.map(child => (
                            <option key={child.id} value={child.id}>{child.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {stats && activeChild && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <GraduationCap className="text-orange-600" />
                                <h3 className="font-bold text-gray-900">{t('grades.generalAverage')}</h3>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stats.avgGrade}%</p>
                        </Card>
                        <Card className="p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="text-blue-600" />
                                <h3 className="font-bold text-gray-900">{t('grades.attendanceRate')}</h3>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stats.attendanceRate}%</p>
                        </Card>
                        <Card className="p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <FileText className="text-green-600" />
                                <h3 className="font-bold text-gray-900">{t('grades.totalGrades')}</h3>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stats.totalGrades}</p>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {grades
                            .filter(g => g.studentId === activeChildId)
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(grade => (
                                <GradeCard key={grade.id} grade={grade} />
                            ))
                        }
                    </div>
                </>
            )}
        </div>
    );
};

export default ParentGradesView;
