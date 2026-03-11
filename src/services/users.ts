import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  limit,
  startAfter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/db';
import type { User } from '../types';
import { mapQuerySnapshot, mapDocumentSnapshot } from './firebaseHelper';

const COLLECTION_NAME = 'users';

export const getUsers = async (lastDocSnapshot?: QueryDocumentSnapshot): Promise<User[]> => {
  if (!db) return [];
  let q = query(collection(db, COLLECTION_NAME), limit(500));
  if (lastDocSnapshot) {
    q = query(collection(db, COLLECTION_NAME), startAfter(lastDocSnapshot), limit(500));
  }
  const snapshot = await getDocs(q);
  return mapQuerySnapshot<User>(snapshot);
};

export const checkIfDatabaseEmpty = async (): Promise<boolean> => {
  if (!db) return true;
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.empty;
};

export const getUserById = async (id: string): Promise<User | null> => {
  if (!db) return null;
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  return mapDocumentSnapshot<User>(docSnap);
};

import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
  type Auth,
} from 'firebase/auth';
import { firebaseConfig } from '../config/firebase';

/**
 * Generates a secure random password
 */
export const generateSecurePassword = (): string => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+';
  const allChars = upper + lower + numbers + special;

  const getRandomInt = (max: number): number => {
    const array = new Uint32Array(1);
    let randomValue = 0;
    do {
      crypto.getRandomValues(array);
      randomValue = array[0];
    } while (randomValue >= 0xffffffff - (0xffffffff % max));
    return randomValue % max;
  };

  let password = '';
  // Ensure we have at least one of each type
  password += upper.charAt(getRandomInt(upper.length));
  password += lower.charAt(getRandomInt(lower.length));
  password += numbers.charAt(getRandomInt(numbers.length));
  password += special.charAt(getRandomInt(special.length));

  // Fill the rest randomly
  for (let i = 0; i < 8; i++) {
    password += allChars.charAt(getRandomInt(allChars.length));
  }

  // Cryptographically secure shuffle using sorting
  const passwordArray = password.split('');
  const randomValues = new Uint32Array(passwordArray.length);
  crypto.getRandomValues(randomValues);

  return passwordArray
    .map((char, i) => ({ char, sort: randomValues[i] }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ char }) => char)
    .join('');
};

export const createUser = async (
  user: Omit<User, 'id'>
): Promise<{ uid: string; password?: string; emailSent: boolean } | string> => {
  if (!db) throw new Error('Firebase not configured');

  let authResult: { uid: string; password?: string; emailSent: boolean } | null = null;
  let uid = '';

  // 1. Create Auth User (if email is provided)
  if (user.email) {
    try {
      authResult = await createAuthUser(user.email.toLowerCase().trim());
      uid = authResult.uid;
    } catch (error) {
      throw error;
    }
  }

  if (uid) {
    // Sync Firestore ID with Auth UID.
    // IMPORTANT: Explicitly set `id` to the Auth UID to prevent the client-generated
    // UUID (passed in via the `user` object) from being stored as the internal id,
    // which would break Firestore security rules that look up users/{request.auth.uid}.
    const userWithPasswordFlag = {
      ...user,
      id: uid,                  // ← Override any client-side UUID with the real Auth UID
      mustChangePassword: true, // Force password rotation on first login
    };
    const { setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, COLLECTION_NAME, uid), userWithPasswordFlag);
    return authResult || uid;
  } else {
    // Fallback to random ID if no Auth UID (e.g. email not provided)
    const userWithPasswordFlag = {
      ...user,
      mustChangePassword: true,
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), userWithPasswordFlag);
    return docRef.id;
  }
};

let secondaryApp: FirebaseApp | undefined;
let secondaryAuth: Auth | undefined;

const getSecondaryAuth = (): Auth => {
  if (!secondaryApp) {
    secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
    secondaryAuth = getAuth(secondaryApp);
  }
  // We know secondaryAuth is set if secondaryApp is set
  return secondaryAuth!;
};

const createAuthUser = async (
  email: string
): Promise<{ uid: string; password?: string; emailSent: boolean }> => {
  // Use the existing secondary app or initialize it if needed
  const auth = getSecondaryAuth();
  const password = generateSecurePassword();

  // Create user with a secure random password
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  // We no longer send the password reset email automatically here.
  // The user will request it themselves from the Login page using the "S'inscrire" button.
  const emailSent = false;

  // Sign out from secondary auth immediately
  await signOut(auth);
  return { uid, password, emailSent };
};

/**
 * Finds a user by email in Firestore.
 * Useful for fallback when UID lookup fails.
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  if (!db) return null;
  const { query, where, limit } = await import('firebase/firestore');
  const normalizedEmail = email.toLowerCase().trim();
  const q = query(collection(db, COLLECTION_NAME), where('email', '==', normalizedEmail), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return mapDocumentSnapshot<User>(snapshot.docs[0]);
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, updates);
};

import { deleteAllUserData, previewUserDataDeletion } from './deleteUserData';

/**
 * Supprime un utilisateur et TOUTES ses données associées (conformité RGPD)
 * @param id - L'ID de l'utilisateur à supprimer
 * @param role - Le rôle de l'utilisateur (student, parent, teacher, etc.)
 * @returns Le résultat de la suppression avec le détail des données supprimées
 */
export const deleteUserWithAllData = async (id: string, role: string) => {
  if (!db) throw new Error('Firebase not configured');
  return await deleteAllUserData(id, role);
};

/**
 * Prévisualise les données qui seront supprimées (sans les supprimer)
 * Utile pour afficher une confirmation à l'utilisateur
 */
export const previewUserDeletion = async (id: string, role: string) => {
  return await previewUserDataDeletion(id, role);
};

/**
 * Supprime uniquement le document utilisateur (ancienne méthode)
 * @deprecated Utiliser deleteUserWithAllData pour la conformité RGPD
 */
export const deleteUserAccount = async (id: string): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};

export interface UserQueryFilters {
  role?: string | string[];
  classId?: string | string[];
  relatedClassIds?: string | string[];
}

export const subscribeToUsers = (
  callback: (users: User[]) => void,
  queries: UserQueryFilters[] = [],
  lastDocSnapshot?: QueryDocumentSnapshot
) => {
  const firestore = db;
  if (!firestore) return () => { };

  // If no queries provided, fallback to default (fetch up to 500)
  if (!queries || queries.length === 0) {
    let defaultQuery = query(collection(firestore, COLLECTION_NAME), limit(500));
    if (lastDocSnapshot) {
      defaultQuery = query(collection(firestore, COLLECTION_NAME), startAfter(lastDocSnapshot), limit(500));
    }
    return onSnapshot(defaultQuery, (snapshot) => {
      callback(mapQuerySnapshot<User>(snapshot));
    });
  }

  // Handle multiple queries
  const unsubscribes: (() => void)[] = [];
  const results = new Map<number, User[]>(); // Map query index to results

  queries.forEach((filter, index) => {
    let q = query(collection(firestore, COLLECTION_NAME), limit(500));

    if (filter.role) {
      const roles = Array.isArray(filter.role) ? filter.role : [filter.role];
      if (roles.length === 1) {
        q = query(q, where('role', '==', roles[0]));
      } else if (roles.length > 1) {
        q = query(q, where('role', 'in', roles));
      }
    }

    if (filter.classId) {
      const classIds = Array.isArray(filter.classId) ? filter.classId : [filter.classId];
      if (classIds.length === 1) {
        q = query(q, where('classId', '==', classIds[0]));
      } else if (classIds.length > 1) {
        q = query(q, where('classId', 'in', classIds));
      }
    }

    if (filter.relatedClassIds) {
      const relatedClassIds = Array.isArray(filter.relatedClassIds)
        ? filter.relatedClassIds
        : [filter.relatedClassIds];
      if (relatedClassIds.length > 0) {
        q = query(q, where('relatedClassIds', 'array-contains-any', relatedClassIds));
      }
    }

    if (lastDocSnapshot) {
      q = query(q, startAfter(lastDocSnapshot));
    }

    const unsub = onSnapshot(q, (snapshot) => {
      const users = mapQuerySnapshot<User>(snapshot);
      results.set(index, users);

      // Optimized merge: flatten arrays and use Map constructor for deduping
      const allUsers = Array.from(results.values()).flat();
      const uniqueUsersMap = new Map(allUsers.map((u) => [u.id, u]));

      callback(Array.from(uniqueUsersMap.values()));
    });

    unsubscribes.push(unsub);
  });

  return () => {
    unsubscribes.forEach((unsub) => unsub());
  };
};
