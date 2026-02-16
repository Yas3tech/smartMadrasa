import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/db';
import { normalizeDate } from '../utils/date';
import { formatFirestoreDate } from '../utils/date';
import type { Homework, Submission } from '../types';
import { formatFirestoreTimestamp } from '../utils/dateUtils';
import { formatFirestoreTimestamp } from '../utils/date';

const COLLECTION_NAME = 'homeworks';
const SUBMISSIONS_COLLECTION = 'submissions';

export const getHomeworks = async (classId?: string): Promise<Homework[]> => {
  if (!db) return [];

  let q;
  if (classId) {
    q = query(
      collection(db, COLLECTION_NAME),
      where('classId', '==', classId),
      orderBy('dueDate', 'asc')
    );
  } else {
    q = query(collection(db, COLLECTION_NAME), orderBy('dueDate', 'asc'));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        ...doc.data(),
        id: doc.id,
        dueDate: normalizeDate(doc.data().dueDate),
        dueDate: formatFirestoreTimestamp(doc.data().dueDate),
      }) as Homework
  );
};

export const createHomework = async (homework: Omit<Homework, 'id'>): Promise<string> => {
  if (!db) throw new Error('Firebase not configured');
  const docRef = await addDoc(collection(db, COLLECTION_NAME), homework);
  return docRef.id;
};

export const updateHomework = async (id: string, updates: Partial<Homework>): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, updates);
};

export const deleteHomework = async (id: string): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};

export const subscribeToHomeworks = (callback: (homeworks: Homework[]) => void) => {
  if (!db) return () => { };
  const q = query(collection(db, COLLECTION_NAME), orderBy('dueDate', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const homeworks = snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          id: doc.id,
          dueDate: normalizeDate(doc.data().dueDate),
          dueDate: formatFirestoreTimestamp(doc.data().dueDate),
        }) as Homework
    );
    callback(homeworks);
  });
};

export const subscribeToHomeworksByClassIds = (
  classIds: string[],
  callback: (homeworks: Homework[]) => void
) => {
  if (!db || classIds.length === 0) return () => { };

  // Note: We cannot use orderBy with 'in' query without a composite index.
  // We will sort client-side.
  const q = query(collection(db, COLLECTION_NAME), where('classId', 'in', classIds));

  return onSnapshot(q, (snapshot) => {
    const homeworks = snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          id: doc.id,
          dueDate: normalizeDate(doc.data().dueDate),
          dueDate: formatFirestoreTimestamp(doc.data().dueDate),
        }) as Homework
    );
    // Client-side sort
    homeworks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    callback(homeworks);
  });
};

// Submissions

export const getSubmissions = async (homeworkId: string): Promise<Submission[]> => {
  if (!db) return [];
  const q = query(collection(db, COLLECTION_NAME, homeworkId, SUBMISSIONS_COLLECTION));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        ...doc.data(),
        id: doc.id,
        submittedAt: normalizeDate(doc.data().submittedAt),
        submittedAt: formatFirestoreTimestamp(doc.data().submittedAt),
      }) as Submission
  );
};

export const submitHomework = async (
  homeworkId: string,
  submission: Omit<Submission, 'id'>
): Promise<string> => {
  if (!db) throw new Error('Firebase not configured');
  const docRef = await addDoc(
    collection(db, COLLECTION_NAME, homeworkId, SUBMISSIONS_COLLECTION),
    submission
  );
  return docRef.id;
};

export const gradeSubmission = async (
  homeworkId: string,
  submissionId: string,
  grade: number,
  feedback?: string
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');
  const docRef = doc(db, COLLECTION_NAME, homeworkId, SUBMISSIONS_COLLECTION, submissionId);
  await updateDoc(docRef, { grade, feedback });
};

export const updateSubmission = async (
  homeworkId: string,
  submissionId: string,
  updates: Partial<Submission>
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');
  const docRef = doc(db, COLLECTION_NAME, homeworkId, SUBMISSIONS_COLLECTION, submissionId);
  await updateDoc(docRef, updates);
};

export const subscribeToSubmissions = (
  homeworkId: string,
  callback: (submissions: Submission[]) => void
) => {
  if (!db) return () => { };
  const q = query(collection(db, COLLECTION_NAME, homeworkId, SUBMISSIONS_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const submissions = snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          id: doc.id,
          submittedAt: normalizeDate(doc.data().submittedAt),
          submittedAt: formatFirestoreTimestamp(doc.data().submittedAt),
        }) as Submission
    );
    callback(submissions);
  });
};
