import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Course, Event, Homework } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useAcademics, useCommunication, usePerformance } from '../../context/DataContext';
import { useSchedule } from '../../hooks/useSchedule';
import ScheduleMobile from '../../components/Schedule/ScheduleMobile';
import ScheduleDesktop from '../../components/Schedule/ScheduleDesktop';
import CourseModal from '../../components/Schedule/CourseModal';
import ExamModal from '../../components/Schedule/ExamModal';
import UpcomingEventsModal from '../../components/Schedule/UpcomingEventsModal';
import HomeworkDetailModal from '../../components/Schedule/HomeworkDetailModal';
import StudentSelector from '../../components/Common/StudentSelector';

const Schedule = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  // Modals & Navigation State
  const [weekOffset, setWeekOffset] = useState(0);
  const [mobileDate, setMobileDate] = useState(new Date());
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showUpcomingModal, setShowUpcomingModal] = useState(false);
  const [showHomeworkDetail, setShowHomeworkDetail] = useState(false);

  // Editing State
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingExam, setEditingExam] = useState<Event | null>(null);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

  const [deleteMenu, setDeleteMenu] = useState<{ courseId: string; date: string; x: number; y: number } | null>(null);
  const [selectedChild, setSelectedChild] = useState<{ id: string; name: string; classId: string } | null>(null);

  const { courses, addCourse, updateCourse, deleteCourse } = useAcademics();
  const { events, addEvent, updateEvent, deleteEvent } = useCommunication();
  const { homeworks } = usePerformance();

  const classId = user?.role === 'student' ? (user as { classId?: string }).classId : user?.role === 'parent' ? selectedChild?.classId : null;
  const scheduleData = useSchedule({ weekOffset, mobileDate, classId });

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

  const handleAddCourse = () => {
    setEditingCourse(null);
    setShowCourseModal(true);
  };

  const handleAddExam = () => {
    setEditingExam(null);
    setShowExamModal(true);
  };

  const handleEditCourse = (course: Course) => {
    if (!scheduleData.canEdit) return;
    setEditingCourse(course);
    setShowCourseModal(true);
  };

  const handleEditExam = (exam: Event) => {
    if (!scheduleData.canEdit) return;
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

  const showDeleteMenu = (e: React.MouseEvent, courseId: string, specificDate: string) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDeleteMenu({ courseId, date: specificDate, x: rect.left, y: rect.bottom + 5 });
  };

  const closeDeleteMenu = () => setDeleteMenu(null);

  const handleDeleteThisOccurrence = async () => {
    if (!deleteMenu) return;
    const course = courses.find((c) => c.id === deleteMenu.courseId);
    if (!course) return;
    await updateCourse(deleteMenu.courseId, {
      excludedDates: [...(course.excludedDates || []), deleteMenu.date],
    });
    closeDeleteMenu();
  };

  const handleDeleteEntireCourse = async () => {
    if (!deleteMenu) return;
    await deleteCourse(deleteMenu.courseId);
    closeDeleteMenu();
  };

  const handleDeleteExam = async (eventId: string) => {
    if (!scheduleData.canEdit) return;
    await deleteEvent(eventId);
  };

  const schedule = {
    ...scheduleData,
    weekOffset, setWeekOffset,
    mobileDate, setMobileDate,
    isFabOpen, setIsFabOpen,
    showCourseModal, setShowCourseModal,
    showExamModal, setShowExamModal,
    showUpcomingModal, setShowUpcomingModal,
    showHomeworkDetail, setShowHomeworkDetail,
    editingCourse, setEditingCourse,
    editingExam, setEditingExam,
    selectedHomework, setSelectedHomework,
    deleteMenu, setDeleteMenu,
    selectedChild, setSelectedChild,
    handlePrevDay, handleNextDay,
    handleAddCourse, handleAddExam,
    handleEditCourse, handleEditExam,
    handleSaveCourse, handleSaveExam,
    showDeleteMenu, closeDeleteMenu,
    handleDeleteThisOccurrence, handleDeleteEntireCourse, handleDeleteExam,
  };

  const days = [
    t('schedule.monday'),
    t('schedule.tuesday'),
    t('schedule.wednesday'),
    t('schedule.thursday'),
    t('schedule.friday'),
    t('schedule.saturday'),
    t('schedule.sunday'),
  ];

  return (
    <div className="space-y-6">
      {/* Parent Student Selector */}
      {user?.role === 'parent' && (
        <div className="lg:mb-0 mb-4 px-4 pt-4 lg:px-0 lg:pt-0">
          <StudentSelector
            onSelect={schedule.setSelectedChild}
            selectedStudentId={schedule.selectedChild?.id}
          />
        </div>
      )}

      {/* Mobile View */}
      <ScheduleMobile schedule={schedule} user={user} t={t} i18n={i18n} />

      {/* Desktop View */}
      <ScheduleDesktop schedule={schedule} t={t} i18n={i18n} days={days} />

      {/* Modals */}
      {schedule.canEdit && (
        <>
          <CourseModal
            isOpen={schedule.showCourseModal}
            onClose={() => schedule.setShowCourseModal(false)}
            onSave={schedule.handleSaveCourse}
            editingCourse={schedule.editingCourse}
            classId={classId || undefined}
            teacherId={user?.id || ''}
          />
          <ExamModal
            isOpen={schedule.showExamModal}
            onClose={() => schedule.setShowExamModal(false)}
            onSave={schedule.handleSaveExam}
            editingEvent={schedule.editingExam}
            classId={classId || undefined}
            teacherId={user?.id || ''}
          />
        </>
      )}

      <UpcomingEventsModal
        isOpen={schedule.showUpcomingModal}
        onClose={() => schedule.setShowUpcomingModal(false)}
        events={events}
        homeworks={homeworks}
      />
      <HomeworkDetailModal
        isOpen={schedule.showHomeworkDetail}
        onClose={() => {
          schedule.setShowHomeworkDetail(false);
          schedule.setSelectedHomework(null);
        }}
        homework={schedule.selectedHomework}
      />

      {/* Delete Menu */}
      {schedule.deleteMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={schedule.closeDeleteMenu} />
          <div
            className="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border py-2 min-w-[200px]"
            style={{ left: schedule.deleteMenu.x, top: schedule.deleteMenu.y }}
          >
            <button
              onClick={schedule.handleDeleteThisOccurrence}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 flex items-center gap-2"
            >
              <span className="text-orange-500">📅</span>
              {t('schedule.deleteThisOnly') || 'Supprimer que ce cours'}
            </button>
            <button
              onClick={schedule.handleDeleteEntireCourse}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-700 text-red-600 flex items-center gap-2"
            >
              <span>🗑️</span>
              {t('schedule.deleteAll') || 'Supprimer tout'}
            </button>
            <hr className="my-1 border-gray-200 dark:border-slate-600" />
            <button
              onClick={schedule.closeDeleteMenu}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 flex items-center gap-2"
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
