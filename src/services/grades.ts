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
import { db } from '../config/db';
import { normalizeDate } from '../utils/date';
import { formatFirestoreDate } from '../utils/date';
import type { Grade } from '../types';
import { formatFirestoreTimestamp } from '../utils/dateUtils';
import { formatFirestoreTimestamp } from '../utils/date';

const COLLECTION_NAME = 'grades';
const USERS_COLLECTION = 'users';

export const getGrades = async (studentId?: string): Promise<Grade[]> => {
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
  return snapshot.docs.map(
    (doc) =>
      ({
        ...doc.data(),
        id: doc.id,
        date: normalizeDate(doc.data().date),
        date: formatFirestoreTimestamp(doc.data().date),
      }) as Grade
  );
};

export const createGrade = async (studentId: string, grade: Omit<Grade, 'id'>): Promise<string> => {
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
  if (!db) return () => { };
  // Use collectionGroup to listen to ALL grades across all users
  return onSnapshot(collectionGroup(db, COLLECTION_NAME), (snapshot) => {
    const grades = snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          id: doc.id,
          date: normalizeDate(doc.data().date),
          date: formatFirestoreTimestamp(doc.data().date),
        }) as Grade
    );
    callback(grades);
  });
};
