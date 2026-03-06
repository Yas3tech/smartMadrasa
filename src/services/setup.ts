import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/db';

/**
 * Lightweight check for the login page to avoid importing all user services.
 */
export const checkIfDatabaseEmpty = async (): Promise<boolean> => {
  if (!db) return true;
  try {
    const setupDoc = await getDoc(doc(db, '_setup', 'config'));
    return !setupDoc.exists();
  } catch (err) {
    // If we get permission denied, it means the doc exists and we can't read it
    // because isSetupOpen() in firestore rules returned false.
    return false;
  }
};
