import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../UI';
import {
    Download,
    Search,
    Upload,
    Clock,
    Pencil,
    X,
    Check,
    ChevronDown,
    Plus,
    GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';
import BulkGradeModal from './BulkGradeModal';
import GradeModal from './GradeModal';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useGradeStats } from '../../hooks/useGradeStats';
import { generateGradeReport } from '../../utils/gradeReports';
import type { Grade, Student } from '../../types';

const TeacherGradesView = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { students, classes, grades, addGrade, updateGrade, courses } = useData();
    const { calculateStudentStats } = useGradeStats();

    // Teacher States
    const [selectedClassId, setSelectedClassId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

    // Grade editing state
    const [editingGrade, setEditingGrade] = useState<{ id: string; studentId: string; score: number; maxScore: number } | null>(null);
    const [editValue, setEditValue] = useState('');

    // Derived Data
    const teacherClasses = useMemo(() => {
        if (user?.role === 'teacher') {
            return classes.filter(c => c.teacherId === user.id);
        }
        return classes;
    }, [classes, user]);

    const selectedClass = classes.find(c => c.id === selectedClassId);

    const filteredStudents = useMemo(() => {
        if (!selectedClassId) return [];
        return students.filter(s =>
            (s as Student).classId === selectedClassId &&
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [selectedClassId, students, searchTerm]);

    // Get subjects available in the selected class (from courses)
    const classSubjects = useMemo(() => {
        if (!selectedClassId) return [];
        const classCourses = courses.filter(c => c.classId === selectedClassId);
        return [...new Set(classCourses.map(c => c.subject))].sort();
    }, [courses, selectedClassId]);

    // Helper: Start editing
    const startEditingGrade = (grade: Grade) => {
        setEditingGrade({ id: grade.id, studentId: grade.studentId, score: grade.score, maxScore: grade.maxScore });
        setEditValue(grade.score.toString());
    };

    // Helper: Cancel editing
    const cancelEditing = () => {
        setEditingGrade(null);
        setEditValue('');
    };

    // Helper: Update Grade
    const handleUpdateGrade = async () => {
        if (!editingGrade) return;
        const newScore = parseFloat(editValue);
        if (isNaN(newScore) || newScore < 0 || newScore > editingGrade.maxScore) {
            toast.error(t('grades.invalidScore'));
            return;
        }
        try {
            await updateGrade(editingGrade.id, { score: newScore });
            toast.success(t('grades.gradeUpdated'));
            setEditingGrade(null);
            setEditValue('');
        } catch {
            toast.error(t('grades.errorUpdating'));
        }
    };

    // Helper: Add Individual Grade (Modal)
    const handleIndividualGradeSave = async (gradeData: Omit<Grade, 'id'>) => {
        try {
            await addGrade({
                ...gradeData,
                teacherId: user?.id || '',
                classId: selectedClassId,
                courseId: courses.find(c => c.subject === gradeData.subject && c.classId === selectedClassId)?.id
            });
            toast.success(t('grades.gradeAdded'));
            setIsGradeModalOpen(false);
        } catch {
            toast.error(t('grades.saveError'));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('grades.management')}</h1>
                    <p className="text-gray-500">{t('grades.teacherSubtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        icon={Upload}
                        onClick={() => setIsBulkModalOpen(true)}
                        disabled={!selectedClassId}
                    >
                        {t('grades.bulkEntry')}
                    </Button>
                    <Button
                        variant="primary"
                        icon={Plus}
                        onClick={() => setIsGradeModalOpen(true)}
                        disabled={!selectedClassId}
                    >
                        {t('grades.addGrade')}
                    </Button>
                </div>
            </div>

            {/* Class Selector */}
            {teacherClasses.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {teacherClasses.map(cls => (
                        <button
                            key={cls.id}
                            onClick={() => setSelectedClassId(cls.id)}
                            className={`p-4 rounded-xl border transition-all min-w-[200px] text-left shrink-0 ${selectedClassId === cls.id
                                ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500'
                                : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/50'
                                }`}
                        >
                            <div className="font-bold text-gray-900">{cls.name}</div>
                            <div className="text-sm text-gray-500">{cls.grade}</div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-gray-500">{t('grades.noClassesAssigned')}</p>
                </div>
            )}

            {/* Main Content */}
            {selectedClassId ? (
                <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder={t('common.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>

                    {/* Students List */}
                    <div className="grid grid-cols-1 gap-4">
                        {filteredStudents.map(student => {
                            const stats = calculateStudentStats(student.id);
                            const isExpanded = expandedStudentId === student.id;

                            return (
                                <div key={student.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all hover:border-orange-200">
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer"
                                        onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{student.name}</div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="text-gray-500">{t('grades.average')}:</span>
                                                    <span className={`font-bold ${stats.avgGrade >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {stats.avgGrade}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Attendance Pill */}
                                            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm">
                                                <Clock size={16} />
                                                <span>{stats.attendanceRate}%</span>
                                            </div>

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                icon={Download}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    generateGradeReport(student, grades, stats, t, i18n.language);
                                                }}
                                            />

                                            <ChevronDown size={20} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-100 bg-gray-50 p-4">
                                            <div className="mb-4 flex justify-between items-center">
                                                <h4 className="font-bold text-gray-900">{t('grades.history')}</h4>
                                            </div>

                                            <div className="space-y-2">
                                                {grades
                                                    .filter(g => g.studentId === student.id)
                                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                    .map(grade => (
                                                        <div key={grade.id} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center">
                                                            <div>
                                                                <div className="font-medium text-gray-900">{grade.subject}</div>
                                                                <div className="text-xs text-gray-500">
                                                                    {new Date(grade.date).toLocaleDateString()} • {grade.type || 'evaluation'}
                                                                </div>
                                                            </div>

                                                            {editingGrade?.id === grade.id ? (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="number"
                                                                        value={editValue}
                                                                        onChange={(e) => setEditValue(e.target.value)}
                                                                        className="w-16 text-center border border-orange-300 rounded p-1 outline-none focus:ring-2 focus:ring-orange-200"
                                                                        autoFocus
                                                                    />
                                                                    <button onClick={handleUpdateGrade} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16} /></button>
                                                                    <button onClick={cancelEditing} className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={16} /></button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => startEditingGrade(grade)}
                                                                    className="flex items-center gap-2 group"
                                                                    title={t('grades.clickToEdit')}
                                                                >
                                                                    <span className={`font-bold ${(grade.score / grade.maxScore) >= 0.5 ? 'text-green-600' : 'text-red-600'
                                                                        }`}>
                                                                        {grade.score}/{grade.maxScore}
                                                                    </span>
                                                                    <Pencil size={12} className="text-gray-300 group-hover:text-orange-500" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))
                                                }
                                                {grades.filter(g => g.studentId === student.id).length === 0 && (
                                                    <p className="text-center text-gray-500 py-4">{t('grades.noGradesYet')}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="p-4 bg-white rounded-full mb-4 shadow-sm">
                        <GraduationCap className="text-orange-500" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{t('grades.selectClassPrompt')}</h3>
                    <p className="text-gray-500 max-w-md">
                        {t('grades.selectClassDesc')}
                    </p>
                </div>
            )}

            {/* Modals */}
            {isBulkModalOpen && selectedClass && (
                <BulkGradeModal
                    isOpen={isBulkModalOpen}
                    onClose={() => setIsBulkModalOpen(false)}
                    className={selectedClass.name}
                    students={filteredStudents}
                    availableSubjects={classSubjects}
                    onSave={async (gradesData) => {
                        try {
                            await Promise.all(
                                gradesData.map(grade => addGrade({
                                    ...grade,
                                    classId: selectedClassId,
                                    teacherId: user?.id || '',
                                    courseId: courses.find(c => c.subject === grade.subject && c.classId === selectedClassId)?.id || ''
                                }))
                            );
                            toast.success(t('grades.importSuccess'));
                            setIsBulkModalOpen(false);
                        } catch {
                            toast.error(t('grades.importError'));
                        }
                    }}
                />
            )}

            <GradeModal
                isOpen={isGradeModalOpen}
                onClose={() => setIsGradeModalOpen(false)}
                onSave={handleIndividualGradeSave}
                classId={selectedClassId}
                availableSubjects={classSubjects}
            />
        </div>
    );
};

export default TeacherGradesView;
