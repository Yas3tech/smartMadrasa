import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../UI';
import {
    Download,
    Search,
    Upload,
    Pencil,
    X,
    Check,
    Plus,
    ArrowLeft,
    User,
    BookOpen,
    Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import BulkGradeModal from './BulkGradeModal';
import GradeModal from './GradeModal';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useGradeStats } from '../../hooks/useGradeStats';
import { generateGradeReport } from '../../utils/gradeReports';
import type { Grade, Student } from '../../types';

type ViewMode = 'byStudent' | 'bySubject' | null;

const TeacherGradesView = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { students, classes, grades, addGrade, updateGrade, courses } = useData();
    const { calculateStudentStats } = useGradeStats();

    // Navigation States
    const [selectedClassId, setSelectedClassId] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>(null);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);


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
    const selectedStudentData = students.find(s => s.id === selectedStudentId);

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

    // Get grades for selected student
    const studentGrades = useMemo(() => {
        if (!selectedStudentId) return [];
        return grades
            .filter(g => g.studentId === selectedStudentId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [grades, selectedStudentId]);

    // Get grades for selected subject
    const subjectGrades = useMemo(() => {
        if (!selectedSubject || !selectedClassId) return [];
        return grades.filter(g => {
            const student = students.find(s => s.id === g.studentId);
            return g.subject === selectedSubject && (student as Student)?.classId === selectedClassId;
        });
    }, [grades, selectedSubject, selectedClassId, students]);

    // Group subject grades by student
    const subjectGradesByStudent = useMemo(() => {
        const grouped: Record<string, Grade[]> = {};
        subjectGrades.forEach(grade => {
            if (!grouped[grade.studentId]) {
                grouped[grade.studentId] = [];
            }
            grouped[grade.studentId].push(grade);
        });
        return grouped;
    }, [subjectGrades]);

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

    // Navigation helpers
    const goBack = () => {
        if (selectedStudentId) {
            setSelectedStudentId('');
        } else if (selectedSubject) {
            setSelectedSubject('');
        } else if (viewMode) {
            setViewMode(null);
        } else if (selectedClassId) {
            setSelectedClassId('');
        }
    };

    const getCurrentStep = () => {
        if (!selectedClassId) return 1;
        if (!viewMode) return 2;
        return 3;
    };

    return (
        <div className="space-y-6">
            {/* Header - Always visible */}
            {/* Mobile Header */}
            <div className="lg:hidden -mx-4 -mt-6 bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-b-[2rem] shadow-lg mb-6 text-white">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BookOpen className="text-white/90" size={24} />
                        {t('grades.management')}
                    </h1>
                    <button
                        onClick={() => setIsBulkModalOpen(true)}
                        disabled={!selectedClassId}
                        className={`p-2 rounded-lg bg-orange-700/30 backdrop-blur-md border border-white/20 ${!selectedClassId ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 transition-transform'}`}
                    >
                        <Upload size={20} />
                    </button>
                </div>
                <p className="text-orange-100 text-sm mb-4 opacity-90">{t('grades.teacherSubtitle')}</p>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('grades.management')}</h1>
                    <p className="text-gray-500 dark:text-gray-400">{t('grades.teacherSubtitle')}</p>
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

            {/* Step 1: Select Class */}
            {getCurrentStep() === 1 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 dark:text-white">{t('grades.step1')}</h2>
                    {teacherClasses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {teacherClasses.map(cls => (
                                <button
                                    key={cls.id}
                                    onClick={() => setSelectedClassId(cls.id)}
                                    className="p-6 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-700 rounded-xl hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-all text-left flex items-center gap-4"
                                >
                                    <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-full text-orange-600 dark:text-orange-400">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">{cls.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{cls.grade}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-gray-50 dark:bg-slate-700 rounded-xl">
                            <p className="text-gray-500 dark:text-gray-400">{t('grades.noClassesAssigned')}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Choose View Mode */}
            {getCurrentStep() === 2 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <button
                            onClick={goBack}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-700 dark:text-gray-300"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-xl font-semibold dark:text-white">{t('grades.step2')}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedClass?.name}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* By Student */}
                        <button
                            onClick={() => setViewMode('byStudent')}
                            className="p-8 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all text-left"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-400">
                                    <User size={32} />
                                </div>
                                <h3 className="font-bold text-xl text-gray-800 dark:text-white">{t('grades.byStudent')}</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">{t('grades.byStudentDesc')}</p>
                        </button>

                        {/* By Subject */}
                        <button
                            onClick={() => setViewMode('bySubject')}
                            className="p-8 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-700 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 transition-all text-left"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-full text-green-600 dark:text-green-400">
                                    <BookOpen size={32} />
                                </div>
                                <h3 className="font-bold text-xl text-gray-800 dark:text-white">{t('grades.bySubject')}</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">{t('grades.bySubjectDesc')}</p>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: View by Student - Student List */}
            {getCurrentStep() === 3 && viewMode === 'byStudent' && !selectedStudentId && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <button
                            onClick={goBack}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-700 dark:text-gray-300"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-xl font-semibold dark:text-white">{t('grades.byStudent')}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedClass?.name}</p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder={t('grades.searchStudent')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>

                    {/* Students Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredStudents.map(student => {
                            const stats = calculateStudentStats(student.id);
                            const studentGradeCount = grades.filter(g => g.studentId === student.id).length;

                            return (
                                <button
                                    key={student.id}
                                    onClick={() => setSelectedStudentId(student.id)}
                                    className="p-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all text-left flex items-center gap-3"
                                >
                                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800 dark:text-white">{student.name}</p>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">{studentGradeCount} {t('grades.title').toLowerCase()}</span>
                                            <span className={`font-bold ${stats.avgGrade >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {stats.avgGrade}%
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 3: View by Student - Student Detail */}
            {getCurrentStep() === 3 && viewMode === 'byStudent' && selectedStudentId && (
                <div className="space-y-4">
                    {/* Student Header */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={goBack}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-700 dark:text-gray-300"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                                    {selectedStudentData?.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedStudentData?.name}</h2>
                                    <p className="text-gray-600 dark:text-gray-400">{selectedClass?.name}</p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                icon={Download}
                                onClick={() => {
                                    if (selectedStudentData) {
                                        const stats = calculateStudentStats(selectedStudentId);
                                        generateGradeReport(selectedStudentData, grades, stats, t, i18n.language);
                                    }
                                }}
                            >
                                {t('grades.downloadPDF')}
                            </Button>
                        </div>
                    </div>

                    {/* Student Grades List */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-4 dark:text-white">{t('grades.history')}</h3>
                        {studentGrades.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('grades.noGradesYet')}</p>
                        ) : (
                            <div className="space-y-3">
                                {studentGrades.map(grade => (
                                    <div key={grade.id} className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg flex justify-between items-center">
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">{grade.subject}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(grade.date).toLocaleDateString()} • {grade.type || 'evaluation'}
                                            </div>
                                        </div>

                                        {editingGrade?.id === grade.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="w-16 text-center border border-orange-300 dark:border-orange-500 bg-white dark:bg-slate-600 text-gray-900 dark:text-white rounded p-1 outline-none focus:ring-2 focus:ring-orange-200"
                                                    autoFocus
                                                />
                                                <button onClick={handleUpdateGrade} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"><Check size={16} /></button>
                                                <button onClick={cancelEditing} className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><X size={16} /></button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => startEditingGrade(grade)}
                                                className="flex items-center gap-2 group"
                                                title={t('grades.clickToEdit')}
                                            >
                                                <span className={`font-bold text-lg ${(grade.score / grade.maxScore) >= 0.5 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {grade.score}/{grade.maxScore}
                                                </span>
                                                <Pencil size={14} className="text-gray-300 group-hover:text-orange-500" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Step 3: View by Subject - Subject List */}
            {getCurrentStep() === 3 && viewMode === 'bySubject' && !selectedSubject && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <button
                            onClick={goBack}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-700 dark:text-gray-300"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-xl font-semibold dark:text-white">{t('grades.bySubject')}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedClass?.name}</p>
                        </div>
                    </div>

                    {/* Subjects Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classSubjects.map(subject => {
                            const subjectGradeCount = grades.filter(g => {
                                const student = students.find(s => s.id === g.studentId);
                                return g.subject === subject && (student as Student)?.classId === selectedClassId;
                            }).length;

                            return (
                                <button
                                    key={subject}
                                    onClick={() => setSelectedSubject(subject)}
                                    className="p-6 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-700 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 transition-all text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full text-green-600 dark:text-green-400">
                                            <BookOpen size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-800 dark:text-white">{subject}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{subjectGradeCount} {t('grades.title').toLowerCase()}</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 3: View by Subject - Subject Detail */}
            {getCurrentStep() === 3 && viewMode === 'bySubject' && selectedSubject && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <button
                            onClick={goBack}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-700 dark:text-gray-300"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full text-green-600 dark:text-green-400">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold dark:text-white">{selectedSubject}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedClass?.name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Students with grades for this subject */}
                    <div className="space-y-3">
                        {filteredStudents.map(student => {
                            const studentSubjectGrades = subjectGradesByStudent[student.id] || [];
                            const avgScore = studentSubjectGrades.length > 0
                                ? studentSubjectGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / studentSubjectGrades.length
                                : 0;

                            return (
                                <div key={student.id} className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-white">{student.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {studentSubjectGrades.length} {t('grades.title').toLowerCase()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {studentSubjectGrades.length > 0 ? (
                                                <span className={`text-lg font-bold ${avgScore >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {avgScore.toFixed(0)}%
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-500 text-sm">{t('grades.noGrades')}</span>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setSelectedStudentId(student.id);
                                                    setViewMode('byStudent');
                                                    setSelectedSubject('');
                                                }}
                                                className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400"
                                            >
                                                {t('common.edit')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Show individual grades */}
                                    {studentSubjectGrades.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {studentSubjectGrades.map(grade => (
                                                <span
                                                    key={grade.id}
                                                    className={`px-2 py-1 rounded text-sm font-medium ${(grade.score / grade.maxScore) >= 0.5
                                                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                                                        : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                                                        }`}
                                                >
                                                    {grade.score}/{grade.maxScore}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
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

            {/* Mobile Floating Action Button */}
            <div className="fixed bottom-6 right-6 lg:hidden z-40">
                <button
                    onClick={() => setIsGradeModalOpen(true)}
                    disabled={!selectedClassId}
                    className={`w-14 h-14 bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all ${!selectedClassId ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'hover:bg-orange-700 active:scale-95'}`}
                >
                    <Plus size={28} />
                </button>
            </div>
        </div>
    );
};

export default TeacherGradesView;
