import { useCallback, useMemo } from 'react';
import { usePerformance } from '../context/DataContext';

export const useGradeStats = (studentId?: string) => {
  const { grades, attendance } = usePerformance();

  // Optimization: Memoize student grades for the provided studentId
  // Also sorts them by date descending using fast string comparison
  const studentGrades = useMemo(() => {
    if (!studentId) return [];
    return grades
      .filter((g) => g.studentId === studentId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [grades, studentId]);

  // Optimization: Memoize stats calculation based on studentGrades
  const stats = useMemo(() => {
    if (!studentId) return null;

    const studentAttendance = attendance.filter((a) => a.studentId === studentId);

    const avgGrade = Math.round(
      studentGrades.length > 0
        ? studentGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) /
            studentGrades.length
        : 0
    );

    const presentCount = studentAttendance.filter((a) => a.status === 'present').length;
    const attendanceRate = Math.round(
      studentAttendance.length > 0 ? (presentCount / studentAttendance.length) * 100 : 0
    );

    // Subject-wise performance
    const subjectMap = new Map<string, { sum: number; count: number }>();

    for (const g of studentGrades) {
      const current = subjectMap.get(g.subject) || { sum: 0, count: 0 };
      current.sum += (g.score / g.maxScore) * 100;
      current.count++;
      subjectMap.set(g.subject, current);
    }

    const subjectPerformance = Array.from(subjectMap.entries()).map(
      ([subject, { sum, count }]) => ({
        subject,
        average: Math.round(sum / count),
        count,
      })
    );

    return {
      avgGrade,
      attendanceRate,
      totalGrades: studentGrades.length,
      subjectPerformance,
    };
  }, [studentId, studentGrades, attendance]);

  // Kept for backward compatibility and manual usage
  const calculateStudentStats = useCallback((id: string) => {
    // If the requested ID matches the one passed to the hook, return the memoized stats
    if (studentId === id && stats) {
        return stats;
    }

    const sGrades = grades.filter((g) => g.studentId === id);
    const sAttendance = attendance.filter((a) => a.studentId === id);

    const avgGrade = Math.round(
      sGrades.length > 0
        ? sGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) /
            sGrades.length
        : 0
    );

    const presentCount = sAttendance.filter((a) => a.status === 'present').length;
    const attendanceRate = Math.round(
      sAttendance.length > 0 ? (presentCount / sAttendance.length) * 100 : 0
    );

    // Subject-wise performance
    const subjectMap = new Map<string, { sum: number; count: number }>();

    for (const g of sGrades) {
      const current = subjectMap.get(g.subject) || { sum: 0, count: 0 };
      current.sum += (g.score / g.maxScore) * 100;
      current.count++;
      subjectMap.set(g.subject, current);
    }

    const subjectPerformance = Array.from(subjectMap.entries()).map(
      ([subject, { sum, count }]) => ({
        subject,
        average: Math.round(sum / count),
        count,
      })
    );

    return {
      avgGrade,
      attendanceRate,
      totalGrades: sGrades.length,
      subjectPerformance,
    };
  }, [grades, attendance, studentId, stats]);

  return { calculateStudentStats, stats, studentGrades };
};
