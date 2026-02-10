import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
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
  Parent,
} from '../types';
import { isFirebaseConfigured } from '../config/firebase';
import {
  subscribeToUsers,
  createUser as fbCreateUser,
  updateUser as fbUpdateUser,
  deleteUser as fbDeleteUser,
} from '../services/users';
import {
  subscribeToClasses,
  createClass as fbCreateClass,
  updateClass as fbUpdateClass,
  deleteClass as fbDeleteClass,
} from '../services/classes';
import {
  subscribeToMessages,
  sendMessage as fbSendMessage,
  deleteMessage as fbDeleteMessage,
  markMessageAsRead as fbMarkMessageAsRead,
  updateMessage as fbUpdateMessage,
} from '../services/messages';
import {
  subscribeToEvents,
  subscribeToEventsByClassIds, // [NEW]
  createEvent as fbCreateEvent,
  updateEvent as fbUpdateEvent,
  deleteEvent as fbDeleteEvent,
} from '../services/events';
import {
  subscribeToCourseGrades,
  subscribeToCourseGradesByStudentIds, // [NEW]
  createCourseGrade as fbCreateCourseGrade,
  updateCourseGrade as fbUpdateCourseGrade,
} from '../services/courseGrades';
import {
  subscribeToAttendance,
  subscribeToAttendanceByStudentIds, // [NEW]
  createAttendance as fbCreateAttendance,
  updateAttendance as fbUpdateAttendance,
} from '../services/attendance';
import {
  subscribeToCourses,
  createCourse as fbCreateCourse,
  updateCourse as fbUpdateCourse,
  deleteCourse as fbDeleteCourse,
} from '../services/courses';
import {
  subscribeToHomeworks,
  subscribeToHomeworksByClassIds,
  createHomework as fbCreateHomework,
  updateHomework as fbUpdateHomework,
  deleteHomework as fbDeleteHomework,
} from '../services/homework';
import {
  subscribeToAcademicPeriods,
  createAcademicPeriod as fbCreateAcademicPeriod,
  updateAcademicPeriod as fbUpdateAcademicPeriod,
  deleteAcademicPeriod as fbDeleteAcademicPeriod,
  publishPeriodBulletins as fbPublishPeriodBulletins,
} from '../services/academicPeriods';
import {
  subscribeToGradeCategories,
  createGradeCategory as fbCreateGradeCategory,
  updateGradeCategory as fbUpdateGradeCategory,
  deleteGradeCategory as fbDeleteGradeCategory,
} from '../services/gradeCategories';

import type { AcademicPeriod, GradeCategory } from '../types/bulletin';

interface DataContextType {
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
  addUser: (user: User) => Promise<void>;
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

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const useFirebase = isFirebaseConfigured;
  const [isLoading, setIsLoading] = useState(true);

  // Local state (used for mock data OR Firebase real-time updates)
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);

  // Bulletin state
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [gradeCategories, setGradeCategories] = useState<GradeCategory[]>([]);

  // Initialize data: Firebase listeners OR mock data
  useEffect(() => {
    if (useFirebase) {


      // Subscribe to Firebase collections
      const unsubUsers = subscribeToUsers(setUsers);
      const unsubClasses = subscribeToClasses(setClasses);
      const unsubMessages = subscribeToMessages(setMessages);
      // Subscribe to bulletin system collections
      const unsubAcademicPeriods = subscribeToAcademicPeriods(setAcademicPeriods);
      const unsubGradeCategories = subscribeToGradeCategories(setGradeCategories);

      // Role-based subscriptions
      let unsubGrades = () => { };
      let unsubAttendance = () => { };
      let unsubEvents = () => { };
      let unsubHomeworks = () => { };
      let unsubCourses = () => { };

      if (user?.role === 'parent') {
        const parentUser = user as Parent;
        const childIds = parentUser.childrenIds || [];
        // Collect class IDs for all children to fetch relevant Events and Homework
        // We need to look up children objects to get their classId.
        // Since user object might not have full children details denormalized,
        // we might need to rely on 'children' array if populated, or we fetch users.
        // Assuming 'children' prop is populated on login (denormalized).
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
            setGrades(grades as any);
          });
          unsubAttendance = subscribeToAttendanceByStudentIds(childIds, setAttendance);
        }

        if (classIds.length > 0) {
          unsubEvents = subscribeToEventsByClassIds(classIds, setEvents);
          unsubHomeworks = subscribeToHomeworksByClassIds(classIds, setHomeworks);
          // Subscribe to all courses - filtering by classId is done in Schedule.tsx
          unsubCourses = subscribeToCourses(setCourses);
        }
      } else {
        // Default / Admin / Teacher behavior (Fetch All)
        // Note: For students we could also optimize, but prioritization is Parent now.
        // Teachers might need specific filtering too later.
        unsubEvents = subscribeToEvents(setEvents);
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
          setGrades(grades as any);
        });
        unsubAttendance = subscribeToAttendance(setAttendance);
        unsubHomeworks = subscribeToHomeworks(setHomeworks);
        unsubCourses = subscribeToCourses(setCourses);
      }

      // Role-based subscriptions could be added here if needed
      // e.g. if (user?.role === 'teacher') ...

      setIsLoading(false);

      // Cleanup subscriptions on unmount
      return () => {
        unsubUsers();
        unsubClasses();
        unsubMessages();
        unsubEvents();
        unsubGrades();
        unsubAttendance();
        unsubCourses();
        unsubHomeworks();
        unsubAcademicPeriods();
        unsubGradeCategories();
      };
    } else {
      setIsLoading(false);
    }
  }, [useFirebase, user]); // Added user dependency to re-subscribe on login/role switch

  // User actions
  const addUser = async (user: User) => {
    if (useFirebase) {
      await fbCreateUser(user);
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    if (useFirebase) {
      await fbUpdateUser(id, updates);
    }
  };

  const deleteUser = async (id: string) => {
    if (useFirebase) {
      await fbDeleteUser(id);
    }
  };

  // Class actions
  const addClass = async (classGroup: ClassGroup) => {
    if (useFirebase) {
      await fbCreateClass(classGroup);
    }
  };

  const updateClass = async (id: string, updates: Partial<ClassGroup>) => {
    if (useFirebase) {
      await fbUpdateClass(id, updates);
    }
  };

  const deleteClass = async (id: string) => {
    if (useFirebase) {
      await fbDeleteClass(id);
    }
  };

  // Message actions
  const sendMessage = async (message: Omit<Message, 'id' | 'timestamp'>) => {
    if (useFirebase) {
      await fbSendMessage(message);
    }
  };

  const deleteMessage = async (id: string | number) => {
    if (useFirebase) {
      await fbDeleteMessage(String(id));
    }
  };

  const markMessageAsRead = async (id: string | number) => {
    if (useFirebase) {
      await fbMarkMessageAsRead(String(id));
    }
  };

  const updateMessage = async (id: string | number, updates: Partial<Message>) => {
    if (useFirebase) {
      await fbUpdateMessage(String(id), updates);
    }
  };

  // Event actions
  const addEvent = async (event: Omit<Event, 'id'>) => {
    if (useFirebase) {
      await fbCreateEvent(event);
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    if (useFirebase) {
      await fbUpdateEvent(id, updates);
    }
  };

  const deleteEvent = async (id: string) => {
    if (useFirebase) {
      await fbDeleteEvent(id);
    }
  };

  // Grade actions
  const addGrade = async (grade: Omit<Grade, 'id'>) => {
    if (useFirebase) {
      try {
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
          courseId: grade.courseId || grade.classId || 'general', // Use courseId, classId, or 'general'
          courseName: grade.subject,
          periodId: periodId,
          categoryId:
            grade.type === 'exam'
              ? 'cat-exam'
              : grade.type === 'homework'
                ? 'cat-homework'
                : 'cat-eval', // Map type to category
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
      } catch (error) {
        throw error;
      }
    }
  };

  const updateGrade = async (id: string, updates: Partial<Grade>) => {
    if (useFirebase) {
      // Convert updates to CourseGrade format
      const courseGradeUpdates: any = {};
      if (updates.score !== undefined) courseGradeUpdates.score = updates.score;
      if (updates.maxScore !== undefined) courseGradeUpdates.maxScore = updates.maxScore;
      if (updates.feedback !== undefined) courseGradeUpdates.comment = updates.feedback;
      if (updates.subject !== undefined) courseGradeUpdates.courseName = updates.subject;

      await fbUpdateCourseGrade(id, courseGradeUpdates);
    }
  };

  // Attendance actions
  const markAttendance = async (record: Omit<Attendance, 'id'>) => {
    if (useFirebase) {
      await fbCreateAttendance(record.studentId, record);
    }
  };

  const updateAttendance = async (
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
  };

  // Course actions
  const addCourse = async (course: Omit<Course, 'id'>) => {
    if (useFirebase) {
      await fbCreateCourse(course.classId, course);
    }
  };

  const updateCourse = async (id: string, updates: Partial<Course>) => {
    if (useFirebase) {
      const course = courses.find((c) => c.id === id);
      if (course) {
        await fbUpdateCourse(course.classId, id, updates);
      }
    }
  };

  const deleteCourse = async (id: string) => {
    if (useFirebase) {
      const course = courses.find((c) => c.id === id);
      if (course) {
        await fbDeleteCourse(course.classId, id);
      }
    }
  };

  // Homework actions
  const addHomework = async (homework: Omit<Homework, 'id'>) => {
    if (useFirebase) {
      await fbCreateHomework(homework);
    }
  };

  const updateHomework = async (id: string, updates: Partial<Homework>) => {
    if (useFirebase) {
      await fbUpdateHomework(id, updates);
    }
  };

  const deleteHomework = async (id: string) => {
    if (useFirebase) {
      await fbDeleteHomework(id);
    }
  };

  // Memoize students to prevent unnecessary re-renders in downstream components
  const students = useMemo(
    () => users.filter((u): u is Student => u.role === 'student'),
    [users]
  );

  // Bulletin CRUD operations (mock implementation for now, will be enhanced later)
  const addAcademicPeriod = async (period: Omit<AcademicPeriod, 'id'>) => {
    if (useFirebase) {
      await fbCreateAcademicPeriod(period);
    }
  };

  const updateAcademicPeriod = async (id: string, updates: Partial<AcademicPeriod>) => {
    if (useFirebase) {
      await fbUpdateAcademicPeriod(id, updates);
    }
  };

  const deleteAcademicPeriod = async (id: string) => {
    if (useFirebase) {
      await fbDeleteAcademicPeriod(id);
    }
  };

  const publishPeriodBulletins = async (periodId: string) => {
    if (useFirebase) {
      await fbPublishPeriodBulletins(periodId);
    }
  };

  const addGradeCategory = async (category: Omit<GradeCategory, 'id'>) => {
    if (useFirebase) {
      await fbCreateGradeCategory(category);
    }
  };

  const updateGradeCategory = async (id: string, updates: Partial<GradeCategory>) => {
    if (useFirebase) {
      await fbUpdateGradeCategory(id, updates);
    }
  };

  const deleteGradeCategory = async (id: string) => {
    if (useFirebase) {
      await fbDeleteGradeCategory(id);
    }
  };

  const value: DataContextType = {
    users,
    students,
    classes,
    messages,
    events,
    grades,
    attendance,
    courses,
    homeworks,
    academicPeriods,
    gradeCategories,
    isLoading,
    useFirebase,
    addUser,
    updateUser,
    deleteUser,
    addClass,
    updateClass,
    deleteClass,
    sendMessage,
    deleteMessage,
    markMessageAsRead,
    updateMessage,
    addEvent,
    updateEvent,
    deleteEvent,
    addGrade,
    updateGrade,
    markAttendance,
    updateAttendance,
    addCourse,
    updateCourse,
    deleteCourse,
    addHomework,
    updateHomework,
    deleteHomework,
    addAcademicPeriod,
    updateAcademicPeriod,
    deleteAcademicPeriod,
    publishPeriodBulletins,
    addGradeCategory,
    updateGradeCategory,
    deleteGradeCategory,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
