import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  collectionGroup,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '../config/db';
import type { Grade } from '../types';
import { formatFirestoreTimestamp } from '../utils/date';
import { mapQuerySnapshot } from './firebaseHelper';

const COLLECTION_NAME = 'grades';
const USERS_COLLECTION = 'users';

/**
 * @deprecated This service is deprecated in favor of src/services/courseGrades.ts
 * The new system uses a root 'courseGrades' collection instead of subcollections.
 */
const logDeprecationWarning = () => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Using deprecated grades service. Please migrate to courseGrades service.');
  }
};

// Helper for transforming timestamps
const transformGrade = (data: DocumentData): Partial<Grade> => ({
  date: formatFirestoreTimestamp(data.date) as string,
});

export const getGrades = async (studentId?: string): Promise<Grade[]> => {
  logDeprecationWarning();
  if (!db) return [];

  let q;
  if (studentId) {
    // Direct subcollection access
    q = collection(db, USERS_COLLECTION, studentId, COLLECTION_NAME);
  } else {
    // Collection Group Query for all grades
    q = collectionGroup(db, COLLECTION_NAME);
  }

  const snapshot = await getDocs(q);
  return mapQuerySnapshot<Grade>(snapshot, transformGrade);
};

export const createGrade = async (studentId: string, grade: Omit<Grade, 'id'>): Promise<string> => {
  logDeprecationWarning();
  if (!db) throw new Error('Firebase not configured');
  // Add to users/{studentId}/grades
  const docRef = await addDoc(collection(db, USERS_COLLECTION, studentId, COLLECTION_NAME), {
    ...grade,
    date: Timestamp.fromDate(new Date(grade.date)),
  });
  return docRef.id;
};

export const updateGrade = async (
  studentId: string,
  gradeId: string,
  updates: Partial<Grade>
): Promise<void> => {
  logDeprecationWarning();
  if (!db) throw new Error('Firebase not configured');
  const docRef = doc(db, USERS_COLLECTION, studentId, COLLECTION_NAME, gradeId);
  type GradeUpdate = Partial<Omit<Grade, 'date'> & { date: string | Timestamp }>;
  const processedUpdates: GradeUpdate = { ...updates };

  if (updates.date) {
    processedUpdates.date = Timestamp.fromDate(new Date(updates.date));
  }

  await updateDoc(docRef, processedUpdates);
};

export const subscribeToGrades = (callback: (grades: Grade[]) => void) => {
  logDeprecationWarning();
  if (!db) return () => {};
  // Use collectionGroup to listen to ALL grades across all users
  return onSnapshot(collectionGroup(db, COLLECTION_NAME), (snapshot) => {
    callback(mapQuerySnapshot<Grade>(snapshot, transformGrade));
  });
};
