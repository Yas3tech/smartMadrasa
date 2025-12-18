import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { getDb } from './firebaseHelper';
import type { CourseGrade } from '../types/bulletin';

const COLLECTION_NAME = 'courseGrades';

/**
 * Subscribe to course grades for a student
 */
export const subscribeToCourseGradesByStudent = (
  studentId: string,
  callback: (grades: CourseGrade[]) => void
): (() => void) => {
  const q = query(
    collection(getDb(), COLLECTION_NAME),
    where('studentId', '==', studentId),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const grades: CourseGrade[] = [];
    snapshot.forEach((doc) => {
      grades.push({ id: doc.id, ...doc.data() } as CourseGrade);
    });
    callback(grades);
  });
};

/**
 * Subscribe to course grades for a specific course and period
 */
export const subscribeToCourseGradesByCourseAndPeriod = (
  courseId: string,
  periodId: string,
  callback: (grades: CourseGrade[]) => void
): (() => void) => {
  const q = query(
    collection(getDb(), COLLECTION_NAME),
    where('courseId', '==', courseId),
    where('periodId', '==', periodId),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const grades: CourseGrade[] = [];
    snapshot.forEach((doc) => {
      grades.push({ id: doc.id, ...doc.data() } as CourseGrade);
    });
    callback(grades);
  });
};

/**
 * Subscribe to all course grades for a period
 */
export const subscribeToCourseGradesByPeriod = (
  periodId: string,
  callback: (grades: CourseGrade[]) => void
): (() => void) => {
  const q = query(
    collection(getDb(), COLLECTION_NAME),
    where('periodId', '==', periodId),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const grades: CourseGrade[] = [];
    snapshot.forEach((doc) => {
      grades.push({ id: doc.id, ...doc.data() } as CourseGrade);
    });
    callback(grades);
  });
};

/**
 * Create a new course grade
 */
export const createCourseGrade = async (grade: Omit<CourseGrade, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), grade);
  return docRef.id;
};

/**
 * Update a course grade
 */
export const updateCourseGrade = async (
  id: string,
  updates: Partial<CourseGrade>
): Promise<void> => {
  const docRef = doc(getDb(), COLLECTION_NAME, id);
  await updateDoc(docRef, updates);
};

/**
 * Delete a course grade
 */
export const deleteCourseGrade = async (id: string): Promise<void> => {
  const docRef = doc(getDb(), COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

/**
 * Calculate average for a student in a course for a period
 */
export const calculateCourseAverage = (grades: CourseGrade[]): number => {
  if (grades.length === 0) return 0;

  let totalWeightedScore = 0;
  let totalWeight = 0;

  grades.forEach((grade) => {
    const percentage = (grade.score / grade.maxScore) * 100;
    totalWeightedScore += percentage * grade.weight;
    totalWeight += grade.weight;
  });

  return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
};

/**
 * Subscribe to ALL course grades (for DataContext)
 */
export const subscribeToCourseGrades = (
  callback: (grades: CourseGrade[]) => void
): (() => void) => {
  return onSnapshot(collection(getDb(), COLLECTION_NAME), (snapshot) => {
    const grades: CourseGrade[] = [];
    snapshot.forEach((doc) => {
      grades.push({ id: doc.id, ...doc.data() } as CourseGrade);
    });
    callback(grades);
  });
};

/**
 * Subscribe to course grades for multiple students
 */
export const subscribeToCourseGradesByStudentIds = (
  studentIds: string[],
  callback: (grades: CourseGrade[]) => void
): (() => void) => {
  if (studentIds.length === 0) return () => {};

  // Note: We cannot use orderBy with 'in' query without a composite index.
  // We will sort client-side.
  const q = query(collection(getDb(), COLLECTION_NAME), where('studentId', 'in', studentIds));

  return onSnapshot(q, (snapshot) => {
    const grades: CourseGrade[] = [];
    snapshot.forEach((doc) => {
      grades.push({ id: doc.id, ...doc.data() } as CourseGrade);
    });
    // Client-side sort by date descending
    grades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(grades);
  });
};
