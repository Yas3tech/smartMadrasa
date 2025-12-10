import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../UI';
import {
    FileText,
    BarChart3,
    GraduationCap,
    Clock
} from 'lucide-react';
import GradeCard from './GradeCard';
import { useGradeStats } from '../../hooks/useGradeStats';

import type { Grade } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

const StudentGradesView = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { grades, courses, users } = useData();
    const { calculateStudentStats } = useGradeStats();

    const [selectedSubject, setSelectedSubject] = useState('all');

    if (!user) return null;

    const stats = calculateStudentStats(user.id);

    // Derive available subjects
    const availableSubjects = [...new Set(grades
        .filter(g => g.studentId === user.id)
        .map(g => g.subject)
    )].sort();

    const myGrades = grades
        .filter(g => g.studentId === user.id)
        .filter(g => selectedSubject === 'all' || g.subject === selectedSubject)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getTeacherName = (grade: Grade) => {
        if (grade.teacherId) {
            const teacher = users.find(u => u.id === grade.teacherId);
            if (teacher) return teacher.name;
        }
        const course = courses.find(c => c.classId === grade.classId && c.subject === grade.subject);
        return course?.teacherName;
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('grades.myGrades')}</h1>
                    <p className="text-gray-600">{t('grades.academicReport')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white rounded-lg">
                            <GraduationCap className="text-orange-600" size={24} />
                        </div>
                        <h3 className="font-bold text-gray-900">{t('grades.generalAverage')}</h3>
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">{stats.avgGrade}%</p>
                    <div className="flex items-center gap-1 text-sm">
                        {stats.avgGrade >= 80 ? <span className="text-green-600 font-medium">{t('grades.excellent')}</span> :
                            stats.avgGrade >= 60 ? <span className="text-blue-600 font-medium">{t('grades.good')}</span> :
                                <span className="text-orange-600 font-medium">{t('grades.needsImprovement')}</span>}
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white rounded-lg">
                            <Clock className="text-blue-600" size={24} />
                        </div>
                        <h3 className="font-bold text-gray-900">{t('grades.attendanceRate')}</h3>
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">{stats.attendanceRate}%</p>
                    <div className="flex items-center gap-1 text-sm text-blue-700">
                        <Clock size={16} />
                        <span>{t('grades.globalAttendance')}</span>
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white rounded-lg">
                            <BarChart3 className="text-green-600" size={24} />
                        </div>
                        <h3 className="font-bold text-gray-900">{t('grades.evaluations')}</h3>
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-2">{stats.totalGrades}</p>
                    <div className="flex items-center gap-1 text-sm text-green-700">
                        <FileText size={16} />
                        <span>{t('grades.totalGrades')}</span>
                    </div>
                </Card>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setSelectedSubject('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${selectedSubject === 'all'
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    {t('common.all')}
                </button>
                {availableSubjects.map(subject => (
                    <button
                        key={subject}
                        onClick={() => setSelectedSubject(subject)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${selectedSubject === subject
                            ? 'bg-orange-500 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {t(`subjects.${subject}`, subject)}
                    </button>
                ))}
            </div>

            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">{t('grades.recentResults')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myGrades.map(grade => (
                        <GradeCard
                            key={grade.id}
                            grade={grade}
                            teacherName={getTeacherName(grade)}
                        />
                    ))}
                    {myGrades.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-gray-100">
                            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                            <p>{t('grades.noGradesYet')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentGradesView;
