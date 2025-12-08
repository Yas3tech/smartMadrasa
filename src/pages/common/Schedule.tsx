import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, Button, Badge } from '../../components/UI';
import { Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, BookOpen, GraduationCap } from 'lucide-react';
import CourseModal from '../../components/Schedule/CourseModal';
import ExamModal from '../../components/Schedule/ExamModal';
import UpcomingEventsModal from '../../components/Schedule/UpcomingEventsModal';
import HomeworkDetailModal from '../../components/Schedule/HomeworkDetailModal';
import type { Course, Event, Homework } from '../../types';

interface ScheduleSlot {
    time: string;
    courses: {
        [key: number]: Course | null; // 1=Monday, ...
    };
    exams: {
        [key: number]: Event[];
    };
}

const Schedule = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const {
        courses,
        events,
        homeworks,
        classes,
        addCourse,
        updateCourse,
        deleteCourse,
        addEvent,
        updateEvent,
        deleteEvent
    } = useData();

    const [weekOffset, setWeekOffset] = useState(0);

    //Modals state
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showExamModal, setShowExamModal] = useState(false);
    const [showUpcomingModal, setShowUpcomingModal] = useState(false);
    const [showHomeworkDetail, setShowHomeworkDetail] = useState(false);

    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [editingExam, setEditingExam] = useState<Event | null>(null);
    const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

    // Calculate the start of the week (Monday) based on offset
    const getWeekStart = (offset: number) => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diff + (offset * 7));
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    const weekStart = getWeekStart(weekOffset);

    // Get the week range for display
    const getWeekRange = () => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Sunday

        const formatDate = (date: Date) => {
            return date.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
        };

        return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
    };

    const isCurrentWeek = weekOffset === 0;

    // Get user's class ID (for students) or classes (for teachers)
    const getUserClassId = () => {
        if (user?.role === 'student') {
            // @ts-ignore - We know students have classId
            return user.classId;
        }
        return null;
    };

    const classId = getUserClassId();
    // Filter courses for the current user
    const userCourses = useMemo(() => {
        if (user?.role === 'student' && classId) {
            return courses.filter(c => c.classId === classId);
        } else if (user?.role === 'teacher') {
            return courses.filter(c => c.teacherId === user.id);
        } else if (user?.role === 'director' || user?.role === 'superadmin') {
            return courses; // Show all courses
        }
        return [];
    }, [courses, user, classId]);

    // Filter exams for the current user
    const userExams = useMemo(() => {
        return events.filter(e => {
            if (e.type !== 'exam' && e.type !== 'evaluation') return false;

            // Élève : seulement les examens de sa classe
            if (user?.role === 'student' && classId) {
                return e.classId === classId;
            }

            // Prof : examens des classes qu'il/elle enseigne
            if (user?.role === 'teacher') {
                const teacherClassIds = classes
                    .filter(c => c.teacherId === user.id)
                    .map(c => c.id);
                return !!e.classId && teacherClassIds.includes(e.classId);
            }

            // Direction / Superadmin : tous les examens
            if (user?.role === 'director' || user?.role === 'superadmin') {
                return true;
            }

            return false;
        });
    }, [events, user, classId, classes]);


    // Filter homeworks for the current user
    const userHomeworks = useMemo(() => {
        return homeworks.filter(h =>
            (user?.role === 'student' && h.classId === classId) ||
            (user?.role === 'teacher' && h.assignedBy === user.name) || // assignedBy is name, not ID. Ideally ID.
            (user?.role === 'director' || user?.role === 'superadmin')
        );
    }, [homeworks, user, classId]);

    // Filter courses for the current week
    const weekCourses = useMemo(() => {
        const weekStartTimestamp = weekStart.getTime();
        const weekEndTimestamp = new Date(weekStart).setDate(weekStart.getDate() + 6);

        return userCourses.filter(course => {
            if (course.isRecurring) {
                if (course.recurrenceStart) {
                    const recStart = new Date(course.recurrenceStart).getTime();
                    if (recStart > weekEndTimestamp) return false;
                }
                if (course.recurrenceEnd) {
                    const recEnd = new Date(course.recurrenceEnd).getTime();
                    if (recEnd < weekStartTimestamp) return false;
                }
                return true;
            }
            if (course.specificDate) {
                const courseDate = new Date(course.specificDate);
                const courseTime = courseDate.getTime();
                return courseTime >= weekStartTimestamp && courseTime <= weekEndTimestamp;
            }
            return false;
        });
    }, [userCourses, weekOffset, weekStart]);

    // Filter exams for the current week
    const weekExams = useMemo(() => {
        const weekStartTimestamp = weekStart.getTime();
        const weekEndTimestamp = new Date(weekStart).setDate(weekStart.getDate() + 7); // Include Sunday fully

        return userExams.filter(exam => {
            const examTime = new Date(exam.start).getTime();
            return examTime >= weekStartTimestamp && examTime < weekEndTimestamp;
        });
    }, [userExams, weekStart]);

    // Filter homeworks for the current week
    const weekHomeworks = useMemo(() => {
        const weekStartTimestamp = weekStart.getTime();
        const weekEndTimestamp = new Date(weekStart).setDate(weekStart.getDate() + 7);

        return userHomeworks.filter(hw => {
            const dueDate = new Date(hw.dueDate).getTime();
            return dueDate >= weekStartTimestamp && dueDate < weekEndTimestamp;
        });
    }, [userHomeworks, weekStart]);

    // Build schedule slots
    const scheduleSlots: ScheduleSlot[] = useMemo(() => {
        const timeSlots = [
            '08:00 - 09:00',
            '09:00 - 10:00',
            '10:00 - 10:15',
            '10:15 - 11:15',
            '11:15 - 12:15',
            '12:15 - 13:30',
            '13:30 - 14:30',
            '14:30 - 15:30',
            '15:30 - 16:30',
            '16:30 - 17:30'
        ];

        return timeSlots.map(time => {
            const slot: ScheduleSlot = {
                time,
                courses: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null },
                exams: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] }
            };

            const [slotStart] = time.split(' - ');

            // Fill courses
            weekCourses.forEach(course => {
                if (course.startTime === slotStart) {
                    slot.courses[course.dayOfWeek] = course;
                }
            });

            // Fill exams
            weekExams.forEach(exam => {
                const examDate = new Date(exam.start);
                // Adjust for day of week (0=Sunday, 1=Monday...)
                // Our grid uses 1=Monday...7=Sunday
                let dayOfWeek = examDate.getDay();
                if (dayOfWeek === 0) dayOfWeek = 7;

                const examTime = examDate.toTimeString().slice(0, 5); // HH:MM

                // Simple matching: if exam starts within the slot (or at start)
                // Or we can just check if it starts at the same hour
                if (examTime === slotStart) {
                    slot.exams[dayOfWeek].push(exam);
                }
            });

            return slot;
        });
    }, [weekCourses, weekExams]);

    const subjectColors: Record<string, string> = {
        'Mathématiques': 'bg-blue-500 text-white border-blue-600',
        'Français': 'bg-purple-500 text-white border-purple-600',
        'Arabe': 'bg-green-500 text-white border-green-600',
        'Sciences': 'bg-orange-500 text-white border-orange-600',
        'Histoire': 'bg-yellow-500 text-yellow-900 border-yellow-600',
        'Sport': 'bg-red-500 text-white border-red-600',
        'Arts': 'bg-pink-500 text-white border-pink-600',
        'Religion': 'bg-teal-500 text-white border-teal-600',
        'Informatique': 'bg-indigo-400 text-indigo-900 border-indigo-500',
        'Coran': 'bg-emerald-500 text-white border-emerald-600',
        'Sira': 'bg-lime-500 text-lime-900 border-lime-600',
        'Fiqh': 'bg-sky-500 text-white border-sky-600',
        'Pause': 'bg-gray-400 text-gray-900 border-gray-500',
        'Déjeuner': 'bg-gray-400 text-gray-900 border-gray-500',
        'Bibliothèque': 'bg-amber-500 text-amber-900 border-amber-600',
        'Activités': 'bg-cyan-500 text-white border-cyan-600'
    };

    const currentDay = new Date().getDay() || 7; // 1-7
    const canEdit = user?.role === 'teacher' || user?.role === 'director' || user?.role === 'superadmin';

    // Handlers
    const handleAddCourse = () => {
        setEditingCourse(null);
        setShowCourseModal(true);
    };

    const handleAddExam = () => {
        setEditingExam(null);
        setShowExamModal(true);
    };

    const handleEditCourse = (course: Course) => {
        if (!canEdit) return;
        setEditingCourse(course);
        setShowCourseModal(true);
    };

    const handleEditExam = (exam: Event) => {
        if (!canEdit) return;
        setEditingExam(exam);
        setShowExamModal(true);
    };

    const handleSaveCourse = async (courseData: Omit<Course, 'id'>) => {
        if (editingCourse) {
            await updateCourse(editingCourse.id, courseData);
        } else {
            await addCourse(courseData);
        }
    };

    const handleSaveExam = async (eventData: Omit<Event, 'id'>) => {
        if (editingExam) {
            await updateEvent(editingExam.id, eventData);
        } else {
            await addEvent(eventData);
        }
    };

    const handleDeleteCourse = async (courseId: string) => {
        if (!canEdit) return;
        if (confirm(t('schedule.confirmDeleteCourse'))) {
            await deleteCourse(courseId);
        }
    };

    const handleDeleteExam = async (eventId: string) => {
        if (!canEdit) return;
        if (confirm(t('schedule.confirmDeleteExam'))) {
            await deleteEvent(eventId);
        }
    };

    // Helper to get homeworks for a specific day
    const getHomeworksForDay = (dayIndex: number) => {
        return weekHomeworks.filter(hw => {
            const date = new Date(hw.dueDate);
            let day = date.getDay();
            if (day === 0) day = 7;
            return day === dayIndex;
        });
    };

    const days = [
        t('schedule.monday'),
        t('schedule.tuesday'),
        t('schedule.wednesday'),
        t('schedule.thursday'),
        t('schedule.friday'),
        t('schedule.saturday'),
        t('schedule.sunday')
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('schedule.mySchedule')}</h1>
                    <p className="text-gray-600 dark:text-slate-400">{t('schedule.academicYear', { year: '2024-2025' })}</p>
                </div>

                {/* Week Navigation and Actions */}
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="secondary"
                        icon={ChevronLeft}
                        onClick={() => setWeekOffset(weekOffset - 1)}
                        className="px-3"
                    />

                    <div className="flex flex-col items-center min-w-[200px]">
                        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-xl">
                            <CalendarIcon className="text-orange-600" size={20} />
                            <span className="font-semibold text-orange-700">
                                {getWeekRange()}
                            </span>
                        </div>
                        {!isCurrentWeek && (
                            <button
                                onClick={() => setWeekOffset(0)}
                                className="text-xs text-orange-600 hover:text-orange-700 mt-1 font-medium"
                            >
                                {t('schedule.backToCurrentWeek')}
                            </button>
                        )}
                    </div>

                    <Button
                        variant="secondary"
                        icon={ChevronRight}
                        onClick={() => setWeekOffset(weekOffset + 1)}
                        className="px-3"
                    />

                    <Button
                        variant="secondary"
                        icon={CalendarIcon}
                        onClick={() => setShowUpcomingModal(true)}
                    >
                        {t('schedule.upcoming')}
                    </Button>

                    {canEdit && (
                        <div className="flex gap-2">
                            <Button
                                variant="primary"
                                icon={Plus}
                                onClick={handleAddCourse}
                            >
                                {t('schedule.course')}
                            </Button>
                            <Button
                                variant="primary"
                                icon={GraduationCap}
                                onClick={handleAddExam}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {t('schedule.examEval')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Weekly Schedule (Desktop) */}
            <div className="hidden lg:block">
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-slate-700 dark:to-slate-600">
                                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-white border-r border-orange-200 dark:border-slate-600 w-32">
                                        {t('schedule.timeSlot')}
                                    </th>
                                    {days.map((day, index) => {
                                        const dayIndex = index + 1;
                                        const homeworkCount = getHomeworksForDay(dayIndex).length;
                                        return (
                                            <th
                                                key={day}
                                                className={`px-4 py-4 text-center text-sm font-bold border-r border-orange-200 dark:border-slate-600 ${currentDay === dayIndex ? 'bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-200' : 'text-gray-900 dark:text-white'
                                                    }`}
                                            >
                                                <div className="flex flex-col items-center">
                                                    <span>{day}</span>
                                                    {currentDay === dayIndex && (
                                                        <span className="text-xs font-normal text-orange-700 dark:text-orange-300">{t('schedule.today')}</span>
                                                    )}
                                                    {homeworkCount > 0 && (
                                                        <Badge variant="warning" className="mt-1 text-xs">
                                                            {t('schedule.homeworkCount', { count: homeworkCount })}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {scheduleSlots.map((slot, index) => (
                                    <tr key={index} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                                        <td className="px-4 py-4 text-sm font-semibold text-gray-700 dark:text-slate-300 border-r border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-gray-400 dark:text-slate-500" />
                                                {slot.time}
                                            </div>
                                        </td>
                                        {[1, 2, 3, 4, 5, 6, 7].map((dayIndex) => {
                                            const course = slot.courses[dayIndex as 1 | 2 | 3 | 4 | 5 | 6 | 7];
                                            const exams = slot.exams[dayIndex as 1 | 2 | 3 | 4 | 5 | 6 | 7];
                                            const isToday = currentDay === dayIndex;

                                            return (
                                                <td
                                                    key={dayIndex}
                                                    className={`px-4 py-4 border-r border-gray-200 dark:border-slate-700 text-center ${isToday ? 'bg-orange-50 dark:bg-orange-900/20' : ''
                                                        }`}
                                                >
                                                    <div className="space-y-2">
                                                        {/* Exams */}
                                                        {exams.map(exam => (
                                                            <div
                                                                key={exam.id}
                                                                className={`px-3 py-2 rounded-lg font-semibold text-sm border-2 bg-red-500 text-white border-red-600 ${canEdit ? 'cursor-pointer hover:scale-105 transition-transform' : ''} relative group`}
                                                                onClick={() => canEdit && handleEditExam(exam)}
                                                            >
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <GraduationCap size={14} />
                                                                    <span>{exam.title}</span>
                                                                </div>
                                                                {canEdit && (
                                                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteExam(exam.id);
                                                                            }}
                                                                            className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}

                                                        {/* Course */}
                                                        {course ? (
                                                            <div
                                                                className={`px-3 py-2 rounded-lg font-semibold text-sm border-2 ${subjectColors[course.subject] || 'bg-gray-500 text-white border-gray-600'
                                                                    } ${canEdit ? 'cursor-pointer hover:scale-105 transition-transform' : ''} relative group`}
                                                                onClick={() => canEdit && handleEditCourse(course)}
                                                            >
                                                                <div>{course.subject}</div>
                                                                {user?.role === 'teacher' && course.className && (
                                                                    <div className="text-xs font-bold mt-1 text-gray-700">{course.className}</div>
                                                                )}
                                                                {course.room && (
                                                                    <div className="text-xs opacity-75 mt-1">{course.room}</div>
                                                                )}
                                                                {canEdit && (
                                                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteCourse(course.id);
                                                                            }}
                                                                            className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                                {/* Homework Row */}
                                <tr className="bg-gray-50 dark:bg-slate-800 border-t-2 border-orange-200 dark:border-orange-900/50">
                                    <td className="px-4 py-4 text-sm font-bold text-gray-900 dark:text-white border-r border-orange-200 dark:border-slate-700 bg-orange-50 dark:bg-orange-900/30">
                                        {t('schedule.homeworkDue')}
                                    </td>
                                    {[1, 2, 3, 4, 5, 6, 7].map((dayIndex) => {
                                        const homeworks = getHomeworksForDay(dayIndex);
                                        return (
                                            <td key={dayIndex} className="px-4 py-4 border-r border-gray-200 dark:border-slate-700 text-center align-top">
                                                <div className="space-y-2">
                                                    {homeworks.map(hw => (
                                                        <div key={hw.id} className="text-xs p-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-sm text-left">
                                                            <div className="font-bold text-gray-800 dark:text-white flex items-center gap-1">
                                                                <BookOpen size={12} className="text-orange-500" />
                                                                {hw.subject}
                                                            </div>
                                                            <div className="text-gray-600 dark:text-slate-400 truncate">{hw.title}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Mobile View - Today's Schedule */}
            <div className="lg:hidden">
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-orange-500" />
                        {t('schedule.today')}
                    </h2>
                    <div className="space-y-3">
                        {/* Exams Today */}
                        {weekExams.filter(e => {
                            const d = new Date(e.start);
                            return d.getDay() === (currentDay === 7 ? 0 : currentDay);
                        }).map(exam => (
                            <div
                                key={exam.id}
                                className="p-4 rounded-xl border-2 bg-red-500 text-white border-red-600"
                                onClick={() => canEdit && handleEditExam(exam)}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <GraduationCap size={16} className="text-white" />
                                            <p className="font-bold text-sm text-white">{exam.title}</p>
                                        </div>
                                        <p className="text-xs text-red-100">
                                            {new Date(exam.start).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })} -
                                            {new Date(exam.end).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    {canEdit && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteExam(exam.id);
                                            }}
                                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Courses Today */}
                        {scheduleSlots.map((slot, index) => {
                            const dayKey = currentDay as 1 | 2 | 3 | 4 | 5 | 6 | 7;
                            const course = slot.courses[dayKey];

                            if (!course) return null;

                            return (
                                <div
                                    key={index}
                                    className={`p-4 rounded-xl border-2 ${subjectColors[course.subject] || 'bg-gray-500 text-white border-gray-600'}`}
                                    onClick={() => canEdit && handleEditCourse(course)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-sm mb-1">{course.subject}</p>
                                            <p className="text-xs opacity-75">{slot.time}</p>
                                            {course.room && <p className="text-xs opacity-75 mt-1">{course.room}</p>}
                                        </div>
                                        {canEdit && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCourse(course.id);
                                                }}
                                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Homeworks Today */}
                        {getHomeworksForDay(currentDay).length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                                <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                    <BookOpen size={16} className="text-orange-500" />
                                    {t('schedule.homeworkDue')}
                                </h3>
                                <div className="space-y-2">
                                    {getHomeworksForDay(currentDay).map(hw => (
                                        <div key={hw.id} className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                                            <p className="font-bold text-sm text-gray-800 dark:text-white">{hw.subject}</p>
                                            <p className="text-xs text-gray-600 dark:text-slate-400">{hw.title}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Modals */}
            {canEdit && (
                <>
                    <CourseModal
                        isOpen={showCourseModal}
                        onClose={() => {
                            setShowCourseModal(false);
                            setEditingCourse(null);
                        }}
                        onSave={handleSaveCourse}
                        editingCourse={editingCourse}
                        classId={classId || undefined}
                        teacherId={user?.id || ''}
                    />
                    <ExamModal
                        isOpen={showExamModal}
                        onClose={() => {
                            setShowExamModal(false);
                            setEditingExam(null);
                        }}
                        onSave={handleSaveExam}
                        editingEvent={editingExam}
                        classId={classId || undefined}
                        teacherId={user?.id || ''}
                    />
                </>
            )}

            <UpcomingEventsModal
                isOpen={showUpcomingModal}
                onClose={() => setShowUpcomingModal(false)}
                events={events}
                homeworks={homeworks}
            />
            <HomeworkDetailModal
                isOpen={showHomeworkDetail}
                onClose={() => {
                    setShowHomeworkDetail(false);
                    setSelectedHomework(null);
                }}
                homework={selectedHomework}
            />
        </div>
    );
};

export default Schedule;
