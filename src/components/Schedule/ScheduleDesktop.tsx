import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, GraduationCap, Clock, BookOpen, Trash2, Plus } from 'lucide-react';
import { Card, Button, Badge } from '../UI';
import type { UseScheduleDataReturn } from '../../hooks/useSchedule';
import type { TFunction, i18n } from 'i18next';
import type { Course, Event, Homework } from '../../types';

interface ScheduleDesktopProps {
    schedule: UseScheduleDataReturn & {
        setWeekOffset: (offset: number) => void;
        weekOffset: number;
        setShowUpcomingModal: (show: boolean) => void;
        handleAddCourse: () => void;
        handleAddExam: () => void;
        handleEditCourse: (course: Course) => void;
        handleEditExam: (exam: Event) => void;
        showDeleteMenu: (e: React.MouseEvent, courseId: string, date: string) => void;
        deleteMenu: { courseId: string; date: string; x: number; y: number } | null;
        setSelectedHomework: (hw: Homework | null) => void;
        setShowHomeworkDetail: (show: boolean) => void;
    };
    t: TFunction;
    i18n: i18n;
    days: string[];
}

const ScheduleDesktop: React.FC<ScheduleDesktopProps> = ({ schedule, t, i18n, days }) => {
    return (
        <>
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
                            {(() => {
                                // Track which cells are "occupied" by a rowSpan from a previous slot row
                                // Key: `${slotIndex}-${dayIndex}`, value: number of remaining rows to skip
                                const occupiedCells = new Map<string, number>();

                                return schedule.scheduleSlots.map((slot: any, slotIndex: number) => (
                                    <tr
                                        key={slotIndex}
                                        className="border-b dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-800/50"
                                    >
                                        <td className="py-2 px-4 text-sm text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap align-top">
                                            {slot.time}
                                        </td>
                                        {[1, 2, 3, 4, 5, 6, 7].map((dayIndex) => {
                                            // Check if this cell is occupied by a rowSpan from a previous row
                                            const cellKey = `${slotIndex}-${dayIndex}`;
                                            const remaining = occupiedCells.get(cellKey);
                                            if (remaining && remaining > 0) {
                                                // This cell is covered by a rowSpan from above — skip it
                                                // But mark the next row as still occupied
                                                if (remaining > 1) {
                                                    occupiedCells.set(`${slotIndex + 1}-${dayIndex}`, remaining - 1);
                                                }
                                                return null; // <td> is merged from above via rowSpan
                                            }

                                            const courseInfos = slot.courses[dayIndex] || [];
                                            const dayExams = slot.exams[dayIndex] || [];
                                            const isToday = schedule.currentDay === dayIndex && schedule.isCurrentWeek;
                                            const dateStr = schedule.getDateForDayIndex(dayIndex);

                                            // Filter to only courses that start in this slot (for rendering)
                                            const startingCourses = courseInfos.filter((ci: any) => ci.isStart);
                                            // Filter out excluded dates
                                            const visibleCourses = startingCourses.filter(
                                                (ci: any) => !ci.course.excludedDates?.includes(dateStr)
                                            );

                                            // Determine the max rowSpan for this cell (for the <td> rowSpan attribute)
                                            const maxRowSpan = visibleCourses.length > 0
                                                ? Math.max(...visibleCourses.map((ci: any) => ci.rowSpan))
                                                : 1;

                                            // Mark future rows as occupied if we're spanning
                                            if (maxRowSpan > 1) {
                                                for (let r = 1; r < maxRowSpan; r++) {
                                                    occupiedCells.set(`${slotIndex + r}-${dayIndex}`, maxRowSpan - r);
                                                }
                                            }

                                            // Each overlapping course is independently absolutely positioned.
                                            const ROW_H = 49;
                                            const tdHeightPx = maxRowSpan * ROW_H;

                                            return (
                                                <td
                                                    key={dayIndex}
                                                    rowSpan={maxRowSpan}
                                                    style={{ position: 'relative', height: `${tdHeightPx}px`, verticalAlign: 'top' }}
                                                    className={`py-1 px-1 align-top ${isToday ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}
                                                >
                                                    {/* Each overlapping course card is independently positioned */}
                                                    {visibleCourses.length > 0 && visibleCourses.map((ci: any) => {
                                                        const ciTopOff = ci.topOffsetFraction * ROW_H;
                                                        const ciBotCut = ci.bottomCutFraction * ROW_H;
                                                        const ciHeight = ci.rowSpan * ROW_H - ciTopOff - ciBotCut - 8;
                                                        const colW = 100 / ci.totalCols;
                                                        return (
                                                            <div
                                                                key={ci.course.id}
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: `${ciTopOff + 4}px`,
                                                                    height: `${ciHeight}px`,
                                                                    left: `calc(4px + ${ci.colIndex * colW}%)`,
                                                                    width: `calc(${colW}% - ${ci.totalCols > 1 ? 6 : 8}px)`,
                                                                }}
                                                                className={`p-1.5 rounded-lg text-xs border-l-4 cursor-pointer hover:shadow-md transition-shadow group flex flex-col overflow-hidden ${schedule.subjectColors[ci.course.subject] || 'bg-gray-500 text-white border-gray-600'}`}
                                                                onClick={() => schedule.canEdit && schedule.handleEditCourse(ci.course)}
                                                            >
                                                                <div className="font-semibold truncate">{ci.course.subject}</div>
                                                                <div className="opacity-80 text-[10px]">
                                                                    {ci.course.startTime} - {ci.course.endTime}
                                                                </div>
                                                                {ci.course.room && <div className="opacity-70 text-[10px]">{ci.course.room}</div>}
                                                                {/* Class name at bottom-right for teachers */}
                                                                {ci.course.className && (
                                                                    <div className="flex justify-end mt-auto">
                                                                        <span className="opacity-90 text-[10px] font-medium bg-white/20 px-1 rounded truncate">
                                                                            {ci.course.className}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {schedule.canEdit && (
                                                                    <button
                                                                        className="absolute -top-1 -right-1 p-1 bg-white dark:bg-slate-700 rounded-full shadow opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500"
                                                                        onClick={(e) => schedule.showDeleteMenu(e, ci.course.id, dateStr)}
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    {/* Exams */}
                                                    {dayExams.map((exam: any) => (
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
                                ));
                            })()}
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
                        {schedule.weekHomeworks.map((hw: any) => (
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
        </>
    );
};

export default ScheduleDesktop;
