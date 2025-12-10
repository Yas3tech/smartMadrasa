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
import StudentSelector from '../../components/Common/StudentSelector';
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

    // Delete menu state
    const [deleteMenu, setDeleteMenu] = useState<{ courseId: string; date: string; x: number; y: number } | null>(null);

    // Parent state
    const [selectedChild, setSelectedChild] = useState<{ id: string; name: string; classId: string } | null>(null);

    // Mobile state
    const [mobileDate, setMobileDate] = useState(new Date());
    const [isFabOpen, setIsFabOpen] = useState(false);

    const handlePrevDay = () => {
        const newDate = new Date(mobileDate);
        newDate.setDate(mobileDate.getDate() - 1);
        setMobileDate(newDate);
    };

    const handleNextDay = () => {
        const newDate = new Date(mobileDate);
        newDate.setDate(mobileDate.getDate() + 1);
        setMobileDate(newDate);
    };

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

    // Get user's classId (for students) or selected child's classId (for parents)
    const getUserClassId = () => {
        if (user?.role === 'student') {
            // @ts-ignore - We know students have classId
            return user.classId;
        }
        if (user?.role === 'parent') {
            return selectedChild?.classId;
        }
        return null;
    };

    const classId = getUserClassId();
    // Filter courses for the current user
    const userCourses = useMemo(() => {
        // Fix: Use generic condition for student OR parent (since classId is derived)
        if ((user?.role === 'student' || user?.role === 'parent') && classId) {
            return courses.filter(c => c.classId === classId);
        } else if (user?.role === 'teacher') {
            return courses.filter(c => c.teacherId === user.id);
        } else if (user?.role === 'director' || user?.role === 'superadmin') {
            return courses; // Show all courses
        }
        return [];
    }, [courses, user, classId]);

    const userExams = useMemo(() => {
        return events.filter(e => {
            if (e.type !== 'exam' && e.type !== 'evaluation') return false;

            // Student OR Parent: exams for the specific class
            if ((user?.role === 'student' || user?.role === 'parent') && classId) {
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
            ((user?.role === 'student' || user?.role === 'parent') && h.classId === classId) ||
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

    // Mobile View Data
    const mobileCourses = useMemo(() => {
        const dayIndex = mobileDate.getDay() || 7;
        const dateTimestamp = mobileDate.getTime();
        const currentDateStr = mobileDate.toISOString().split('T')[0];

        return userCourses.filter(course => {
            if (course.dayOfWeek !== dayIndex) return false;

            // Check if this specific date is excluded
            if (course.excludedDates?.includes(currentDateStr)) return false;

            if (course.isRecurring) {
                if (course.recurrenceStart) {
                    const recStart = new Date(course.recurrenceStart).getTime();
                    if (recStart > dateTimestamp) return false;
                }
                if (course.recurrenceEnd) {
                    const recEnd = new Date(course.recurrenceEnd).getTime();
                    if (recEnd < dateTimestamp) return false;
                }
                return true;
            }
            if (course.specificDate) {
                const courseDate = new Date(course.specificDate);
                // Check if same day
                return courseDate.toDateString() === mobileDate.toDateString();
            }
            return false;
        }).sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [userCourses, mobileDate]);

    const mobileExams = useMemo(() => {
        return userExams.filter(exam => {
            const examDate = new Date(exam.start);
            return examDate.toDateString() === mobileDate.toDateString();
        }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }, [userExams, mobileDate]);

    // Filter homeworks due on the selected mobile date
    const mobileHomeworks = useMemo(() => {
        return userHomeworks.filter(hw => {
            const dueDate = new Date(hw.dueDate);
            return dueDate.toDateString() === mobileDate.toDateString();
        });
    }, [userHomeworks, mobileDate]);

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

    // Show delete menu for a course
    const showDeleteMenu = (e: React.MouseEvent, courseId: string, specificDate: string) => {
        e.stopPropagation();
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setDeleteMenu({
            courseId,
            date: specificDate,
            x: rect.left,
            y: rect.bottom + 5
        });
    };

    // Close delete menu
    const closeDeleteMenu = () => {
        setDeleteMenu(null);
    };

    // Delete only this occurrence (exclude date)
    const handleDeleteThisOccurrence = async () => {
        if (!deleteMenu) return;
        const course = courses.find(c => c.id === deleteMenu.courseId);
        if (!course) return;

        const currentExcluded = course.excludedDates || [];
        await updateCourse(deleteMenu.courseId, {
            excludedDates: [...currentExcluded, deleteMenu.date]
        });
        closeDeleteMenu();
    };

    // Delete the entire course
    const handleDeleteEntireCourse = async () => {
        if (!deleteMenu) return;
        await deleteCourse(deleteMenu.courseId);
        closeDeleteMenu();
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

    // Helper to get the date string for a specific day in the current week
    const getDateForDayIndex = (dayIndex: number): string => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + (dayIndex - 1)); // dayIndex 1=Monday, so offset is dayIndex-1
        return date.toISOString().split('T')[0];
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
            {/* Parent Student Selector */}
            {user?.role === 'parent' && (
                <div className="lg:mb-0 mb-4 px-4 pt-4 lg:px-0 lg:pt-0">
                    <StudentSelector
                        onSelect={setSelectedChild}
                        selectedStudentId={selectedChild?.id}
                    />
                </div>
            )}

            {/* Mobile View - Day Schedule */}
            <div className="lg:hidden -mx-4 -mt-4 md:-mx-6 md:-mt-6 bg-gray-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-b-[2rem] shadow-lg mb-6 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2 text-white/80">
                            {/* Placeholder for menu toggle if needed, or just padding */}
                        </div>
                        <div className="flex gap-2">
                            <button className="text-white/80 hover:text-white p-2" onClick={() => setShowUpcomingModal(true)}>
                                <CalendarIcon size={24} />
                            </button>

                        </div>
                    </div>

                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-2 capitalize">
                                {mobileDate.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h1>
                            <p className="text-orange-100 font-medium text-lg">{t('schedule.mySchedule')}</p>
                        </div>

                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md mb-1 border border-white/30">
                            {user?.name.substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* Navigation Bar */}
                <div className="flex items-center justify-between px-6 mb-6">
                    <button onClick={handlePrevDay} className="p-3 bg-white dark:bg-slate-800 shadow-sm rounded-full text-gray-600 dark:text-slate-300 hover:text-orange-600">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-bold text-gray-500 dark:text-slate-400">
                        {mobileDate.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })}
                    </span>
                    <button onClick={handleNextDay} className="p-3 bg-white dark:bg-slate-800 shadow-sm rounded-full text-gray-600 dark:text-slate-300 hover:text-orange-600">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Timeline */}
                <div className="px-4 space-y-4 pb-24">
                    {mobileExams.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">{t('schedule.examEval')}</h3>
                            <div className="space-y-3">
                                {mobileExams.map(exam => (
                                    <div key={exam.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border-l-4 border-red-500 flex gap-4" onClick={() => canEdit && handleEditExam(exam)}>
                                        <div className="flex flex-col items-center justify-center min-w-[3rem] text-red-500 font-bold">
                                            <span>{new Date(exam.start).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 dark:text-white">{exam.title}</h4>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                <GraduationCap size={12} />
                                                <span>Examen</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mb-6">
                        {mobileCourses.length > 0 ? (
                            <div className="space-y-3">
                                {mobileCourses.map(course => (
                                    <div
                                        key={course.id}
                                        className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm flex gap-4 relative overflow-hidden group"
                                        onClick={() => canEdit && handleEditCourse(course)}
                                    >
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${subjectColors[course.subject]?.split(' ')[0] || 'bg-gray-500'}`}></div>

                                        <div className="flex flex-col min-w-[3rem]">
                                            <span className="font-bold text-gray-900 dark:text-white text-lg">
                                                {course.startTime.split(' - ')[0]}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {course.startTime.split(' - ')[1]}
                                            </span>
                                        </div>

                                        <div className="flex-1 pl-2">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-lg">{course.subject}</h4>
                                            <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                                                {course.room && <span className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-md text-gray-600 dark:text-slate-300">{course.room}</span>}
                                                {course.className && <span className="bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-md text-orange-600 dark:text-orange-400">{course.className}</span>}
                                            </div>
                                        </div>

                                        {canEdit && (
                                            <button
                                                className="absolute right-2 top-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                                                onClick={(e) => showDeleteMenu(e, course.id, mobileDate.toISOString().split('T')[0])}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <p>{t('schedule.noCourse') || "Aucun cours prévu"}</p>
                            </div>
                        )}
                    </div>

                    {/* Mobile Homework Section */}
                    {mobileHomeworks.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">
                                {t('schedule.homeworkDue') || 'Devoirs à rendre'}
                            </h3>
                            <div className="space-y-3">
                                {mobileHomeworks.map(hw => (
                                    <div
                                        key={hw.id}
                                        className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border-l-4 border-orange-500 flex gap-4 cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                                        onClick={() => { setSelectedHomework(hw); setShowHomeworkDetail(true); }}
                                    >
                                        <div className="flex flex-col items-center justify-center min-w-[3rem] text-orange-500 font-bold">
                                            <BookOpen size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 dark:text-white">{hw.title}</h4>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                <span className="bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-md text-orange-600 dark:text-orange-400">{hw.subject}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile FAB */}
                {canEdit && (
                    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 items-end">
                        {isFabOpen && (
                            <>
                                <button
                                    onClick={() => {
                                        handleAddExam();
                                        setIsFabOpen(false);
                                    }}
                                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg transform transition-all hover:bg-red-700 animate-in slide-in-from-bottom-5 fade-in duration-200"
                                >
                                    <span className="font-semibold text-sm">Examen</span>
                                    <GraduationCap size={20} />
                                </button>
                                <button
                                    onClick={() => {
                                        handleAddCourse();
                                        setIsFabOpen(false);
                                    }}
                                    className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-full shadow-lg transform transition-all hover:bg-orange-700 animate-in slide-in-from-bottom-2 fade-in duration-200"
                                >
                                    <span className="font-semibold text-sm">Cours</span>
                                    <BookOpen size={20} />
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => setIsFabOpen(!isFabOpen)}
                            className={`w-14 h-14 ${isFabOpen ? 'bg-gray-800' : 'bg-orange-600'} text-white rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transform transition-all duration-200`}
                        >
                            <Plus size={28} className={`transform transition-transform duration-200 ${isFabOpen ? 'rotate-45' : 'rotate-0'}`} />
                        </button>
                    </div>
                )}
            </div>

            <div className="hidden lg:flex flex-col md:flex-row md:justify-between md:items-center gap-4">
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
                                                className={`px-4 py-4 text-center text-sm font-bold border-r border-orange-200 dark:border-slate-600 ${currentDay === dayIndex ? 'bg-orange-300 dark:bg-orange-700 text-orange-900 dark:text-white' : 'text-gray-900 dark:text-white'
                                                    }`}
                                            >
                                                <div className="flex flex-col items-center">
                                                    <span className="drop-shadow-sm">{day}</span>
                                                    {currentDay === dayIndex && (
                                                        <span className="text-xs font-semibold text-white bg-orange-600 dark:bg-orange-500 px-2 py-0.5 rounded-full mt-1 shadow-sm">{t('schedule.today')}</span>
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
                                                                            onClick={(e) => showDeleteMenu(e, course.id, getDateForDayIndex(dayIndex))}
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
                                                        <div key={hw.id} className="text-xs p-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-sm text-left cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:border-orange-300 transition-colors" onClick={() => { setSelectedHomework(hw); setShowHomeworkDetail(true); }}>
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

            {/* Delete Course Menu */}
            {deleteMenu && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={closeDeleteMenu}
                    />
                    {/* Menu */}
                    <div
                        className="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 py-2 min-w-[200px]"
                        style={{ left: deleteMenu.x, top: deleteMenu.y }}
                    >
                        <button
                            onClick={handleDeleteThisOccurrence}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 flex items-center gap-2"
                        >
                            <span className="text-orange-500">📅</span>
                            {t('schedule.deleteThisOnly') || 'Supprimer que ce cours'}
                        </button>
                        <button
                            onClick={handleDeleteEntireCourse}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-700 text-red-600 dark:text-red-400 flex items-center gap-2"
                        >
                            <span>🗑️</span>
                            {t('schedule.deleteAll') || 'Supprimer tout'}
                        </button>
                        <hr className="my-1 border-gray-200 dark:border-slate-600" />
                        <button
                            onClick={closeDeleteMenu}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 flex items-center gap-2"
                        >
                            <span>❌</span>
                            {t('common.cancel') || 'Annuler'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Schedule;
