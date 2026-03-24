import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useAcademics, useCommunication, usePerformance } from '../context/DataContext';
import type { Course, Event, Homework } from '../types';
import { SUBJECT_COLORS } from '../constants/subjectColors';

export interface CourseSlotInfo {
  course: Course;
  isStart: boolean;
  rowSpan: number;
  colIndex: number;
  totalCols: number;
  /** 0–1: how far into the FIRST slot the course starts (for top offset) */
  topOffsetFraction: number;
  /** 0–1: how much of the LAST slot is NOT covered by the course (for bottom trim) */
  bottomCutFraction: number;
}

export interface ScheduleSlot {
  time: string;
  startMinutes: number;
  endMinutes: number;
  courses: { [dayOfWeek: number]: CourseSlotInfo[] };
  exams: { [key: number]: Event[] };
}

export interface UseScheduleProps {
  weekOffset: number;
  mobileDate: Date;
  classId: string | null | undefined;
}

export interface UseScheduleDataReturn {
  weekStart: Date;
  getWeekRange: () => string;
  isCurrentWeek: boolean;

  scheduleSlots: ScheduleSlot[];
  timeSlotStrings: string[];
  weekHomeworks: Homework[];
  mobileCourses: Course[];
  mobileExams: Event[];
  mobileHomeworks: Homework[];

  getHomeworksForDay: (dayIndex: number) => Homework[];
  getDateForDayIndex: (dayIndex: number) => string;

  subjectColors: Record<string, string>;
  currentDay: number;
  canEdit: boolean;
}

export function useSchedule({ weekOffset, mobileDate, classId }: UseScheduleProps): UseScheduleDataReturn {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const { courses, classes } = useAcademics();
  const { events } = useCommunication();
  const { homeworks } = usePerformance();

  // Week utilities
  const getWeekStart = (offset: number) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff + offset * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const weekStart = getWeekStart(weekOffset);
  const isCurrentWeek = weekOffset === 0;

  const getWeekRange = () => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const formatDate = (date: Date) =>
      date.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  };

  // Filtered data
  const userCourses = useMemo(() => {
    if ((user?.role === 'student' || user?.role === 'parent') && classId) {
      return courses.filter((c) => c.classId === classId);
    } else if (user?.role === 'teacher') {
      return courses.filter((c) => c.teacherId === user.id);
    } else if (user?.role === 'director' || user?.role === 'superadmin') {
      return courses;
    }
    return [];
  }, [courses, user, classId]);

  const userExams = useMemo(() => {
    return events.filter((e) => {
      if (e.type !== 'exam' && e.type !== 'evaluation') return false;
      if ((user?.role === 'student' || user?.role === 'parent') && classId) {
        return e.classId === classId;
      }
      if (user?.role === 'teacher') {
        const teacherClassIds = classes.filter((c) => c.teacherId === user.id).map((c) => c.id);
        return !!e.classId && teacherClassIds.includes(e.classId);
      }
      return user?.role === 'director' || user?.role === 'superadmin';
    });
  }, [events, user, classId, classes]);

  const userHomeworks = useMemo(() => {
    return homeworks.filter(
      (h) =>
        ((user?.role === 'student' || user?.role === 'parent') && h.classId === classId) ||
        (user?.role === 'teacher' && h.assignedBy === user.name) ||
        user?.role === 'director' ||
        user?.role === 'superadmin'
    );
  }, [homeworks, user, classId]);

  // Week filtered data
  const weekCourses = useMemo(() => {
    const weekStartTs = weekStart.getTime();
    const weekEndTs = new Date(weekStart).setDate(weekStart.getDate() + 6);

    return userCourses.filter((course) => {
      if (course.isRecurring) {
        if (course.recurrenceStart && new Date(course.recurrenceStart).getTime() > weekEndTs)
          return false;
        if (course.recurrenceEnd && new Date(course.recurrenceEnd).getTime() < weekStartTs)
          return false;
        return true;
      }
      if (course.specificDate) {
        const courseTime = new Date(course.specificDate).getTime();
        return courseTime >= weekStartTs && courseTime <= weekEndTs;
      }
      // Fallback: course has no recurrence info and no specific date → treat as always-recurring
      return true;
    });
  }, [userCourses, weekStart]);

  const weekExams = useMemo(() => {
    const weekStartTs = weekStart.getTime();
    const weekEndTs = new Date(weekStart).setDate(weekStart.getDate() + 7);
    return userExams.filter((exam) => {
      const examTime = new Date(exam.start).getTime();
      return examTime >= weekStartTs && examTime < weekEndTs;
    });
  }, [userExams, weekStart]);

  const weekHomeworks = useMemo(() => {
    const weekStartTs = weekStart.getTime();
    const weekEndTs = new Date(weekStart).setDate(weekStart.getDate() + 7);
    return userHomeworks.filter((hw) => {
      const dueDate = new Date(hw.dueDate).getTime();
      return dueDate >= weekStartTs && dueDate < weekEndTs;
    });
  }, [userHomeworks, weekStart]);

  // Mobile data
  const mobileCourses = useMemo(() => {
    const dayIndex = mobileDate.getDay() || 7;
    const dateTs = mobileDate.getTime();
    const currentDateStr = mobileDate.toISOString().split('T')[0];
    const targetDateStr = mobileDate.toDateString();

    return userCourses
      .filter((course) => {
        if (course.dayOfWeek !== dayIndex) return false;
        if (course.excludedDates?.includes(currentDateStr)) return false;
        if (course.isRecurring) {
          if (course.recurrenceStart && new Date(course.recurrenceStart).getTime() > dateTs)
            return false;
          if (course.recurrenceEnd && new Date(course.recurrenceEnd).getTime() < dateTs)
            return false;
          return true;
        }
        if (course.specificDate) {
          // PERFORMANCE: Precompute targetDateStr to avoid repeated calls
          return new Date(course.specificDate).toDateString() === targetDateStr;
        }
        // Fallback: course has no recurrence info and no specific date → treat as always-recurring
        return true;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [userCourses, mobileDate]);

  const mobileExams = useMemo(() => {
    // PERFORMANCE: Use Schwartzian transform to avoid O(N log N) repeated Date parsing
    const targetDateStr = mobileDate.toDateString();
    return userExams
      .map((exam) => ({ original: exam, parsedDate: new Date(exam.start) }))
      .filter((item) => item.parsedDate.toDateString() === targetDateStr)
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
      .map((item) => item.original);
  }, [userExams, mobileDate]);

  const mobileHomeworks = useMemo(() => {
    // PERFORMANCE: Precompute targetDateStr to avoid repeated `.toDateString()` on every iteration
    const targetDateStr = mobileDate.toDateString();
    return userHomeworks.filter(
      (hw) => new Date(hw.dueDate).toDateString() === targetDateStr
    );
  }, [userHomeworks, mobileDate]);

  // Helper: convert "HH:mm" to total minutes
  const timeToMinutes = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  // Fixed time slot definitions for the grid
  const timeSlotStrings = [
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 10:15',
    '10:15 - 11:15',
    '11:15 - 12:15',
    '12:15 - 13:30',
    '13:30 - 14:30',
    '14:30 - 15:30',
    '15:30 - 16:30',
    '16:30 - 17:30',
  ];

  const slotBoundaries = timeSlotStrings.map((ts) => {
    const [start, end] = ts.split(' - ');
    return { label: ts, startMin: timeToMinutes(start), endMin: timeToMinutes(end) };
  });

  const scheduleSlots: ScheduleSlot[] = useMemo(() => {
    const slots: ScheduleSlot[] = slotBoundaries.map((sb) => ({
      time: sb.label,
      startMinutes: sb.startMin,
      endMinutes: sb.endMin,
      courses: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] },
      exams: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] },
    }));

    const courseInfoMap = new Map<string, { startSlotIdx: number; rowSpan: number; course: Course }>();

    weekCourses.forEach((course) => {
      const courseStartMin = timeToMinutes(course.startTime);
      const courseEndMin = timeToMinutes(course.endTime);

      let startSlotIdx = -1;
      for (let i = 0; i < slotBoundaries.length; i++) {
        if (courseStartMin >= slotBoundaries[i].startMin && courseStartMin < slotBoundaries[i].endMin) {
          startSlotIdx = i;
          break;
        }
      }
      if (startSlotIdx === -1) {
        for (let i = 0; i < slotBoundaries.length; i++) {
          if (courseStartMin === slotBoundaries[i].startMin) {
            startSlotIdx = i;
            break;
          }
        }
      }
      if (startSlotIdx === -1) return;

      let rowSpan = 1;
      for (let i = startSlotIdx + 1; i < slotBoundaries.length; i++) {
        if (courseEndMin > slotBoundaries[i].startMin) {
          rowSpan++;
        } else {
          break;
        }
      }

      courseInfoMap.set(course.id, { startSlotIdx, rowSpan, course });
    });

    const coursesByDay: Map<number, Array<{ courseId: string; startMin: number; endMin: number }>> = new Map();
    weekCourses.forEach((course) => {
      if (!coursesByDay.has(course.dayOfWeek)) coursesByDay.set(course.dayOfWeek, []);
      coursesByDay.get(course.dayOfWeek)!.push({
        courseId: course.id,
        startMin: timeToMinutes(course.startTime),
        endMin: timeToMinutes(course.endTime),
      });
    });

    const colAssignment = new Map<string, { colIndex: number; totalCols: number }>();

    coursesByDay.forEach((dayCourses) => {
      dayCourses.sort((a, b) => a.startMin - b.startMin);
      const groups: Array<typeof dayCourses> = [];
      let currentGroup: typeof dayCourses = [];
      let groupEnd = -1;

      dayCourses.forEach((c) => {
        if (currentGroup.length === 0 || c.startMin < groupEnd) {
          currentGroup.push(c);
          groupEnd = Math.max(groupEnd, c.endMin);
        } else {
          if (currentGroup.length > 0) groups.push(currentGroup);
          currentGroup = [c];
          groupEnd = c.endMin;
        }
      });
      if (currentGroup.length > 0) groups.push(currentGroup);

      groups.forEach((group) => {
        const totalCols = group.length;
        group.forEach((c, idx) => {
          colAssignment.set(c.courseId, { colIndex: idx, totalCols });
        });
      });
    });

    courseInfoMap.forEach(({ startSlotIdx, rowSpan, course }) => {
      const cols = colAssignment.get(course.id) || { colIndex: 0, totalCols: 1 };

      // Compute partial-slot fractions for precise visual height
      const firstSlot = slotBoundaries[startSlotIdx];
      const lastSlot = slotBoundaries[startSlotIdx + rowSpan - 1];
      const courseStartMin = timeToMinutes(course.startTime);
      const courseEndMin = timeToMinutes(course.endTime);

      const topOffsetFraction = firstSlot
        ? Math.max(0, Math.min(1, (courseStartMin - firstSlot.startMin) / (firstSlot.endMin - firstSlot.startMin)))
        : 0;
      const bottomCutFraction = lastSlot
        ? Math.max(0, Math.min(1, 1 - (courseEndMin - lastSlot.startMin) / (lastSlot.endMin - lastSlot.startMin)))
        : 0;

      slots[startSlotIdx].courses[course.dayOfWeek].push({
        course,
        isStart: true,
        rowSpan,
        colIndex: cols.colIndex,
        totalCols: cols.totalCols,
        topOffsetFraction,
        bottomCutFraction,
      });

      for (let i = 1; i < rowSpan; i++) {
        const idx = startSlotIdx + i;
        if (idx < slots.length) {
          slots[idx].courses[course.dayOfWeek].push({
            course,
            isStart: false,
            rowSpan: 0,
            colIndex: cols.colIndex,
            totalCols: cols.totalCols,
            topOffsetFraction: 0,
            bottomCutFraction: 0,
          });
        }
      }
    });

    weekExams.forEach((exam) => {
      const examDate = new Date(exam.start);
      let dayOfWeek = examDate.getDay();
      if (dayOfWeek === 0) dayOfWeek = 7;
      const examTime = examDate.toTimeString().slice(0, 5);
      const examMin = timeToMinutes(examTime);

      for (let i = 0; i < slotBoundaries.length; i++) {
        if (examMin >= slotBoundaries[i].startMin && examMin < slotBoundaries[i].endMin) {
          slots[i].exams[dayOfWeek].push(exam);
          break;
        }
      }
    });

    return slots;
  }, [weekCourses, weekExams]);

  const getHomeworksForDay = (dayIndex: number) => {
    return weekHomeworks.filter((hw) => {
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

  const subjectColors = SUBJECT_COLORS;
  const currentDay = new Date().getDay() || 7;
  const canEdit = user?.role === 'teacher' || user?.role === 'director' || user?.role === 'superadmin';

  return {
    weekStart,
    getWeekRange,
    isCurrentWeek,
    scheduleSlots,
    timeSlotStrings,
    weekHomeworks,
    mobileCourses,
    mobileExams,
    mobileHomeworks,
    getHomeworksForDay,
    getDateForDayIndex,
    subjectColors,
    currentDay,
    canEdit,
  };
}
