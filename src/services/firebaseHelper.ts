import { db } from '../config/firebase';
import type { Firestore } from 'firebase/firestore';

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
