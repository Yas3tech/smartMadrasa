import { useData } from '../context/DataContext';

export const useGradeStats = () => {
  const { grades, attendance } = useData();

  const calculateStudentStats = (studentId: string) => {
    const studentGrades = grades.filter((g) => g.studentId === studentId);
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
  };

  return { calculateStudentStats };
};
