import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from '../AuthContext';
import { useUsers } from './UserContext';
import { useAcademics } from './AcademicContext';
import type { Grade, Attendance, Homework, Student } from '../../types';
import type { CourseGrade } from '../../types/bulletin';
import { isFirebaseConfigured } from '../../config/firebase';
import {
  subscribeToCourseGradesByStudentIds,
  subscribeToCourseGradesByPeriodIds,
  createCourseGrade as fbCreateCourseGrade,
  createCourseGradesBatch as fbCreateCourseGradesBatch,
  updateCourseGrade as fbUpdateCourseGrade,
} from '../../services/courseGrades';
import {
  subscribeToAttendance,
  subscribeToAttendanceByStudentIds,
  subscribeToAttendanceByClassIds,
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
import { subscribeToClassesByTeacherId } from '../../services/classes';
import { getRelevantPeriodIds } from '../../utils/academic';

export interface PerformanceContextType {
  grades: Grade[];
  attendance: Attendance[];
  homeworks: Homework[];
  isLoading: boolean;

  addGrade: (grade: Omit<Grade, 'id'>) => Promise<void>;
  addGradesBatch: (grades: Omit<Grade, 'id'>[]) => Promise<void>;
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
    let unsubGrades = () => { };
    let unsubAttendance = () => { };
    let unsubHomeworks = () => { };

    if (useFirebase && user) {
      const handleGradesUpdate = (courseGrades: CourseGrade[]) => {
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
      };

      if (user?.role === 'parent') {
        const parentUser = user as Record<string, unknown>; // Using unknown for childrenIds/relatedClassIds
        const childIds = (parentUser.childrenIds as string[]) || [];
        const classIds = (parentUser.relatedClassIds as string[]) || [];

        if (childIds.length > 0) {
          unsubGrades = subscribeToCourseGradesByStudentIds(childIds, handleGradesUpdate);
          unsubAttendance = subscribeToAttendanceByStudentIds(childIds, setAttendance);
        }

        if (classIds.length > 0) {
          unsubHomeworks = subscribeToHomeworksByClassIds(classIds, setHomeworks);
        }
      } else if (user?.role === 'student') {
        const studentUser = user as Student;
        unsubGrades = subscribeToCourseGradesByStudentIds([user.id], handleGradesUpdate);
        unsubAttendance = subscribeToAttendanceByStudentIds([user.id], setAttendance);

        if (studentUser.classId) {
          unsubHomeworks = subscribeToHomeworksByClassIds([studentUser.classId], setHomeworks);
        }
      } else if (user?.role === 'teacher') {
        let innerUnsubAttendance = () => { };
        let innerUnsubHomeworks = () => { };

        const unsubTeacherClasses = subscribeToClassesByTeacherId(user.id, (teacherClasses) => {
          innerUnsubAttendance();
          innerUnsubHomeworks();
          const classIds = teacherClasses.map((c) => c.id);

          if (classIds.length > 0) {
            innerUnsubAttendance = subscribeToAttendanceByClassIds(classIds, setAttendance);
            innerUnsubHomeworks = subscribeToHomeworksByClassIds(classIds, setHomeworks);
          }
        });

        const relevantPeriodIds = getRelevantPeriodIds(academicPeriods);
        if (relevantPeriodIds.length > 0) {
          unsubGrades = subscribeToCourseGradesByPeriodIds(relevantPeriodIds, handleGradesUpdate);
        }

        unsubAttendance = () => {
          unsubTeacherClasses();
          innerUnsubAttendance();
        };
        unsubHomeworks = () => {
          innerUnsubHomeworks();
        };
      } else {
        const relevantPeriodIds = getRelevantPeriodIds(academicPeriods);
        if (relevantPeriodIds.length > 0) {
          unsubGrades = subscribeToCourseGradesByPeriodIds(relevantPeriodIds, handleGradesUpdate);
        }
        unsubAttendance = subscribeToAttendance(setAttendance);
        unsubHomeworks = subscribeToHomeworks(setHomeworks);
      }

      setIsLoading(false);

      const handleWipe = () => {
        if (unsubGrades) unsubGrades();
        if (unsubAttendance) unsubAttendance();
        if (unsubHomeworks) unsubHomeworks();
      };
      window.addEventListener('app:wipeData', handleWipe);

      return () => {
        if (unsubGrades) unsubGrades();
        if (unsubAttendance) unsubAttendance();
        if (unsubHomeworks) unsubHomeworks();
        window.removeEventListener('app:wipeData', handleWipe);
      };
    } else {
      setIsLoading(false);
    }
  }, [useFirebase, user, academicPeriods]);

  const addGrade = useCallback(
    async (grade: Omit<Grade, 'id'>) => {
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
          classId: grade.classId,
          eventId: grade.eventId,
        };

        await fbCreateCourseGrade(courseGrade);
      }
    },
    [useFirebase, students, academicPeriods, user]
  );

  const addGradesBatch = useCallback(
    async (gradesToAdd: Omit<Grade, 'id'>[]) => {
      if (!useFirebase || gradesToAdd.length === 0) return;

      // ⚡ Bolt: Pre-compute maps to replace O(N^2) loops with O(N) map lookups
      const studentMap = new Map(students.map((s) => [s.id, s.name]));

      // Cache period dates to avoid repeatedly parsing them inside the loop
      const periodRanges = academicPeriods.map(p => ({
        id: p.id,
        startDate: new Date(p.startDate).getTime(),
        endDate: new Date(p.endDate).getTime()
      }));

      const courseGrades = gradesToAdd.map((grade) => {
        const studentName =
          grade.studentName || studentMap.get(grade.studentId) || 'Unknown';

        const gradeTime = new Date(grade.date).getTime();
        const matchingPeriod = periodRanges.find(
          (period) => gradeTime >= period.startDate && gradeTime <= period.endDate
        );

        const periodId = matchingPeriod?.id;
        if (!periodId) {
          throw new Error(
            'Aucune période académique ne correspond à cette date. Veuillez contacter le directeur.'
          );
        }

        return {
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
          classId: grade.classId,
          eventId: grade.eventId,
        };
      });

      await fbCreateCourseGradesBatch(courseGrades);
    },
    [useFirebase, students, academicPeriods, user]
  );

  const updateGrade = useCallback(
    async (id: string, updates: Partial<Grade>) => {
      if (useFirebase) {
        // Convert updates to CourseGrade format
        const courseGradeUpdates: Partial<CourseGrade> = {};
        if (updates.score !== undefined) courseGradeUpdates.score = updates.score;
        if (updates.maxScore !== undefined) courseGradeUpdates.maxScore = updates.maxScore;
        if (updates.feedback !== undefined) courseGradeUpdates.comment = updates.feedback;
        if (updates.subject !== undefined) courseGradeUpdates.courseName = updates.subject;

        await fbUpdateCourseGrade(id, courseGradeUpdates);
      }
    },
    [useFirebase]
  );

  const markAttendance = useCallback(
    async (record: Omit<Attendance, 'id'>) => {
      if (useFirebase) {
        await fbCreateAttendance(record.studentId, record);
      }
    },
    [useFirebase]
  );

  const updateAttendance = useCallback(
    async (id: string, status: 'present' | 'absent' | 'late', justification?: string) => {
      if (useFirebase) {
        const record = attendance.find((a) => a.id === id);
        if (record) {
          await fbUpdateAttendance(record.studentId, id, status, justification);
        } else {
          console.error('Attendance record not found for update:', id);
          throw new Error('Record not found');
        }
      }
    },
    [useFirebase, attendance]
  );

  const addHomework = useCallback(
    async (homework: Omit<Homework, 'id'>) => {
      if (useFirebase) {
        await fbCreateHomework(homework);
      }
    },
    [useFirebase]
  );

  const updateHomework = useCallback(
    async (id: string, updates: Partial<Homework>) => {
      if (useFirebase) {
        await fbUpdateHomework(id, updates);
      }
    },
    [useFirebase]
  );

  const deleteHomework = useCallback(
    async (id: string) => {
      if (useFirebase) {
        await fbDeleteHomework(id);
      }
    },
    [useFirebase]
  );

  const value = useMemo(
    () => ({
      grades,
      attendance,
      homeworks,
      isLoading,
      addGrade,
      addGradesBatch,
      updateGrade,
      markAttendance,
      updateAttendance,
      addHomework,
      updateHomework,
      deleteHomework,
    }),
    [
      grades,
      attendance,
      homeworks,
      isLoading,
      addGrade,
      addGradesBatch,
      updateGrade,
      markAttendance,
      updateAttendance,
      addHomework,
      updateHomework,
      deleteHomework,
    ]
  );

  return <PerformanceContext.Provider value={value}>{children}</PerformanceContext.Provider>;
};

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within PerformanceProvider');
  }
  return context;
};
