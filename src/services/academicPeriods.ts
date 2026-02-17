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
import type { AcademicPeriod } from '../types/bulletin';
import { getDb, mapQuerySnapshot } from './firebaseHelper';

const COLLECTION_NAME = 'academicPeriods';

/**
 * Subscribe to all academic periods
 */
export const subscribeToAcademicPeriods = (
  callback: (periods: AcademicPeriod[]) => void
): (() => void) => {
  const q = query(collection(getDb(), COLLECTION_NAME), orderBy('order', 'asc'));

  return onSnapshot(q, (snapshot) => {
    callback(mapQuerySnapshot<AcademicPeriod>(snapshot));
  });
};

/**
 * Subscribe to academic periods for a specific year
 */
export const subscribeToAcademicPeriodsByYear = (
  academicYear: string,
  callback: (periods: AcademicPeriod[]) => void
): (() => void) => {
  const q = query(
    collection(getDb(), COLLECTION_NAME),
    where('academicYear', '==', academicYear),
    orderBy('order', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    callback(mapQuerySnapshot<AcademicPeriod>(snapshot));
  });
};

/**
 * Create a new academic period
 */
export const createAcademicPeriod = async (period: Omit<AcademicPeriod, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), period);
  return docRef.id;
};

/**
 * Update an academic period
 */
export const updateAcademicPeriod = async (
  id: string,
  updates: Partial<AcademicPeriod>
): Promise<void> => {
  const docRef = doc(getDb(), COLLECTION_NAME, id);
  await updateDoc(docRef, updates);
};

/**
 * Delete an academic period
 */
export const deleteAcademicPeriod = async (id: string): Promise<void> => {
  const docRef = doc(getDb(), COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

/**
 * Publish a period's bulletins
 */
export const publishPeriodBulletins = async (
  periodId: string,
  publishDate?: string
): Promise<void> => {
  const docRef = doc(getDb(), COLLECTION_NAME, periodId);
  await updateDoc(docRef, {
    isPublished: true,
    bulletinPublishDate: publishDate || new Date().toISOString(),
  });
};

/**
 * Unpublish a period's bulletins
 */
export const unpublishPeriodBulletins = async (periodId: string): Promise<void> => {
  const docRef = doc(getDb(), COLLECTION_NAME, periodId);
  await updateDoc(docRef, {
    isPublished: false,
    bulletinPublishDate: null,
  });
};
