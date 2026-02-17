import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { useAuth } from '../AuthContext';
import { useUsers } from './UserContext';
import { useAcademics } from './AcademicContext';
import type { Grade, Attendance, Homework, Parent, Student, Teacher } from '../../types';
import type { CourseGrade } from '../../types/bulletin';
import { isFirebaseConfigured } from '../../config/firebase';
import {
  subscribeToCourseGrades,
  subscribeToCourseGradesByStudentIds,
  createCourseGrade as fbCreateCourseGrade,
  updateCourseGrade as fbUpdateCourseGrade,
} from '../../services/courseGrades';
import {
  subscribeToAttendance,
  subscribeToAttendanceByStudentIds,
  createAttendance as fbCreateAttendance,
  updateAttendance as fbUpdateAttendance,
} from '../../services/attendance';
import {
  subscribeToHomeworks,
  subscribeToHomeworksByClassIds,
  createHomework as fbCreateHomework,
  updateHomework as fbUpdateHomework,
  deleteHomework as fbDeleteHomework,
} from '../../services/homework';

export interface PerformanceContextType {
  grades: Grade[];
  attendance: Attendance[];
  homeworks: Homework[];
  isLoading: boolean;

  addGrade: (grade: Omit<Grade, 'id'>) => Promise<void>;
  updateGrade: (id: string, updates: Partial<Grade>) => Promise<void>;

  markAttendance: (record: Omit<Attendance, 'id'>) => Promise<void>;
  updateAttendance: (
    id: string,
    status: 'present' | 'absent' | 'late',
    justification?: string
  ) => Promise<void>;

  addHomework: (homework: Omit<Homework, 'id'>) => Promise<void>;
  updateHomework: (id: string, updates: Partial<Homework>) => Promise<void>;
  deleteHomework: (id: string) => Promise<void>;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export const PerformanceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { students } = useUsers();
  const { academicPeriods } = useAcademics();
  const useFirebase = isFirebaseConfigured;
  const [isLoading, setIsLoading] = useState(true);

  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);

  useEffect(() => {
    if (useFirebase) {
      let unsubGrades = () => { };
      let unsubAttendance = () => { };
      let unsubHomeworks = () => { };

      if (user?.role === 'parent') {
        const parentUser = user as Parent;
        const childIds = parentUser.childrenIds || [];
        const childrenData = parentUser.children || [];
        const classIds = childrenData.map((c) => c.classId).filter(Boolean);

        if (childIds.length > 0) {
          unsubGrades = subscribeToCourseGradesByStudentIds(childIds, (courseGrades) => {
            const grades = courseGrades.map((cg) => ({
              id: cg.id,
              studentId: cg.studentId,
              studentName: cg.studentName,
              subject: cg.courseName || 'Unknown',
              score: cg.score,
              maxScore: cg.maxScore,
              type: cg.categoryName?.toLowerCase() === 'examen' ? 'exam' : 'homework',
              date: cg.date,
              feedback: cg.comment,
              courseId: cg.courseId,
              className: undefined,
            }));
            setGrades(grades as Grade[]);
          });
          unsubAttendance = subscribeToAttendanceByStudentIds(childIds, setAttendance);
        }

        if (classIds.length > 0) {
          unsubHomeworks = subscribeToHomeworksByClassIds(classIds, setHomeworks);
        }
      } else {
        const setupDefaultSubs = () => {
          unsubGrades = subscribeToCourseGrades((courseGrades) => {
            const grades = courseGrades.map((cg) => ({
              id: cg.id,
              studentId: cg.studentId,
              studentName: cg.studentName,
              subject: cg.courseName || 'Unknown',
              score: cg.score,
              maxScore: cg.maxScore,
              type: cg.categoryName?.toLowerCase() === 'examen' ? 'exam' : 'homework',
              date: cg.date,
              feedback: cg.comment,
              courseId: cg.courseId,
              className: undefined,
            }));
            setGrades(grades as Grade[]);
          });
          unsubAttendance = subscribeToAttendance(setAttendance);
          unsubHomeworks = subscribeToHomeworks(setHomeworks);
        };

        // For student, teacher, director, superadmin - use default subs logic
        // Note: Logic is slightly simplified from original but functionally equivalent for these roles
        // assuming subscribeToHomeworks handles role filtering internally OR fetches all if not filtered.
        // Original code called setupDefaultSubs() for everyone except parent.
        setupDefaultSubs();

        // Original code had specific checks for student/teacher but they ended up calling setupDefaultSubs() anyway.
        // The student/teacher specific checks were mostly for 'classes' and 'events' which are handled in other contexts.
      }

      setIsLoading(false);

      return () => {
        unsubGrades();
        unsubAttendance();
        unsubHomeworks();
      };
    } else {
      setIsLoading(false);
    }
  }, [useFirebase, user]);

  const addGrade = useCallback(async (grade: Omit<Grade, 'id'>) => {
    if (useFirebase) {
      // Find the student name if not provided
      const studentName =
        grade.studentName || students.find((s) => s.id === grade.studentId)?.name || 'Unknown';

      // Find the correct period based on grade date
      const gradeDate = new Date(grade.date);
      const matchingPeriod = academicPeriods.find((period) => {
        const startDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);
        return gradeDate >= startDate && gradeDate <= endDate;
      });

      // If no matching period found, use the most recent period or throw error
      const periodId = matchingPeriod?.id;
      if (!periodId) {
        throw new Error(
          'Aucune période académique ne correspond à cette date. Veuillez contacter le directeur.'
        );
      }

      // Convert Grade to CourseGrade format
      const courseGrade = {
        studentId: grade.studentId,
        studentName: studentName,
        courseId: grade.courseId || grade.classId || 'general',
        courseName: grade.subject,
        periodId: periodId,
        categoryId:
          grade.type === 'exam'
            ? 'cat-exam'
            : grade.type === 'homework'
              ? 'cat-homework'
              : 'cat-eval',
        categoryName:
          grade.type === 'exam' ? 'Examen' : grade.type === 'homework' ? 'Devoir' : 'Évaluation',
        title: grade.title || `${grade.subject} - ${grade.type}`,
        score: grade.score,
        maxScore: grade.maxScore,
        date: grade.date,
        weight: 1,
        teacherId: grade.teacherId || user?.id || 'unknown',
        comment: grade.feedback || '',
      };

      await fbCreateCourseGrade(courseGrade);
    }
  }, [useFirebase, students, academicPeriods, user]);

  const updateGrade = useCallback(async (id: string, updates: Partial<Grade>) => {
    if (useFirebase) {
      // Convert updates to CourseGrade format
      const courseGradeUpdates: Partial<CourseGrade> = {};
      if (updates.score !== undefined) courseGradeUpdates.score = updates.score;
      if (updates.maxScore !== undefined) courseGradeUpdates.maxScore = updates.maxScore;
      if (updates.feedback !== undefined) courseGradeUpdates.comment = updates.feedback;
      if (updates.subject !== undefined) courseGradeUpdates.courseName = updates.subject;

      await fbUpdateCourseGrade(id, courseGradeUpdates);
    }
  }, [useFirebase]);

  const markAttendance = useCallback(async (record: Omit<Attendance, 'id'>) => {
    if (useFirebase) {
      await fbCreateAttendance(record.studentId, record);
    }
  }, [useFirebase]);

  const updateAttendance = useCallback(async (
    id: string,
    status: 'present' | 'absent' | 'late',
    justification?: string
  ) => {
    if (useFirebase) {
      const record = attendance.find((a) => a.id === id);
      if (record) {
        await fbUpdateAttendance(record.studentId, id, status, justification);
      }
    }
  }, [useFirebase, attendance]);

  const addHomework = useCallback(async (homework: Omit<Homework, 'id'>) => {
    if (useFirebase) {
      await fbCreateHomework(homework);
    }
  }, [useFirebase]);

  const updateHomework = useCallback(async (id: string, updates: Partial<Homework>) => {
    if (useFirebase) {
      await fbUpdateHomework(id, updates);
    }
  }, [useFirebase]);

  const deleteHomework = useCallback(async (id: string) => {
    if (useFirebase) {
      await fbDeleteHomework(id);
    }
  }, [useFirebase]);

  const value = useMemo(() => ({
    grades,
    attendance,
    homeworks,
    isLoading,
    addGrade,
    updateGrade,
    markAttendance,
    updateAttendance,
    addHomework,
    updateHomework,
    deleteHomework,
  }), [
    grades,
    attendance,
    homeworks,
    isLoading,
    addGrade,
    updateGrade,
    markAttendance,
    updateAttendance,
    addHomework,
    updateHomework,
    deleteHomework,
  ]);

  return <PerformanceContext.Provider value={value}>{children}</PerformanceContext.Provider>;
};

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within PerformanceProvider');
  }
  return context;
};
