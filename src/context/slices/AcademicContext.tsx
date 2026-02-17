import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { useAuth } from '../AuthContext';
import type { ClassGroup, Course, Parent, Student, Teacher } from '../../types';
import type { AcademicPeriod, GradeCategory } from '../../types/bulletin';
import { isFirebaseConfigured } from '../../config/firebase';
import {
  subscribeToClasses,
  createClass as fbCreateClass,
  updateClass as fbUpdateClass,
  deleteClass as fbDeleteClass,
} from '../../services/classes';
import {
  subscribeToCourses,
  createCourse as fbCreateCourse,
  updateCourse as fbUpdateCourse,
  deleteCourse as fbDeleteCourse,
} from '../../services/courses';
import {
  subscribeToAcademicPeriods,
  createAcademicPeriod as fbCreateAcademicPeriod,
  updateAcademicPeriod as fbUpdateAcademicPeriod,
  deleteAcademicPeriod as fbDeleteAcademicPeriod,
  publishPeriodBulletins as fbPublishPeriodBulletins,
} from '../../services/academicPeriods';
import {
  subscribeToGradeCategories,
  createGradeCategory as fbCreateGradeCategory,
  updateGradeCategory as fbUpdateGradeCategory,
  deleteGradeCategory as fbDeleteGradeCategory,
} from '../../services/gradeCategories';

export interface AcademicContextType {
  classes: ClassGroup[];
  courses: Course[];
  academicPeriods: AcademicPeriod[];
  gradeCategories: GradeCategory[];
  isLoading: boolean;

  addClass: (classGroup: ClassGroup) => Promise<void>;
  updateClass: (id: string, updates: Partial<ClassGroup>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;

  addCourse: (course: Omit<Course, 'id'>) => Promise<void>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;

  addAcademicPeriod: (period: Omit<AcademicPeriod, 'id'>) => Promise<void>;
  updateAcademicPeriod: (id: string, updates: Partial<AcademicPeriod>) => Promise<void>;
  deleteAcademicPeriod: (id: string) => Promise<void>;
  publishPeriodBulletins: (periodId: string) => Promise<void>;

  addGradeCategory: (category: Omit<GradeCategory, 'id'>) => Promise<void>;
  updateGradeCategory: (id: string, updates: Partial<GradeCategory>) => Promise<void>;
  deleteGradeCategory: (id: string) => Promise<void>;
}

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

export const AcademicProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const useFirebase = isFirebaseConfigured;
  const [isLoading, setIsLoading] = useState(true);

  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [gradeCategories, setGradeCategories] = useState<GradeCategory[]>([]);

  useEffect(() => {
    if (useFirebase) {
      let unsubClasses = () => { };
      let unsubCourses = () => { };
      const unsubAcademicPeriods = subscribeToAcademicPeriods(setAcademicPeriods);
      const unsubGradeCategories = subscribeToGradeCategories(setGradeCategories);

      if (user?.role === 'parent') {
        const parentUser = user as Parent;
        const childrenData = parentUser.children || [];
        const classIds = childrenData.map((c) => c.classId).filter(Boolean);

        unsubClasses = subscribeToClasses(setClasses, classIds);
        if (classIds.length > 0) {
          unsubCourses = subscribeToCourses(setCourses);
        }
      } else if (user?.role === 'student') {
        const student = user as Student;
        unsubClasses = subscribeToClasses(setClasses, student.classId ? [student.classId] : []);
        unsubCourses = subscribeToCourses(setCourses);
      } else if (user?.role === 'teacher') {
        const teacher = user as Teacher;
        unsubClasses = subscribeToClasses(setClasses, teacher.classIds || []);
        unsubCourses = subscribeToCourses(setCourses);
      } else {
        // Director / Admin
        unsubClasses = subscribeToClasses(setClasses);
        unsubCourses = subscribeToCourses(setCourses);
      }

      setIsLoading(false);

      return () => {
        unsubClasses();
        unsubCourses();
        unsubAcademicPeriods();
        unsubGradeCategories();
      };
    } else {
      setIsLoading(false);
    }
  }, [useFirebase, user]);

  const addClass = useCallback(async (classGroup: ClassGroup) => {
    if (useFirebase) {
      await fbCreateClass(classGroup);
    }
  }, [useFirebase]);

  const updateClass = useCallback(async (id: string, updates: Partial<ClassGroup>) => {
    if (useFirebase) {
      await fbUpdateClass(id, updates);
    }
  }, [useFirebase]);

  const deleteClass = useCallback(async (id: string) => {
    if (useFirebase) {
      await fbDeleteClass(id);
    }
  }, [useFirebase]);

  const addCourse = useCallback(async (course: Omit<Course, 'id'>) => {
    if (useFirebase) {
      await fbCreateCourse(course.classId, course);
    }
  }, [useFirebase]);

  const updateCourse = useCallback(async (id: string, updates: Partial<Course>) => {
    if (useFirebase) {
      const course = courses.find((c) => c.id === id);
      if (course) {
        await fbUpdateCourse(course.classId, id, updates);
      }
    }
  }, [useFirebase, courses]);

  const deleteCourse = useCallback(async (id: string) => {
    if (useFirebase) {
      const course = courses.find((c) => c.id === id);
      if (course) {
        await fbDeleteCourse(course.classId, id);
      }
    }
  }, [useFirebase, courses]);

  const addAcademicPeriod = useCallback(async (period: Omit<AcademicPeriod, 'id'>) => {
    if (useFirebase) {
      await fbCreateAcademicPeriod(period);
    }
  }, [useFirebase]);

  const updateAcademicPeriod = useCallback(async (id: string, updates: Partial<AcademicPeriod>) => {
    if (useFirebase) {
      await fbUpdateAcademicPeriod(id, updates);
    }
  }, [useFirebase]);

  const deleteAcademicPeriod = useCallback(async (id: string) => {
    if (useFirebase) {
      await fbDeleteAcademicPeriod(id);
    }
  }, [useFirebase]);

  const publishPeriodBulletins = useCallback(async (periodId: string) => {
    if (useFirebase) {
      await fbPublishPeriodBulletins(periodId);
    }
  }, [useFirebase]);

  const addGradeCategory = useCallback(async (category: Omit<GradeCategory, 'id'>) => {
    if (useFirebase) {
      await fbCreateGradeCategory(category);
    }
  }, [useFirebase]);

  const updateGradeCategory = useCallback(async (id: string, updates: Partial<GradeCategory>) => {
    if (useFirebase) {
      await fbUpdateGradeCategory(id, updates);
    }
  }, [useFirebase]);

  const deleteGradeCategory = useCallback(async (id: string) => {
    if (useFirebase) {
      await fbDeleteGradeCategory(id);
    }
  }, [useFirebase]);

  const value = useMemo(() => ({
    classes,
    courses,
    academicPeriods,
    gradeCategories,
    isLoading,
    addClass,
    updateClass,
    deleteClass,
    addCourse,
    updateCourse,
    deleteCourse,
    addAcademicPeriod,
    updateAcademicPeriod,
    deleteAcademicPeriod,
    publishPeriodBulletins,
    addGradeCategory,
    updateGradeCategory,
    deleteGradeCategory,
  }), [
    classes,
    courses,
    academicPeriods,
    gradeCategories,
    isLoading,
    addClass,
    updateClass,
    deleteClass,
    addCourse,
    updateCourse,
    deleteCourse,
    addAcademicPeriod,
    updateAcademicPeriod,
    deleteAcademicPeriod,
    publishPeriodBulletins,
    addGradeCategory,
    updateGradeCategory,
    deleteGradeCategory
  ]);

  return <AcademicContext.Provider value={value}>{children}</AcademicContext.Provider>;
};

export const useAcademics = () => {
  const context = useContext(AcademicContext);
  if (!context) {
    throw new Error('useAcademics must be used within AcademicProvider');
  }
  return context;
};
