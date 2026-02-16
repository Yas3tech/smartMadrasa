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
      ? (selectedChild as any).classId
      : (user as any)?.classId;
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
    const subjects = [...new Set(myGrades.map((g) => g.subject))];
    return subjects.map((subject) => {
      const subjectGrades = myGrades.filter((g) => g.subject === subject);
      const avg =
        subjectGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) /
        subjectGrades.length;
      return {
        subject,
        average: parseFloat(avg.toFixed(1)),
      };
    });
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
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map((date) => {
      const dayAttendance = attendance.filter((a) => a.date === date);
      const present = dayAttendance.filter((a) => a.status === 'present').length;
      const absent = dayAttendance.filter((a) => a.status === 'absent').length;
      return {
        name: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' }),
        présents: present,
        absents: absent,
      };
    });
  }, [attendance]);

  const gradeDistributionData = useMemo(() => {
    const ranges = [
      { name: 'Excellent (90-100)', min: 90, max: 100, color: '#10B981' },
      { name: 'Bien (70-89)', min: 70, max: 89, color: '#3B82F6' },
      { name: 'Moyen (50-69)', min: 50, max: 69, color: '#F59E0B' },
      { name: 'Faible (<50)', min: 0, max: 49, color: '#EF4444' },
    ];

    return ranges.map((range) => ({
      name: range.name,
      value: grades.filter((g) => {
        const percentage = (g.score / g.maxScore) * 100;
        return percentage >= range.min && percentage <= range.max;
      }).length,
      color: range.color,
    }));
  }, [grades]);

  const subjectPerformanceData = useMemo(() => {
    const subjects = [...new Set(grades.map((g) => g.subject))];
    return subjects.map((subject) => {
      const subjectGrades = grades.filter((g) => g.subject === subject);
      const avg =
        subjectGrades.length > 0
          ? subjectGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) /
            subjectGrades.length
          : 0;
      return { subject, moyenne: Math.round(avg) };
    });
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
