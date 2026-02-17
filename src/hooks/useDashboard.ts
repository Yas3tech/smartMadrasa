import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import type { User, Grade, Homework, Event, Student, Teacher } from '../types';

export interface UseDashboardReturn {
  // Parent child selection
  selectedChildId: string | null;
  setSelectedChildId: (id: string | null) => void;
  selectedChild: User | null;
  parentChildren: User[];
  effectiveSelectedChildId: string | null;

  // Homework modal
  selectedHomework: Homework | null;
  setSelectedHomework: (hw: Homework | null) => void;
  showHomeworkModal: boolean;
  setShowHomeworkModal: (show: boolean) => void;
  handleOpenHomework: (homework: Homework) => void;

  // General Stats
  students: Student[];
  teachers: Teacher[];
  attendanceRate: string | number;
  avgGrade: string | number;
  unreadMessages: number;
  upcomingEvents: Event[];
  presentCount: number;
  allGrades: Grade[];

  // Student specific
  myGrades: Grade[];
  myAvg: string | number;
  mySubjectPerformance: { subject: string; average: number }[];
  pendingHomeworks: Homework[];
  childClass?: { name: string };

  // Chart data
  weeklyAttendanceData: { name: string; présents: number; absents: number }[];
  gradeDistributionData: { name: string; value: number; color: string }[];
  subjectPerformanceData: { subject: string; moyenne: number }[];
}

export function useDashboard(): UseDashboardReturn {
  const { user } = useAuth();
  const { students, users, grades, attendance, messages, events, homeworks, classes } = useData();

  // State
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);

  // Memoized Parent children
  const parentChildren = useMemo(() => {
    return user?.role === 'parent' ? students.filter((s) => s.parentId === user.id) : [];
  }, [user?.role, user?.id, students]);

  const effectiveSelectedChildId =
    selectedChildId || (parentChildren.length > 0 ? parentChildren[0].id : null);

  const selectedChild = useMemo(() => {
    return (
      parentChildren.find((c) => c.id === effectiveSelectedChildId) ||
      (parentChildren.length > 0 ? parentChildren[0] : null)
    );
  }, [parentChildren, effectiveSelectedChildId]);

  // Memoized General Stats Calculations
  const teachers = useMemo(() => users.filter((u): u is Teacher => u.role === 'teacher'), [users]);

  const { presentCount, attendanceRate } = useMemo(() => {
    const todayDate = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter((a) => a.date === todayDate);
    const count = todayAttendance.filter((a) => a.status === 'present').length;
    const rate = students.length > 0 ? ((count / students.length) * 100).toFixed(0) : 0;
    return { presentCount: count, attendanceRate: rate };
  }, [attendance, students]);

  const allGrades = useMemo(() => grades.filter((g) => g.score > 0), [grades]);

  const avgGrade = useMemo(() => {
    return allGrades.length > 0
      ? (
        allGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / allGrades.length
      ).toFixed(1)
      : 0;
  }, [allGrades]);

  const unreadMessages = useMemo(
    () => messages.filter((m) => m.receiverId === user?.id && !m.read).length,
    [messages, user?.id]
  );

  const upcomingEvents = useMemo(() => {
    return events
      .filter((e) => new Date(e.start) >= new Date())
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 3);
  }, [events]);

  // Memoized Student Specific Calculations
  const targetStudentId = user?.role === 'parent' && selectedChild ? selectedChild.id : user?.id;

  const targetClassId = useMemo(() => {
    return user?.role === 'parent' && selectedChild
      ? (selectedChild as Student).classId
      : (user as User & { classId?: string })?.classId;
  }, [user, selectedChild]);

  const myGrades = useMemo(() => grades.filter((g) => g.studentId === targetStudentId), [grades, targetStudentId]);

  const myAvg = useMemo(() => {
    return myGrades.length > 0
      ? (
        myGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / myGrades.length
      ).toFixed(1)
      : 0;
  }, [myGrades]);

  const mySubjectPerformance = useMemo(() => {
    // Optimization: Single pass aggregation instead of nested loops O(N)
    const subjectStats = new Map<string, { total: number; count: number }>();

    myGrades.forEach((g) => {
      if (!subjectStats.has(g.subject)) {
        subjectStats.set(g.subject, { total: 0, count: 0 });
      }
      const stats = subjectStats.get(g.subject)!;
      stats.total += (g.score / g.maxScore) * 100;
      stats.count++;
    });

    return Array.from(subjectStats.entries()).map(([subject, stats]) => ({
      subject,
      average: parseFloat((stats.total / stats.count).toFixed(1)),
    }));
  }, [myGrades]);

  const pendingHomeworks = useMemo(() => {
    return homeworks
      .filter((hw) => {
        if (hw.classId !== targetClassId) return false;
        return new Date(hw.dueDate) >= new Date();
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [homeworks, targetClassId]);

  const childClass = useMemo(() => classes.find((c) => c.id === targetClassId), [classes, targetClassId]);

  // Handlers
  const handleOpenHomework = useCallback((homework: Homework) => {
    setSelectedHomework(homework);
    setShowHomeworkModal(true);
  }, []);

  // Memoized Chart data generators
  const weeklyAttendanceData = useMemo(() => {
    const today = new Date();
    // Optimization: Create map of dates to indices for O(1) lookup
    const last7DaysMap = new Map<string, { present: number; absent: number; dateObj: Date }>();
    const last7DaysKeys: string[] = [];

    // Initialize map for last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      last7DaysMap.set(dateStr, { present: 0, absent: 0, dateObj: date });
      last7DaysKeys.push(dateStr);
    }

    // Optimization: Single pass over attendance data O(N)
    attendance.forEach((a) => {
      const dayStats = last7DaysMap.get(a.date);
      if (dayStats) {
        if (a.status === 'present') dayStats.present++;
        else if (a.status === 'absent') dayStats.absent++;
      }
    });

    return last7DaysKeys.map((dateStr) => {
      const stats = last7DaysMap.get(dateStr)!;
      return {
        name: stats.dateObj.toLocaleDateString('fr-FR', { weekday: 'short' }),
        présents: stats.present,
        absents: stats.absent,
      };
    });
  }, [attendance]);

  const gradeDistributionData = useMemo(() => {
    const ranges = [
      { name: 'Excellent (90-100)', min: 90, max: 100, color: '#10B981', count: 0 },
      { name: 'Bien (70-89)', min: 70, max: 89, color: '#3B82F6', count: 0 },
      { name: 'Moyen (50-69)', min: 50, max: 69, color: '#F59E0B', count: 0 },
      { name: 'Faible (<50)', min: 0, max: 49, color: '#EF4444', count: 0 },
    ];

    // Optimization: Single pass over grades O(N) instead of O(4*N)
    grades.forEach((g) => {
      const percentage = (g.score / g.maxScore) * 100;
      for (const range of ranges) {
        if (percentage >= range.min && percentage <= range.max) {
          range.count++;
          break;
        }
      }
    });

    return ranges.map((range) => ({
      name: range.name,
      value: range.count,
      color: range.color,
    }));
  }, [grades]);

  const subjectPerformanceData = useMemo(() => {
    // Optimization: Single pass aggregation instead of nested loops O(N)
    const subjectStats = new Map<string, { total: number; count: number }>();

    grades.forEach((g) => {
      if (!subjectStats.has(g.subject)) {
        subjectStats.set(g.subject, { total: 0, count: 0 });
      }
      const stats = subjectStats.get(g.subject)!;
      stats.total += (g.score / g.maxScore) * 100;
      stats.count++;
    });

    return Array.from(subjectStats.entries()).map(([subject, stats]) => ({
      subject,
      moyenne: Math.round(stats.total / stats.count),
    }));
  }, [grades]);

  return {
    selectedChildId,
    setSelectedChildId,
    selectedChild,
    parentChildren,
    effectiveSelectedChildId,
    selectedHomework,
    setSelectedHomework,
    showHomeworkModal,
    setShowHomeworkModal,
    handleOpenHomework,
    students,
    teachers,
    attendanceRate,
    avgGrade,
    unreadMessages,
    upcomingEvents,
    presentCount,
    allGrades,
    myGrades,
    myAvg,
    mySubjectPerformance,
    pendingHomeworks,
    childClass,
    weeklyAttendanceData,
    gradeDistributionData,
    subjectPerformanceData,
  };
}
