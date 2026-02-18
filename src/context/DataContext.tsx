import { type ReactNode, useMemo } from 'react';
import type {
  User,
  Student,
  ClassGroup,
  Message,
  Event,
  Grade,
  Attendance,
  Course,
  Homework,
} from '../types';
import type { AcademicPeriod, GradeCategory } from '../types/bulletin';
import { isFirebaseConfigured } from '../config/firebase';

import { UserProvider, useUsers } from './slices/UserContext';
import { AcademicProvider, useAcademics } from './slices/AcademicContext';
import { CommunicationProvider, useCommunication } from './slices/CommunicationContext';
import { PerformanceProvider, usePerformance } from './slices/PerformanceContext';

// Re-export specific hooks for performance optimization
export { useUsers } from './slices/UserContext';
export { useAcademics } from './slices/AcademicContext';
export { useCommunication } from './slices/CommunicationContext';
export { usePerformance } from './slices/PerformanceContext';

export interface DataContextType {
  // State
  users: User[];
  students: Student[];
  classes: ClassGroup[];
  messages: Message[];
  events: Event[];
  grades: Grade[];
  attendance: Attendance[];
  courses: Course[];
  homeworks: Homework[];
  academicPeriods: AcademicPeriod[];
  gradeCategories: GradeCategory[];
  isLoading: boolean;
  useFirebase: boolean;

  // Actions
  addUser: (user: User) => Promise<{ uid: string; password?: string; emailSent: boolean } | string | void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  addClass: (classGroup: ClassGroup) => Promise<void>;
  updateClass: (id: string, updates: Partial<ClassGroup>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;

  sendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  deleteMessage: (id: string | number) => Promise<void>;
  markMessageAsRead: (id: string | number) => Promise<void>;
  updateMessage: (id: string | number, updates: Partial<Message>) => Promise<void>;

  addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  addGrade: (grade: Omit<Grade, 'id'>) => Promise<void>;
  updateGrade: (id: string, updates: Partial<Grade>) => Promise<void>;

  markAttendance: (record: Omit<Attendance, 'id'>) => Promise<void>;
  updateAttendance: (
    id: string,
    status: 'present' | 'absent' | 'late',
    justification?: string
  ) => Promise<void>;

  addCourse: (course: Omit<Course, 'id'>) => Promise<void>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;

  addHomework: (homework: Omit<Homework, 'id'>) => Promise<void>;
  updateHomework: (id: string, updates: Partial<Homework>) => Promise<void>;
  deleteHomework: (id: string) => Promise<void>;

  // Bulletin actions
  addAcademicPeriod: (period: Omit<AcademicPeriod, 'id'>) => Promise<void>;
  updateAcademicPeriod: (id: string, updates: Partial<AcademicPeriod>) => Promise<void>;
  deleteAcademicPeriod: (id: string) => Promise<void>;
  publishPeriodBulletins: (periodId: string) => Promise<void>;

  addGradeCategory: (category: Omit<GradeCategory, 'id'>) => Promise<void>;
  updateGradeCategory: (id: string, updates: Partial<GradeCategory>) => Promise<void>;
  deleteGradeCategory: (id: string) => Promise<void>;
}

export const DataProvider = ({ children }: { children: ReactNode }) => {
  return (
    <UserProvider>
      <AcademicProvider>
        <CommunicationProvider>
          <PerformanceProvider>
            {children}
          </PerformanceProvider>
        </CommunicationProvider>
      </AcademicProvider>
    </UserProvider>
  );
};

/**
 * @deprecated usage of useData causes re-renders on any data change.
 * Please use specific hooks instead: useUsers, useAcademics, useCommunication, usePerformance.
 */
export const useData = (): DataContextType => {
  const userContext = useUsers();
  const academicContext = useAcademics();
  const communicationContext = useCommunication();
  const performanceContext = usePerformance();

  const useFirebase = isFirebaseConfigured;

  return useMemo(() => {
    // Aggregate loading state
    const isLoading =
      userContext.isLoading ||
      academicContext.isLoading ||
      communicationContext.isLoading ||
      performanceContext.isLoading;

    return {
      // User Context
      users: userContext.users,
      students: userContext.students,
      addUser: userContext.addUser,
      updateUser: userContext.updateUser,
      deleteUser: userContext.deleteUser,

      // Academic Context
      classes: academicContext.classes,
      courses: academicContext.courses,
      academicPeriods: academicContext.academicPeriods,
      gradeCategories: academicContext.gradeCategories,
      addClass: academicContext.addClass,
      updateClass: academicContext.updateClass,
      deleteClass: academicContext.deleteClass,
      addCourse: academicContext.addCourse,
      updateCourse: academicContext.updateCourse,
      deleteCourse: academicContext.deleteCourse,
      addAcademicPeriod: academicContext.addAcademicPeriod,
      updateAcademicPeriod: academicContext.updateAcademicPeriod,
      deleteAcademicPeriod: academicContext.deleteAcademicPeriod,
      publishPeriodBulletins: academicContext.publishPeriodBulletins,
      addGradeCategory: academicContext.addGradeCategory,
      updateGradeCategory: academicContext.updateGradeCategory,
      deleteGradeCategory: academicContext.deleteGradeCategory,

      // Communication Context
      messages: communicationContext.messages,
      events: communicationContext.events,
      sendMessage: communicationContext.sendMessage,
      deleteMessage: communicationContext.deleteMessage,
      markMessageAsRead: communicationContext.markMessageAsRead,
      updateMessage: communicationContext.updateMessage,
      addEvent: communicationContext.addEvent,
      updateEvent: communicationContext.updateEvent,
      deleteEvent: communicationContext.deleteEvent,

      // Performance Context
      grades: performanceContext.grades,
      attendance: performanceContext.attendance,
      homeworks: performanceContext.homeworks,
      addGrade: performanceContext.addGrade,
      updateGrade: performanceContext.updateGrade,
      markAttendance: performanceContext.markAttendance,
      updateAttendance: performanceContext.updateAttendance,
      addHomework: performanceContext.addHomework,
      updateHomework: performanceContext.updateHomework,
      deleteHomework: performanceContext.deleteHomework,

      // Global
      isLoading,
      useFirebase,
    };
  }, [userContext, academicContext, communicationContext, performanceContext, useFirebase]);
};
