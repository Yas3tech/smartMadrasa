import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, Button } from '../../components/UI';
import {
    Download,
    Search,
    Upload,
    FileText,
    BarChart3,
    GraduationCap,
    Clock,
    Pencil,
    X,
    Check,
    ChevronDown,
    Plus
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import BulkGradeModal from '../../components/Grades/BulkGradeModal';
import GradeCard from '../../components/Grades/GradeCard';
import GradeModal from '../../components/Grades/GradeModal';
import type { Grade } from '../../types';
import toast from 'react-hot-toast';

const Grades = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { students, classes, grades, addGrade, updateGrade, attendance, courses, users } = useData();

    // Teacher States
    const [selectedClassId, setSelectedClassId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);

    // Student/Parent States
    const [selectedChildId, setSelectedChildId] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('all');

    // Grade editing state
    const [editingGrade, setEditingGrade] = useState<{ id: string; studentId: string; score: number; maxScore: number } | null>(null);
    const [editValue, setEditValue] = useState('');

    // Student detail panel states (Teacher View)
    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

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
            (s as any).classId === selectedClassId &&
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [selectedClassId, students, searchTerm]);

    // Get subjects available in the selected class (from courses)
    const classSubjects = useMemo(() => {
        if (!selectedClassId) return [];
        const classCourses = courses.filter(c => c.classId === selectedClassId);
        return [...new Set(classCourses.map(c => c.subject))].sort();
    }, [courses, selectedClassId]);

    // Calculate Stats
    const calculateStudentStats = (studentId: string) => {
        const studentGrades = grades.filter(g => g.studentId === studentId);
        const studentAttendance = attendance.filter(a => a.studentId === studentId);

        const avgGrade = Math.round(studentGrades.length > 0
            ? (studentGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / studentGrades.length)
            : 0);

        const presentCount = studentAttendance.filter(a => a.status === 'present').length;
        const attendanceRate = Math.round(studentAttendance.length > 0
            ? ((presentCount / studentAttendance.length) * 100)
            : 0);

        // Subject-wise performance
        const subjects = [...new Set(studentGrades.map(g => g.subject))];
        const subjectPerformance = subjects.map(subject => {
            const subjectGrades = studentGrades.filter(g => g.subject === subject);
            const average = subjectGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / subjectGrades.length;
            return {
                subject,
                average: Math.round(average),
                count: subjectGrades.length
            };
        });

        return {
            avgGrade,
            attendanceRate,
            totalGrades: studentGrades.length,
            subjectPerformance
        };
    };

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
        } catch (error) {
            toast.error(t('grades.errorUpdating'));
        }
    };

    // Helper: Add Individual Grade (Modal)
    const handleIndividualGradeSave = async (gradeData: any) => {
        try {
            await addGrade({
                ...gradeData,
                teacherId: user?.id || '',
                classId: selectedClassId,
                courseId: courses.find(c => c.subject === gradeData.subject && c.classId === selectedClassId)?.id
            });
            toast.success(t('grades.gradeAdded'));
            setIsGradeModalOpen(false);
        } catch (error) {
            toast.error(t('grades.saveError'));
        }
    };

    // Helper: Download Report
    const handleDownloadReport = (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        const stats = calculateStudentStats(studentId);
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(234, 88, 12); // Orange
        doc.text('SmartSchool', 20, 20);

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(t('grades.academicReport'), 20, 35);

        // Student Info
        doc.setFontSize(12);
        doc.text(`${t('common.name')}: ${student.name}`, 20, 50);
        doc.text(`${t('common.date')}: ${new Date().toLocaleDateString(i18n.language)}`, 20, 60);

        // Stats
        doc.text(`${t('grades.generalAverage')}: ${stats.avgGrade}%`, 20, 70);
        doc.text(`${t('grades.attendanceRate')}: ${stats.attendanceRate}%`, 20, 80);

        // Grades Table
        const studentGrades = grades.filter(g => g.studentId === studentId);
        const tableData = studentGrades.map(grade => [
            grade.subject,
            grade.type === 'exam' ? t('grades.exam') : grade.type === 'homework' ? t('grades.homework') : t('grades.participation'),
            `${grade.score}/${grade.maxScore}`,
            new Date(grade.date).toLocaleDateString(i18n.language)
        ]);

        autoTable(doc, {
            startY: 90,
            head: [[t('grades.subject'), t('grades.type'), t('grades.score'), t('grades.date')]],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [234, 88, 12] },
        });

        doc.save(`bulletin_${student.name.replace(/\s+/g, '_')}.pdf`);
        toast.success(t('grades.reportDownloaded'));
    };

    // RENDER: Student View
    if (user?.role === 'student') {
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
                        <h1 className="text-2xl font-bold text-gray-900">{t('grades.myReport')}</h1>
                        <p className="text-gray-600">{t('grades.academicReport')}</p>
                    </div>
                    <Button variant="primary" icon={Download} onClick={() => handleDownloadReport(user.id)}>
                        {t('grades.downloadPDF')}
                    </Button>
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
                            {subject}
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
    }

    // RENDER: Parent View
    if (user?.role === 'parent') {
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
    }

    // RENDER: Teacher/Admin View
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
                                                    handleDownloadReport(student.id);
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
                        } catch (error) {
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

export default Grades;
