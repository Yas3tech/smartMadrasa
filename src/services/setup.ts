import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/db';

/**
 * Lightweight check for the login page to avoid importing all user services.
 */
export const checkIfDatabaseEmpty = async (): Promise<boolean> => {
    if (!db) return true;
    try {
        const snapshot = await getDocs(collection(db, 'users'));
        return snapshot.empty;
    } catch {
        return false;
    }
};
