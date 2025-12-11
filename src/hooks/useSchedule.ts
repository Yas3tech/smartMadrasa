import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import type { Course, Event, Homework } from '../types';

export interface ScheduleSlot {
    time: string;
    courses: { [key: number]: Course | null };
    exams: { [key: number]: Event[] };
}

export interface UseScheduleReturn {
    // Week navigation
    weekOffset: number;
    setWeekOffset: (offset: number) => void;
    weekStart: Date;
    getWeekRange: () => string;
    isCurrentWeek: boolean;

    // Mobile navigation
    mobileDate: Date;
    setMobileDate: (date: Date) => void;
    handlePrevDay: () => void;
    handleNextDay: () => void;
    isFabOpen: boolean;
    setIsFabOpen: (open: boolean) => void;

    // Modals
    showCourseModal: boolean;
    setShowCourseModal: (show: boolean) => void;
    showExamModal: boolean;
    setShowExamModal: (show: boolean) => void;
    showUpcomingModal: boolean;
    setShowUpcomingModal: (show: boolean) => void;
    showHomeworkDetail: boolean;
    setShowHomeworkDetail: (show: boolean) => void;

    // Edit state
    editingCourse: Course | null;
    editingExam: Event | null;
    selectedHomework: Homework | null;
    setSelectedHomework: (hw: Homework | null) => void;

    // Delete menu
    deleteMenu: { courseId: string; date: string; x: number; y: number } | null;
    showDeleteMenu: (e: React.MouseEvent, courseId: string, specificDate: string) => void;
    closeDeleteMenu: () => void;

    // Parent
    selectedChild: { id: string; name: string; classId: string } | null;
    setSelectedChild: (child: { id: string; name: string; classId: string } | null) => void;

    // Data
    scheduleSlots: ScheduleSlot[];
    weekHomeworks: Homework[];
    mobileCourses: Course[];
    mobileExams: Event[];
    mobileHomeworks: Homework[];

    // Handlers
    handleAddCourse: () => void;
    handleAddExam: () => void;
    handleEditCourse: (course: Course) => void;
    handleEditExam: (exam: Event) => void;
    handleSaveCourse: (courseData: Omit<Course, 'id'>) => Promise<void>;
    handleSaveExam: (eventData: Omit<Event, 'id'>) => Promise<void>;
    handleDeleteThisOccurrence: () => Promise<void>;
    handleDeleteEntireCourse: () => Promise<void>;
    handleDeleteExam: (eventId: string) => Promise<void>;
    getHomeworksForDay: (dayIndex: number) => Homework[];
    getDateForDayIndex: (dayIndex: number) => string;

    // Utilities
    subjectColors: Record<string, string>;
    currentDay: number;
    canEdit: boolean;
}

export function useSchedule(): UseScheduleReturn {
    const { i18n } = useTranslation();
    const { user } = useAuth();
    const {
        courses, events, homeworks, classes,
        addCourse, updateCourse, deleteCourse,
        addEvent, updateEvent, deleteEvent
    } = useData();

    // Week navigation
    const [weekOffset, setWeekOffset] = useState(0);

    // Mobile state
    const [mobileDate, setMobileDate] = useState(new Date());
    const [isFabOpen, setIsFabOpen] = useState(false);

    // Modals
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showExamModal, setShowExamModal] = useState(false);
    const [showUpcomingModal, setShowUpcomingModal] = useState(false);
    const [showHomeworkDetail, setShowHomeworkDetail] = useState(false);

    // Edit state
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [editingExam, setEditingExam] = useState<Event | null>(null);
    const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

    // Delete menu
    const [deleteMenu, setDeleteMenu] = useState<{ courseId: string; date: string; x: number; y: number } | null>(null);

    // Parent state
    const [selectedChild, setSelectedChild] = useState<{ id: string; name: string; classId: string } | null>(null);

    // Week utilities
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
    const isCurrentWeek = weekOffset === 0;

    const getWeekRange = () => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const formatDate = (date: Date) => date.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
        return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
    };

    // Mobile navigation
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

    // Get classId
    const getUserClassId = () => {
        if (user?.role === 'student') return (user as { classId?: string }).classId;
        if (user?.role === 'parent') return selectedChild?.classId;
        return null;
    };
    const classId = getUserClassId();

    // Filtered data
    const userCourses = useMemo(() => {
        if ((user?.role === 'student' || user?.role === 'parent') && classId) {
            return courses.filter(c => c.classId === classId);
        } else if (user?.role === 'teacher') {
            return courses.filter(c => c.teacherId === user.id);
        } else if (user?.role === 'director' || user?.role === 'superadmin') {
            return courses;
        }
        return [];
    }, [courses, user, classId]);

    const userExams = useMemo(() => {
        return events.filter(e => {
            if (e.type !== 'exam' && e.type !== 'evaluation') return false;
            if ((user?.role === 'student' || user?.role === 'parent') && classId) {
                return e.classId === classId;
            }
            if (user?.role === 'teacher') {
                const teacherClassIds = classes.filter(c => c.teacherId === user.id).map(c => c.id);
                return !!e.classId && teacherClassIds.includes(e.classId);
            }
            return user?.role === 'director' || user?.role === 'superadmin';
        });
    }, [events, user, classId, classes]);

    const userHomeworks = useMemo(() => {
        return homeworks.filter(h =>
            ((user?.role === 'student' || user?.role === 'parent') && h.classId === classId) ||
            (user?.role === 'teacher' && h.assignedBy === user.name) ||
            (user?.role === 'director' || user?.role === 'superadmin')
        );
    }, [homeworks, user, classId]);



    // Week filtered data
    const weekCourses = useMemo(() => {
        const weekStartTs = weekStart.getTime();
        const weekEndTs = new Date(weekStart).setDate(weekStart.getDate() + 6);

        return userCourses.filter(course => {
            if (course.isRecurring) {
                if (course.recurrenceStart && new Date(course.recurrenceStart).getTime() > weekEndTs) return false;
                if (course.recurrenceEnd && new Date(course.recurrenceEnd).getTime() < weekStartTs) return false;
                return true;
            }
            if (course.specificDate) {
                const courseTime = new Date(course.specificDate).getTime();
                return courseTime >= weekStartTs && courseTime <= weekEndTs;
            }
            return false;
        });
    }, [userCourses, weekStart]);

    const weekExams = useMemo(() => {
        const weekStartTs = weekStart.getTime();
        const weekEndTs = new Date(weekStart).setDate(weekStart.getDate() + 7);
        return userExams.filter(exam => {
            const examTime = new Date(exam.start).getTime();
            return examTime >= weekStartTs && examTime < weekEndTs;
        });
    }, [userExams, weekStart]);

    const weekHomeworks = useMemo(() => {
        const weekStartTs = weekStart.getTime();
        const weekEndTs = new Date(weekStart).setDate(weekStart.getDate() + 7);
        return userHomeworks.filter(hw => {
            const dueDate = new Date(hw.dueDate).getTime();
            return dueDate >= weekStartTs && dueDate < weekEndTs;
        });
    }, [userHomeworks, weekStart]);

    // Mobile data
    const mobileCourses = useMemo(() => {
        const dayIndex = mobileDate.getDay() || 7;
        const dateTs = mobileDate.getTime();
        const currentDateStr = mobileDate.toISOString().split('T')[0];

        return userCourses.filter(course => {
            if (course.dayOfWeek !== dayIndex) return false;
            if (course.excludedDates?.includes(currentDateStr)) return false;
            if (course.isRecurring) {
                if (course.recurrenceStart && new Date(course.recurrenceStart).getTime() > dateTs) return false;
                if (course.recurrenceEnd && new Date(course.recurrenceEnd).getTime() < dateTs) return false;
                return true;
            }
            if (course.specificDate) {
                return new Date(course.specificDate).toDateString() === mobileDate.toDateString();
            }
            return false;
        }).sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [userCourses, mobileDate]);

    const mobileExams = useMemo(() => {
        return userExams.filter(exam => new Date(exam.start).toDateString() === mobileDate.toDateString())
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }, [userExams, mobileDate]);

    const mobileHomeworks = useMemo(() => {
        return userHomeworks.filter(hw => new Date(hw.dueDate).toDateString() === mobileDate.toDateString());
    }, [userHomeworks, mobileDate]);

    // Schedule slots
    const scheduleSlots: ScheduleSlot[] = useMemo(() => {
        const timeSlots = [
            '08:00 - 09:00', '09:00 - 10:00', '10:00 - 10:15', '10:15 - 11:15',
            '11:15 - 12:15', '12:15 - 13:30', '13:30 - 14:30', '14:30 - 15:30',
            '15:30 - 16:30', '16:30 - 17:30'
        ];

        return timeSlots.map(time => {
            const slot: ScheduleSlot = {
                time,
                courses: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null },
                exams: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] }
            };

            const [slotStart] = time.split(' - ');

            weekCourses.forEach(course => {
                if (course.startTime === slotStart) {
                    slot.courses[course.dayOfWeek] = course;
                }
            });

            weekExams.forEach(exam => {
                const examDate = new Date(exam.start);
                let dayOfWeek = examDate.getDay();
                if (dayOfWeek === 0) dayOfWeek = 7;
                const examTime = examDate.toTimeString().slice(0, 5);
                if (examTime === slotStart) {
                    slot.exams[dayOfWeek].push(exam);
                }
            });

            return slot;
        });
    }, [weekCourses, weekExams]);

    // Subject colors
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

    const currentDay = new Date().getDay() || 7;
    const canEdit = user?.role === 'teacher' || user?.role === 'director' || user?.role === 'superadmin';

    // Handlers
    const handleAddCourse = () => { setEditingCourse(null); setShowCourseModal(true); };
    const handleAddExam = () => { setEditingExam(null); setShowExamModal(true); };

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

    const showDeleteMenuFn = (e: React.MouseEvent, courseId: string, specificDate: string) => {
        e.stopPropagation();
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setDeleteMenu({ courseId, date: specificDate, x: rect.left, y: rect.bottom + 5 });
    };

    const closeDeleteMenu = () => setDeleteMenu(null);

    const handleDeleteThisOccurrence = async () => {
        if (!deleteMenu) return;
        const course = courses.find(c => c.id === deleteMenu.courseId);
        if (!course) return;
        await updateCourse(deleteMenu.courseId, {
            excludedDates: [...(course.excludedDates || []), deleteMenu.date]
        });
        closeDeleteMenu();
    };

    const handleDeleteEntireCourse = async () => {
        if (!deleteMenu) return;
        await deleteCourse(deleteMenu.courseId);
        closeDeleteMenu();
    };

    const handleDeleteExam = async (eventId: string) => {
        if (!canEdit) return;
        await deleteEvent(eventId);
    };

    const getHomeworksForDay = (dayIndex: number) => {
        return weekHomeworks.filter(hw => {
            const date = new Date(hw.dueDate);
            let day = date.getDay();
            if (day === 0) day = 7;
            return day === dayIndex;
        });
    };

    const getDateForDayIndex = (dayIndex: number): string => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + (dayIndex - 1));
        return date.toISOString().split('T')[0];
    };

    return {
        weekOffset, setWeekOffset, weekStart, getWeekRange, isCurrentWeek,
        mobileDate, setMobileDate, handlePrevDay, handleNextDay, isFabOpen, setIsFabOpen,
        showCourseModal, setShowCourseModal, showExamModal, setShowExamModal,
        showUpcomingModal, setShowUpcomingModal, showHomeworkDetail, setShowHomeworkDetail,
        editingCourse, editingExam, selectedHomework, setSelectedHomework,
        deleteMenu, showDeleteMenu: showDeleteMenuFn, closeDeleteMenu,
        selectedChild, setSelectedChild,
        scheduleSlots, weekHomeworks, mobileCourses, mobileExams, mobileHomeworks,
        handleAddCourse, handleAddExam, handleEditCourse, handleEditExam,
        handleSaveCourse, handleSaveExam, handleDeleteThisOccurrence,
        handleDeleteEntireCourse, handleDeleteExam, getHomeworksForDay, getDateForDayIndex,
        subjectColors, currentDay, canEdit
    };
}
