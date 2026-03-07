import React from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Trash2,
  Plus,
} from 'lucide-react';
import type { Course } from '../../types';

interface ScheduleMobileProps {
  schedule: any;
  user: any;
  t: any;
  i18n: any;
}

const ScheduleMobile: React.FC<ScheduleMobileProps> = ({ schedule, user, t, i18n }) => {
  const noCourseText = i18n.language.startsWith('nl')
    ? 'Geen les gepland'
    : i18n.language.startsWith('ar')
      ? 'لا توجد دروس مبرمجة'
      : 'Aucun cours prevu';
  const homeworkDueText = i18n.language.startsWith('nl')
    ? 'Huiswerk in te dienen'
    : i18n.language.startsWith('ar')
      ? 'واجبات يجب تسليمها'
      : 'Devoirs a rendre';
  const examText = i18n.language.startsWith('nl')
    ? 'Examen'
    : i18n.language.startsWith('ar')
      ? 'امتحان'
      : 'Examen';
  const courseText = i18n.language.startsWith('nl')
    ? 'Les'
    : i18n.language.startsWith('ar')
      ? 'درس'
      : 'Cours';

  return (
    <div className="lg:hidden -mx-4 -mt-4 md:-mx-6 md:-mt-6 bg-gray-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
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

      <div className="px-4 space-y-4 pb-24">
        {schedule.mobileExams.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">
              {t('schedule.examEval')}
            </h3>
            <div className="space-y-3">
              {schedule.mobileExams.map((exam: any) => (
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
                      <span>{examText}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          {schedule.mobileCourses.length > 0 ? (
            <div className="space-y-3">
              {(() => {
                const groups: Course[][] = [];
                const sorted = [...schedule.mobileCourses] as Course[];
                let i = 0;
                while (i < sorted.length) {
                  const group: Course[] = [sorted[i]];
                  const groupEndMin = (() => {
                    const [h, m] = sorted[i].endTime.split(':').map(Number);
                    return h * 60 + m;
                  })();
                  let maxEnd = groupEndMin;
                  let j = i + 1;
                  while (j < sorted.length) {
                    const [sh, sm] = sorted[j].startTime.split(':').map(Number);
                    const startMin = sh * 60 + sm;
                    if (startMin < maxEnd) {
                      group.push(sorted[j]);
                      const [eh, em] = sorted[j].endTime.split(':').map(Number);
                      maxEnd = Math.max(maxEnd, eh * 60 + em);
                      j++;
                    } else break;
                  }
                  groups.push(group);
                  i = j;
                }
                return groups.map((group, gIdx) => (
                  <div key={gIdx} className="flex gap-2">
                    {group.map((course) => (
                      <div
                        key={course.id}
                        style={{ width: group.length > 1 ? `${100 / group.length}%` : '100%' }}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm flex flex-col relative overflow-hidden group"
                        onClick={() => schedule.canEdit && schedule.handleEditCourse(course)}
                      >
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1.5 ${schedule.subjectColors[course.subject]?.split(' ')[0] || 'bg-gray-500'}`}
                        ></div>
                        <div className="flex gap-3 pl-2">
                          <div className="flex flex-col min-w-[3rem]">
                            <span className="font-bold text-gray-900 dark:text-white text-lg">
                              {course.startTime}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {course.endTime}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                              {course.subject}
                            </h4>
                            {course.room && (
                              <span className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-md text-xs text-gray-500">
                                {course.room}
                              </span>
                            )}
                          </div>
                        </div>
                        {course.className && (
                          <div className="flex justify-end mt-2 pl-2">
                            <span className="bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-md text-xs text-orange-600 font-medium">
                              {course.className}
                            </span>
                          </div>
                        )}
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
                ));
              })()}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>{t('schedule.noCourse') || noCourseText}</p>
            </div>
          )}
        </div>

        {schedule.mobileHomeworks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">
              {t('schedule.homeworkDue') || homeworkDueText}
            </h3>
            <div className="space-y-3">
              {schedule.mobileHomeworks.map((hw: any) => (
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
                <span className="font-semibold text-sm">{examText}</span>
                <GraduationCap size={20} />
              </button>
              <button
                onClick={() => {
                  schedule.handleAddCourse();
                  schedule.setIsFabOpen(false);
                }}
                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-orange-700"
              >
                <span className="font-semibold text-sm">{courseText}</span>
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
  );
};

export default ScheduleMobile;
