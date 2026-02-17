import { db } from '../config/db';
import type { Firestore, QuerySnapshot, DocumentData, DocumentSnapshot } from 'firebase/firestore';

/**
 * Helper to ensure Firebase db is initialized
 * Throws an error if Firebase is not configured
 */
export const getDb = (): Firestore => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure Firebase credentials.');
  }
  return db;
};

/**
 * Maps a Firestore QuerySnapshot to an array of typed objects.
 * Handles the 'id' field and optional data transformations.
 */
export const mapQuerySnapshot = <T>(
  snapshot: QuerySnapshot<DocumentData>,
  transform?: (data: DocumentData) => Partial<T>
): T[] => {
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    // Default: map id and spread data
    const base = { ...data, id: doc.id } as unknown as T;
    // Apply transformation if provided
    return transform ? { ...base, ...transform(data) } : base;
  });
};

/**
 * Maps a Firestore DocumentSnapshot to a typed object or null if it doesn't exist.
 * Handles the 'id' field and optional data transformations.
 */
export const mapDocumentSnapshot = <T>(
  docSnap: DocumentSnapshot<DocumentData>,
  transform?: (data: DocumentData) => Partial<T>
): T | null => {
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  const base = { ...data, id: docSnap.id } as unknown as T;
  return transform ? { ...base, ...transform(data) } : base;
};
