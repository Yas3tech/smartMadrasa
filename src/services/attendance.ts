import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  collectionGroup,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/db';
import type { Attendance } from '../types';

const COLLECTION_NAME = 'attendance';
const USERS_COLLECTION = 'users';

export const getAttendance = async (studentId?: string): Promise<Attendance[]> => {
  if (!db) return [];

  let q;
  if (studentId) {
    q = collection(db, USERS_COLLECTION, studentId, COLLECTION_NAME);
  } else {
    q = collectionGroup(db, COLLECTION_NAME);
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Attendance);
};

export const createAttendance = async (
  studentId: string,
  record: Omit<Attendance, 'id'>
): Promise<string> => {
  if (!db) throw new Error('Firebase not configured');
  const docRef = await addDoc(collection(db, USERS_COLLECTION, studentId, COLLECTION_NAME), record);
  return docRef.id;
};

export const updateAttendance = async (
  studentId: string,
  attendanceId: string,
  status: 'present' | 'absent' | 'late',
  justification?: string
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');
  const docRef = doc(db, USERS_COLLECTION, studentId, COLLECTION_NAME, attendanceId);
  await updateDoc(docRef, { status, justification, isJustified: !!justification });
};

export const subscribeToAttendance = (callback: (attendance: Attendance[]) => void) => {
  if (!db) return () => { };
  // Use collectionGroup to listen to ALL attendance records
  return onSnapshot(collectionGroup(db, COLLECTION_NAME), (snapshot) => {
    const attendance = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Attendance);
    callback(attendance);
  });
};

export const subscribeToAttendanceByStudentIds = (
  studentIds: string[],
  callback: (attendance: Attendance[]) => void
) => {
  if (!db || studentIds.length === 0) return () => { };

  // Note: collectionGroup queries with 'in' might need an index if other filters are applied.
  // But basic 'where' should be okay or prompt for index creation.
  // For safety with 'in' on collectionGroup, we might need to issue separate queries if array is large,
  // but for a parent's children (max 5-10), 'in' is fine.
  // However, attendance is likely subcollection of users.
  // If we want to query by studentId field on the document itself:
  const q = query(collectionGroup(db, COLLECTION_NAME), where('studentId', 'in', studentIds));

  return onSnapshot(q, (snapshot) => {
    const attendance = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Attendance);
    callback(attendance);
  });
};
