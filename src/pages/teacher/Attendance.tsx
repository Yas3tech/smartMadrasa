import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, Button } from '../../components/UI';
import { Check, X, Clock, Users as UsersIcon, Calendar, BookOpen, AlertCircle } from 'lucide-react';

const Attendance = () => {
    const { user } = useAuth();
    const { students, attendance, markAttendance, updateAttendance, courses, classes } = useData();

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [justificationMap, setJustificationMap] = useState<Record<string, string>>({});

    // Filter courses for the current teacher
    const teacherCourses = useMemo(() => {
        if (user?.role === 'teacher') {
            return courses.filter(c => c.teacherId === user.id);
        }
        return courses; // Admin sees all
    }, [courses, user]);

    const selectedCourse = teacherCourses.find(c => c.id === selectedCourseId);

    // Get students for the selected course's class
    const courseStudents = useMemo(() => {
        if (!selectedCourse) return [];
        return students.filter(s => (s as any).classId === selectedCourse.classId);
    }, [selectedCourse, students]);

    const getAttendanceRecord = (studentId: string) => {
        // Filter by date AND courseId (if we track by course)
        // For now, assuming we track by date and student, but ideally we should filter by courseId too if multiple courses per day
        // Updated logic: Check if there's an attendance record for this student, this date, and this course
        return attendance.find(a =>
            a.studentId === studentId &&
            a.date === selectedDate &&
            (a.courseId === selectedCourseId || !a.courseId) // Fallback for legacy data
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
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Accès restreint</h2>
                    <p className="text-gray-600">Cette page est réservée aux enseignants et directeurs.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion des Présences</h1>
                    <p className="text-gray-600">Marquer la présence par cours</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                        />
                    </div>

                    <div className="relative min-w-[200px]">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none appearance-none bg-white"
                        >
                            <option value="">Sélectionner un cours</option>
                            {teacherCourses.map(course => {
                                const classGroup = classes.find(c => c.id === course.classId);
                                return (
                                    <option key={course.id} value={course.id}>
                                        {course.subject} - {classGroup?.name || 'Classe inconnue'} ({course.startTime})
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>
            </div>

            {!selectedCourse ? (
                <Card className="p-12 text-center border-dashed border-2">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="text-orange-500" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun cours sélectionné</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Veuillez sélectionner un cours et une date pour commencer à marquer la présence.
                    </p>
                </Card>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="p-4 border-l-4 border-l-green-500">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <Check className="text-green-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Présents</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 border-l-4 border-l-red-500">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 rounded-lg">
                                    <X className="text-red-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Absents</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 border-l-4 border-l-yellow-500">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-50 rounded-lg">
                                    <Clock className="text-yellow-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Retard</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.late}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 border-l-4 border-l-gray-300">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <UsersIcon className="text-gray-400" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Non marqués</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.unmarked}</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">Liste des élèves</h2>
                            <span className="text-sm text-gray-500">{courseStudents.length} élèves</span>
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
                                                        <Check size={12} /> Justifié: {record.justification}
                                                    </span>
                                                )}
                                                {isAbsent && !record?.isJustified && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium mt-1">
                                                        <AlertCircle size={12} /> Non justifié
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
                                                    Présent
                                                </Button>
                                                <Button
                                                    variant={status === 'late' ? 'primary' : 'secondary'}
                                                    size="sm"
                                                    icon={Clock}
                                                    onClick={() => handleMarkAttendance(student.id, 'late')}
                                                    className={status === 'late' ? 'bg-yellow-500 hover:bg-yellow-600 border-yellow-500 text-white' : ''}
                                                >
                                                    Retard
                                                </Button>
                                                <Button
                                                    variant={status === 'absent' ? 'primary' : 'secondary'}
                                                    size="sm"
                                                    icon={X}
                                                    onClick={() => handleMarkAttendance(student.id, 'absent')}
                                                    className={status === 'absent' ? 'bg-red-600 hover:bg-red-700 border-red-600' : ''}
                                                >
                                                    Absent
                                                </Button>
                                            </div>

                                            {/* Justification Input for Absences or Lateness */}
                                            {(isAbsent || status === 'late') && (
                                                <div className="flex gap-2 animate-fadeIn mt-2">
                                                    <input
                                                        type="text"
                                                        placeholder={isAbsent ? "Motif d'absence (optionnel)" : "Motif de retard (optionnel)"}
                                                        className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-100 outline-none"
                                                        value={justificationMap[student.id] || record?.justification || ''}
                                                        onChange={(e) => handleJustificationChange(student.id, e.target.value)}
                                                        onBlur={() => handleMarkAttendance(student.id, status)} // Save on blur
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
