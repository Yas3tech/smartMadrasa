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
    const subjects = [...new Set(studentGrades.map((g) => g.subject))];
    const subjectPerformance = subjects.map((subject) => {
      const subjectGrades = studentGrades.filter((g) => g.subject === subject);
      const average =
        subjectGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) /
        subjectGrades.length;
      return {
        subject,
        average: Math.round(average),
        count: subjectGrades.length,
      };
    });

    return {
      avgGrade,
      attendanceRate,
      totalGrades: studentGrades.length,
      subjectPerformance,
    };
  };

  return { calculateStudentStats };
};
