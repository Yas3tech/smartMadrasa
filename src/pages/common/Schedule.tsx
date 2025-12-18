/**
 * Schedule Page - Refactored with useSchedule hook
 *
 * Uses the useSchedule hook for all business logic.
 * Contains UI for both mobile and desktop views.
 */

import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useSchedule } from '../../hooks/useSchedule';
import { Card, Button, Badge } from '../../components/UI';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  GraduationCap,
  Trash2,
  BookOpen,
  Clock,
} from 'lucide-react';
import CourseModal from '../../components/Schedule/CourseModal';
import ExamModal from '../../components/Schedule/ExamModal';
import UpcomingEventsModal from '../../components/Schedule/UpcomingEventsModal';
import HomeworkDetailModal from '../../components/Schedule/HomeworkDetailModal';
import StudentSelector from '../../components/Common/StudentSelector';

const Schedule = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { events, homeworks } = useData();
  const schedule = useSchedule();

  const days = [
    t('schedule.monday'),
    t('schedule.tuesday'),
    t('schedule.wednesday'),
    t('schedule.thursday'),
    t('schedule.friday'),
    t('schedule.saturday'),
    t('schedule.sunday'),
  ];

  // Get classId for modals
  const getUserClassId = () => {
    if (user?.role === 'student') return (user as { classId?: string }).classId;
    if (user?.role === 'parent') return schedule.selectedChild?.classId;
    return null;
  };
  const classId = getUserClassId();

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
      <div className="lg:hidden -mx-4 -mt-4 md:-mx-6 md:-mt-6 bg-gray-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
        {/* Mobile Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-b-[2rem] shadow-lg mb-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2 text-white/80" />
            <button
              className="text-white/80 hover:text-white p-2"
              onClick={() => schedule.setShowUpcomingModal(true)}
            >
              <CalendarIcon size={24} />
            </button>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1 capitalize">
                {schedule.mobileDate.toLocaleDateString(i18n.language, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h1>
              <p className="text-orange-100 font-medium text-lg">{t('schedule.mySchedule')}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md mb-1 border border-white/30">
              {user?.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center justify-between px-6 mb-6">
          <button
            onClick={schedule.handlePrevDay}
            className="p-3 bg-white dark:bg-slate-800 shadow-sm rounded-full text-gray-600 dark:text-slate-300 hover:text-orange-600"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold text-gray-500 dark:text-slate-400">
            {schedule.mobileDate.toLocaleDateString(i18n.language, {
              day: 'numeric',
              month: 'short',
            })}
          </span>
          <button
            onClick={schedule.handleNextDay}
            className="p-3 bg-white dark:bg-slate-800 shadow-sm rounded-full text-gray-600 dark:text-slate-300 hover:text-orange-600"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Mobile Content */}
        <div className="px-4 space-y-4 pb-24">
          {/* Mobile Exams */}
          {schedule.mobileExams.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">
                {t('schedule.examEval')}
              </h3>
              <div className="space-y-3">
                {schedule.mobileExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border-l-4 border-red-500 flex gap-4"
                    onClick={() => schedule.canEdit && schedule.handleEditExam(exam)}
                  >
                    <div className="flex flex-col items-center justify-center min-w-[3rem] text-red-500 font-bold">
                      <span>
                        {new Date(exam.start).toLocaleTimeString(i18n.language, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
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

          {/* Mobile Courses */}
          <div className="mb-6">
            {schedule.mobileCourses.length > 0 ? (
              <div className="space-y-3">
                {schedule.mobileCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm flex gap-4 relative overflow-hidden group"
                    onClick={() => schedule.canEdit && schedule.handleEditCourse(course)}
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${schedule.subjectColors[course.subject]?.split(' ')[0] || 'bg-gray-500'}`}
                    ></div>
                    <div className="flex flex-col min-w-[3rem]">
                      <span className="font-bold text-gray-900 dark:text-white text-lg">
                        {course.startTime}
                      </span>
                    </div>
                    <div className="flex-1 pl-2">
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                        {course.subject}
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                        {course.room && (
                          <span className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                            {course.room}
                          </span>
                        )}
                        {course.className && (
                          <span className="bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-md text-orange-600">
                            {course.className}
                          </span>
                        )}
                      </div>
                    </div>
                    {schedule.canEdit && (
                      <button
                        className="absolute right-2 top-2 p-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                        onClick={(e) =>
                          schedule.showDeleteMenu(
                            e,
                            course.id,
                            schedule.mobileDate.toISOString().split('T')[0]
                          )
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p>{t('schedule.noCourse') || 'Aucun cours prévu'}</p>
              </div>
            )}
          </div>

          {/* Mobile Homeworks */}
          {schedule.mobileHomeworks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">
                {t('schedule.homeworkDue') || 'Devoirs à rendre'}
              </h3>
              <div className="space-y-3">
                {schedule.mobileHomeworks.map((hw) => (
                  <div
                    key={hw.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border-l-4 border-orange-500 flex gap-4 cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    onClick={() => {
                      schedule.setSelectedHomework(hw);
                      schedule.setShowHomeworkDetail(true);
                    }}
                  >
                    <div className="flex flex-col items-center justify-center min-w-[3rem] text-orange-500 font-bold">
                      <BookOpen size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white">{hw.title}</h4>
                      <span className="bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-md text-xs text-orange-600">
                        {hw.subject}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile FAB */}
        {schedule.canEdit && (
          <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 items-end">
            {schedule.isFabOpen && (
              <>
                <button
                  onClick={() => {
                    schedule.handleAddExam();
                    schedule.setIsFabOpen(false);
                  }}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-red-700"
                >
                  <span className="font-semibold text-sm">Examen</span>
                  <GraduationCap size={20} />
                </button>
                <button
                  onClick={() => {
                    schedule.handleAddCourse();
                    schedule.setIsFabOpen(false);
                  }}
                  className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-orange-700"
                >
                  <span className="font-semibold text-sm">Cours</span>
                  <BookOpen size={20} />
                </button>
              </>
            )}
            <button
              onClick={() => schedule.setIsFabOpen(!schedule.isFabOpen)}
              className={`w-14 h-14 ${schedule.isFabOpen ? 'bg-gray-800' : 'bg-orange-600'} text-white rounded-full shadow-lg flex items-center justify-center hover:opacity-90`}
            >
              <Plus
                size={28}
                className={`transform transition-transform ${schedule.isFabOpen ? 'rotate-45' : 'rotate-0'}`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('schedule.mySchedule')}
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            {t('schedule.academicYear', { year: '2024-2025' })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            icon={ChevronLeft}
            onClick={() => schedule.setWeekOffset(schedule.weekOffset - 1)}
            className="px-3"
          />
          <div className="flex flex-col items-center min-w-[200px]">
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-xl">
              <CalendarIcon className="text-orange-600" size={20} />
              <span className="font-semibold text-orange-700">{schedule.getWeekRange()}</span>
            </div>
            {!schedule.isCurrentWeek && (
              <button
                onClick={() => schedule.setWeekOffset(0)}
                className="text-xs text-orange-600 hover:text-orange-700 mt-1 font-medium"
              >
                {t('schedule.backToCurrentWeek')}
              </button>
            )}
          </div>
          <Button
            variant="secondary"
            icon={ChevronRight}
            onClick={() => schedule.setWeekOffset(schedule.weekOffset + 1)}
            className="px-3"
          />
          <Button
            variant="secondary"
            icon={CalendarIcon}
            onClick={() => schedule.setShowUpcomingModal(true)}
          >
            {t('schedule.upcoming')}
          </Button>
          {schedule.canEdit && (
            <div className="flex gap-2">
              <Button variant="primary" icon={Plus} onClick={schedule.handleAddCourse}>
                {t('schedule.course')}
              </Button>
              <Button
                variant="primary"
                icon={GraduationCap}
                onClick={schedule.handleAddExam}
                className="bg-red-600 hover:bg-red-700"
              >
                {t('schedule.examEval')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Schedule Grid */}
      <div className="hidden lg:block">
        <Card className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800">
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 dark:text-slate-300 w-24 border-b dark:border-slate-700">
                  <Clock size={16} className="inline mr-2" />
                  {t('schedule.timeLabel')}
                </th>
                {days.map((day, index) => (
                  <th
                    key={day}
                    className={`py-3 px-2 text-center text-sm font-semibold border-b dark:border-slate-700 ${schedule.currentDay === index + 1 && schedule.isCurrentWeek ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'text-gray-600 dark:text-slate-300'}`}
                  >
                    <div>{day}</div>
                    <div className="text-xs font-normal text-gray-400 mt-1">
                      {new Date(
                        new Date(schedule.weekStart).setDate(schedule.weekStart.getDate() + index)
                      ).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })}
                    </div>
                    {/* Homeworks for day */}
                    {schedule.getHomeworksForDay(index + 1).length > 0 && (
                      <div className="mt-1">
                        <Badge variant="warning" className="text-xs">
                          📚 {schedule.getHomeworksForDay(index + 1).length}
                        </Badge>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.scheduleSlots.map((slot, slotIndex) => (
                <tr
                  key={slotIndex}
                  className="border-b dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-800/50"
                >
                  <td className="py-2 px-4 text-sm text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap">
                    {slot.time}
                  </td>
                  {[1, 2, 3, 4, 5, 6, 7].map((dayIndex) => {
                    const course = slot.courses[dayIndex];
                    const dayExams = slot.exams[dayIndex];
                    const isToday = schedule.currentDay === dayIndex && schedule.isCurrentWeek;
                    const dateStr = schedule.getDateForDayIndex(dayIndex);
                    const isExcluded = course?.excludedDates?.includes(dateStr);

                    if (isExcluded) {
                      return (
                        <td
                          key={dayIndex}
                          className={`py-2 px-1 ${isToday ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}
                        ></td>
                      );
                    }

                    return (
                      <td
                        key={dayIndex}
                        className={`py-2 px-1 ${isToday ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}
                      >
                        {course && (
                          <div
                            className={`p-2 rounded-lg text-xs border-l-4 cursor-pointer hover:shadow-md transition-shadow group relative ${schedule.subjectColors[course.subject] || 'bg-gray-500 text-white border-gray-600'}`}
                            onClick={() => schedule.canEdit && schedule.handleEditCourse(course)}
                          >
                            <div className="font-semibold truncate">{course.subject}</div>
                            {course.room && <div className="opacity-80">{course.room}</div>}
                            {schedule.canEdit && (
                              <button
                                className="absolute -top-1 -right-1 p-1 bg-white dark:bg-slate-700 rounded-full shadow opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500"
                                onClick={(e) => schedule.showDeleteMenu(e, course.id, dateStr)}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        )}
                        {dayExams.map((exam) => (
                          <div
                            key={exam.id}
                            className="p-2 rounded-lg text-xs bg-red-500 text-white border-l-4 border-red-600 mt-1 cursor-pointer hover:shadow-md"
                            onClick={() => schedule.canEdit && schedule.handleEditExam(exam)}
                          >
                            <div className="font-semibold truncate">{exam.title}</div>
                            <div className="opacity-80 flex items-center gap-1">
                              <GraduationCap size={10} /> Examen
                            </div>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Desktop Homework Footer */}
      <div className="hidden lg:block mt-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="text-orange-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('schedule.homeworkDue')}
          </h2>
        </div>

        {schedule.weekHomeworks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedule.weekHomeworks.map((hw) => (
              <div
                key={hw.id}
                className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-orange-500 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  schedule.setSelectedHomework(hw);
                  schedule.setShowHomeworkDetail(true);
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 px-2 py-0.5 rounded text-xs font-semibold">
                    {hw.subject}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    {new Date(hw.dueDate).toLocaleDateString(i18n.language, {
                      weekday: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                  {hw.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2">
                  {hw.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-8 text-center text-gray-500 dark:text-slate-400">
            <p>{t('events.noEvents')}</p>
          </div>
        )}
      </div>

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
