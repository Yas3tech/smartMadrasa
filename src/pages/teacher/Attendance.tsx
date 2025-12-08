import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, Button } from '../../components/UI';
import { Check, X, Clock, Users as UsersIcon, Calendar, BookOpen, AlertCircle } from 'lucide-react';
import type { Student } from '../../types';

const Attendance = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { students, attendance, markAttendance, updateAttendance, courses, classes } = useData();
    const isRTL = i18n.language === 'ar';

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [justificationMap, setJustificationMap] = useState<Record<string, string>>({});

    // Filter courses for the current teacher and selected date
    const teacherCourses = useMemo(() => {
        const date = new Date(selectedDate);
        const day = date.getUTCDay(); // 0=Sun, 1=Mon...
        const dayOfWeek = day === 0 ? 7 : day;

        let filtered = courses;

        // Filter by role
        if (user?.role === 'teacher') {
            filtered = filtered.filter(c => c.teacherId === user.id);
        }

        // Filter by day of week
        return filtered.filter(c => c.dayOfWeek === dayOfWeek);
    }, [courses, user, selectedDate]);

    const selectedCourse = teacherCourses.find(c => c.id === selectedCourseId);

    // Get students for the selected course's class
    const courseStudents = useMemo(() => {
        if (!selectedCourse) return [];
        return students.filter(s => (s as Student).classId === selectedCourse.classId);
    }, [selectedCourse, students]);

    const getAttendanceRecord = (studentId: string) => {
        return attendance.find(a =>
            a.studentId === studentId &&
            a.date === selectedDate &&
            (a.courseId === selectedCourseId || !a.courseId)
        );
    };

    const handleMarkAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
        if (!selectedCourse) return;

        const existing = getAttendanceRecord(studentId);
        const justification = (status === 'absent' || status === 'late') ? justificationMap[studentId] : undefined;

        if (existing) {
            await updateAttendance(existing.id, status, justification);
        } else {
            await markAttendance({
                date: selectedDate,
                studentId,
                status,
                classId: selectedCourse.classId,
                courseId: selectedCourse.id,
                justification,
                isJustified: !!justification
            });
        }
    };

    const handleJustificationChange = (studentId: string, value: string) => {
        setJustificationMap(prev => ({ ...prev, [studentId]: value }));
    };

    const getStats = () => {
        if (!selectedCourse) return { present: 0, absent: 0, late: 0, unmarked: 0, total: 0 };

        const records = courseStudents.map(s => getAttendanceRecord(s.id));
        const present = records.filter(r => r?.status === 'present').length;
        const absent = records.filter(r => r?.status === 'absent').length;
        const late = records.filter(r => r?.status === 'late').length;
        const unmarked = courseStudents.length - present - absent - late;

        return { present, absent, late, unmarked, total: courseStudents.length };
    };

    const stats = getStats();

    if (user?.role !== 'teacher' && user?.role !== 'director' && user?.role !== 'superadmin') {
        return (
            <div className="flex items-center justify-center h-96">
                <Card className="p-8 text-center">
                    <UsersIcon size={48} className="mx-auto mb-4 text-gray-300" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{t('attendance.restrictedAccess')}</h2>
                    <p className="text-gray-600">{t('attendance.restrictedAccessDesc')}</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('attendance.title')}</h1>
                    <p className="text-gray-600 dark:text-slate-400">{t('attendance.subtitle')}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Calendar className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500`} size={18} />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/30 focus:border-orange-500 outline-none`}
                        />
                    </div>

                    <div className="relative min-w-[200px]">
                        <BookOpen className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500`} size={18} />
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 rounded-xl border border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/30 focus:border-orange-500 outline-none appearance-none bg-white dark:bg-slate-800 text-gray-900 dark:text-white`}
                        >
                            <option value="">{t('attendance.selectCourse')}</option>
                            {teacherCourses.map(course => {
                                const classGroup = classes.find(c => c.id === course.classId);
                                return (
                                    <option key={course.id} value={course.id}>
                                        {course.subject} - {classGroup?.name || t('attendance.unknownClass')} ({course.startTime})
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>
            </div>

            {!selectedCourse ? (
                <Card className="p-12 text-center border-dashed border-2">
                    <div className="w-16 h-16 bg-orange-500/20 dark:bg-orange-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="text-orange-500" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('attendance.noCourseSelected')}</h3>
                    <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                        {t('attendance.noCourseSelectedDesc')}
                    </p>
                </Card>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className={`p-4 ${isRTL ? 'border-r-4 border-r-green-500' : 'border-l-4 border-l-green-500'}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 dark:bg-green-500/30 rounded-lg">
                                    <Check className="text-green-600 dark:text-green-400" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">{t('attendance.present')}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.present}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className={`p-4 ${isRTL ? 'border-r-4 border-r-red-500' : 'border-l-4 border-l-red-500'}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/20 dark:bg-red-500/30 rounded-lg">
                                    <X className="text-red-600 dark:text-red-400" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">{t('attendance.absent')}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.absent}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className={`p-4 ${isRTL ? 'border-r-4 border-r-yellow-500' : 'border-l-4 border-l-yellow-500'}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-500/20 dark:bg-yellow-500/30 rounded-lg">
                                    <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">{t('attendance.late')}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.late}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className={`p-4 ${isRTL ? 'border-r-4 border-r-gray-400' : 'border-l-4 border-l-gray-400'}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-500/20 dark:bg-gray-500/30 rounded-lg">
                                    <UsersIcon className="text-gray-500 dark:text-gray-400" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">{t('attendance.unmarked')}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unmarked}</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card>
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('attendance.studentList')}</h2>
                            <span className="text-sm text-gray-500 dark:text-slate-400">{courseStudents.length} {t('attendance.students')}</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {courseStudents.map(student => {
                                const record = getAttendanceRecord(student.id);
                                const status = record?.status;
                                const isAbsent = status === 'absent';

                                return (
                                    <div key={student.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{student.name}</h3>
                                                <p className="text-sm text-gray-500">{student.email}</p>
                                                {record?.isJustified && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium mt-1">
                                                        <Check size={12} /> {t('attendance.justified')}: {record.justification}
                                                    </span>
                                                )}
                                                {isAbsent && !record?.isJustified && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium mt-1">
                                                        <AlertCircle size={12} /> {t('attendance.notJustified')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <Button
                                                    variant={status === 'present' ? 'primary' : 'secondary'}
                                                    size="sm"
                                                    icon={Check}
                                                    onClick={() => handleMarkAttendance(student.id, 'present')}
                                                    className={status === 'present' ? 'bg-green-600 hover:bg-green-700 border-green-600' : ''}
                                                >
                                                    {t('attendance.presentBtn')}
                                                </Button>
                                                <Button
                                                    variant={status === 'late' ? 'primary' : 'secondary'}
                                                    size="sm"
                                                    icon={Clock}
                                                    onClick={() => handleMarkAttendance(student.id, 'late')}
                                                    className={status === 'late' ? 'bg-yellow-500 hover:bg-yellow-600 border-yellow-500 text-white' : ''}
                                                >
                                                    {t('attendance.lateBtn')}
                                                </Button>
                                                <Button
                                                    variant={status === 'absent' ? 'primary' : 'secondary'}
                                                    size="sm"
                                                    icon={X}
                                                    onClick={() => handleMarkAttendance(student.id, 'absent')}
                                                    className={status === 'absent' ? 'bg-red-600 hover:bg-red-700 border-red-600' : ''}
                                                >
                                                    {t('attendance.absentBtn')}
                                                </Button>
                                            </div>

                                            {/* Justification Input for Absences or Lateness */}
                                            {(isAbsent || status === 'late') && (
                                                <div className="flex gap-2 animate-fadeIn mt-2">
                                                    <input
                                                        type="text"
                                                        placeholder={isAbsent ? t('attendance.absenceReason') : t('attendance.lateReason')}
                                                        className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-100 outline-none"
                                                        value={justificationMap[student.id] || record?.justification || ''}
                                                        onChange={(e) => handleJustificationChange(student.id, e.target.value)}
                                                        onBlur={() => handleMarkAttendance(student.id, status)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
};

export default Attendance;
