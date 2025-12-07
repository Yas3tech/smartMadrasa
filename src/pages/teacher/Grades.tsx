import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, Button } from '../../components/UI';
import {
    Download,
    Search,
    Save,
    Upload,
    FileText,
    BarChart3,
    GraduationCap,
    Clock
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import BulkGradeModal from '../../components/Grades/BulkGradeModal';
import toast from 'react-hot-toast';

const Grades = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { students, classes, grades, addGrade, updateGrade, attendance } = useData();

    // Teacher States
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    // Student/Parent States
    const [selectedChildId, setSelectedChildId] = useState('');

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

    // Calculate Stats
    const calculateStudentStats = (studentId: string) => {
        const studentGrades = grades.filter(g => g.studentId === studentId);
        const studentAttendance = attendance.filter(a => a.studentId === studentId);

        const avgGrade = studentGrades.length > 0
            ? (studentGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / studentGrades.length)
            : 0;

        const presentCount = studentAttendance.filter(a => a.status === 'present').length;
        const attendanceRate = studentAttendance.length > 0
            ? ((presentCount / studentAttendance.length) * 100)
            : 0;

        // Subject-wise performance
        const subjects = ['Mathématiques', 'Français', 'Arabe', 'Sciences', 'Histoire', 'Education Islamique'];
        const subjectPerformance = subjects.map(subject => {
            const subjectGrades = studentGrades.filter(g => g.subject === subject);
            const avg = subjectGrades.length > 0
                ? (subjectGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / subjectGrades.length)
                : 0;
            return { subject, average: avg, count: subjectGrades.length };
        });

        return {
            avgGrade: Number(avgGrade.toFixed(1)),
            attendanceRate: Number(attendanceRate.toFixed(0)),
            totalGrades: studentGrades.length,
            subjectPerformance
        };
    };

    const handleGradeChange = async (studentId: string, value: string, type: 'exam' | 'homework' | 'participation') => {
        const score = parseFloat(value);
        if (isNaN(score) || score < 0 || score > 20) return;

        // Find existing grade or create new one
        const existingGrade = grades.find(g =>
            g.studentId === studentId &&
            g.subject === selectedSubject &&
            g.type === type &&
            new Date(g.date).toDateString() === new Date().toDateString()
        );

        try {
            if (existingGrade) {
                await updateGrade(existingGrade.id, { score });
                toast.success(t('grades.gradeUpdated'));
            } else {
                await addGrade({
                    studentId,
                    studentName: students.find(s => s.id === studentId)?.name || '',
                    courseId: 'temp-course-id', // Should be real course ID
                    subject: selectedSubject,
                    type,
                    score,
                    maxScore: 20,

                    date: new Date().toISOString(),
                    teacherId: user?.id || '',
                    classId: selectedClassId
                });
                toast.success(t('grades.gradeAdded'));
            }
        } catch (error) {
            toast.error(t('grades.saveError'));
        }
    };

    const handleDownloadReport = (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        const doc = new jsPDF();
        const stats = calculateStudentStats(studentId);

        // Header
        doc.setFontSize(20);
        doc.text(t('grades.reportTitle'), 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`${t('grades.student')}: ${student.name}`, 20, 40);
        doc.text(`${t('grades.date')}: ${new Date().toLocaleDateString(i18n.language)}`, 20, 50);

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
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('grades.myReport')}</h1>
                        <p className="text-gray-600">{t('grades.academicReport')}</p>
                    </div>
                    <Button variant="primary" icon={Download} onClick={() => handleDownloadReport(user.id)}>
                        {t('grades.downloadPDF')}
                    </Button>
                </div>

                {/* Stats Cards */}
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
                                <FileText className="text-green-600" size={24} />
                            </div>
                            <h3 className="font-bold text-gray-900">{t('grades.evaluations')}</h3>
                        </div>
                        <p className="text-4xl font-bold text-gray-900 mb-2">{stats.totalGrades}</p>
                        <div className="flex items-center gap-1 text-sm text-green-700">
                            <BarChart3 size={16} />
                            <span>{t('grades.totalGrades')}</span>
                        </div>
                    </Card>
                </div>

                {/* Subject Performance */}
                <Card className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">{t('grades.subjectPerformance')}</h2>
                    <div className="space-y-4">
                        {stats.subjectPerformance.map(({ subject, average, count }) => (
                            <div key={subject}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-gray-900">{subject}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-500">{count} {t('grades.score')}{count > 1 ? 's' : ''}</span>
                                        <span className={`font-bold ${average >= 80 ? 'text-green-600' : average >= 60 ? 'text-blue-600' : 'text-orange-600'}`}>
                                            {average.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${average >= 80 ? 'bg-green-500' : average >= 60 ? 'bg-blue-500' : 'bg-orange-500'}`}
                                        style={{ width: `${average}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
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
                    <select
                        value={activeChildId}
                        onChange={(e) => setSelectedChildId(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-gray-200 outline-none"
                    >
                        {children.map(child => (
                            <option key={child.id} value={child.id}>{child.name}</option>
                        ))}
                    </select>
                </div>

                {stats && activeChild && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="p-6">
                                <h3 className="font-bold text-gray-900 mb-4">{t('grades.academicPerformance')}</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">{t('grades.generalAverage')}</span>
                                        <span className="text-2xl font-bold text-orange-600">{stats.avgGrade}%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">{t('grades.evaluations')}</span>
                                        <span className="font-semibold text-gray-900">{stats.totalGrades}</span>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-6">
                                <h3 className="font-bold text-gray-900 mb-4">{t('grades.attendanceRate')}</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">{t('grades.attendanceRate')}</span>
                                        <span className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                        <Card className="p-6">
                            <h3 className="font-bold text-gray-900 mb-4">{t('grades.subjectDetail')}</h3>
                            <div className="space-y-4">
                                {stats.subjectPerformance.map(({ subject, average }) => (
                                    <div key={subject} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="font-medium text-gray-900">{subject}</span>
                                        <span className={`font-bold px-3 py-1 rounded-full ${average >= 80 ? 'bg-green-100 text-green-700' : average >= 60 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                            {average.toFixed(1)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                        <div className="flex justify-end">
                            <Button variant="primary" icon={Download} onClick={() => handleDownloadReport(activeChild.id)}>
                                {t('grades.downloadReportPDF')}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    // RENDER: Teacher/Director View
    if (user?.role === 'teacher' || user?.role === 'director' || user?.role === 'superadmin') {
        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('grades.managementTitle')}</h1>
                        <p className="text-gray-600">{t('grades.managementSubtitle')}</p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <select
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 outline-none"
                            >
                                <option value="">{t('grades.selectClass')}</option>
                                {teacherClasses.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 outline-none"
                            >
                                <option value="">{t('grades.selectSubject')}</option>
                                <option value="Mathématiques">Mathématiques</option>
                                <option value="Français">Français</option>
                                <option value="Arabe">Arabe</option>
                                <option value="Sciences">Sciences</option>
                                <option value="Histoire">Histoire</option>
                                <option value="Education Islamique">Education Islamique</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px] relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder={t('grades.searchStudent')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 outline-none"
                            />
                        </div>
                    </div>
                </Card>

                {!selectedClassId ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <GraduationCap className="text-orange-500" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{t('grades.noClassSelected')}</h3>
                        <p className="text-gray-500">{t('grades.selectClassPrompt')}</p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" icon={Upload} onClick={() => setIsBulkModalOpen(true)}>
                                {t('grades.bulkEntry')}
                            </Button>
                        </div>
                        <Card>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50">
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('grades.student')}</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">{t('grades.gradeOutOf20')}</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">{t('grades.type')}</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">{t('grades.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredStudents.map(student => (
                                            <tr key={student.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <span className="font-medium text-gray-900">{student.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="20"
                                                        className="w-20 mx-auto block text-center px-2 py-1 rounded border border-gray-200 focus:ring-2 focus:ring-orange-100 outline-none"
                                                        placeholder="-"
                                                        onBlur={(e) => handleGradeChange(student.id, e.target.value, 'exam')}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">{t('grades.exam')}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="sm" icon={Save} className="text-orange-600">
                                                        {t('common.save')}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </>
                )}

                {isBulkModalOpen && selectedClass && (
                    <BulkGradeModal
                        isOpen={isBulkModalOpen}
                        onClose={() => setIsBulkModalOpen(false)}
                        className={selectedClass.name}
                        students={filteredStudents}
                        onSave={async (gradesData) => {
                            try {
                                await Promise.all(
                                    gradesData.map(grade => addGrade(grade))
                                );
                                toast.success(t('grades.importSuccess'));
                                setIsBulkModalOpen(false);
                            } catch (error) {
                                toast.error(t('grades.importError'));
                            }
                        }}
                    />
                )}
            </div>
        );
    }

    return null;
};

export default Grades;
