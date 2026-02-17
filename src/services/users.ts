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
} from 'firebase/firestore';
import { db } from '../config/db';
import type { User } from '../types';
import { mapQuerySnapshot, mapDocumentSnapshot } from './firebaseHelper';

const COLLECTION_NAME = 'users';

export const getUsers = async (): Promise<User[]> => {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
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
import { getAuth, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, type Auth } from 'firebase/auth';
import { firebaseConfig } from '../config/firebase';



/**
 * Generates a secure random password
 */
export const generateSecurePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  let password = '';
  // Ensure we have at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 26));
  password += 'abcdefghijklmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 26));
  password += '0123456789'.charAt(Math.floor(Math.random() * 10));
  password += '!@#$%^&*()_+'.charAt(Math.floor(Math.random() * 12));

  // Fill the rest randomly
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

export const createUser = async (user: Omit<User, 'id'>): Promise<{ uid: string; password?: string; emailSent: boolean } | string> => {
  if (!db) throw new Error('Firebase not configured');

  let authResult: { uid: string; password?: string; emailSent: boolean } | null = null;
  let uid = '';

  // 1. Create Auth User (if email is provided)
  if (user.email) {
    try {
      authResult = await createAuthUser(user.email.toLowerCase().trim());
      uid = authResult.uid;
    } catch (error) {
      const firebaseErr = error as { code?: string };
      if (firebaseErr.code === 'auth/email-already-in-use') {
        // If user exists in Auth but not in Firestore with correct ID,
        // we might not have the UID here easily without Admin SDK.
        // For client side, we'll try to proceed or handle via email lookup later.
      } else {
        throw error;
      }
    }
  }

  // 2. Create Firestore Document with mustChangePassword flag
  const userWithPasswordFlag = {
    ...user,
    mustChangePassword: true,
  };

  if (uid) {
    // Sync Firestore ID with Auth UID
    const { setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, COLLECTION_NAME, uid), userWithPasswordFlag);
    return authResult || uid;
  } else {
    // Fallback to random ID if no Auth UID (e.g. email already in use or not provided)
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

const createAuthUser = async (email: string): Promise<{ uid: string; password?: string; emailSent: boolean }> => {
  // Use the existing secondary app or initialize it if needed
  const auth = getSecondaryAuth();
  const password = generateSecurePassword();

  // Create user with a secure random password
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  let emailSent = false;

  // Attempt to send password reset email
  try {
    await sendPasswordResetEmail(auth, email);
    emailSent = true;
  } catch (emailError) {
    console.warn('Failed to send password reset email:', emailError);
  }

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
export const deleteUser = async (id: string): Promise<void> => {
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
  queries: UserQueryFilters[] = []
) => {
  const firestore = db;
  if (!firestore) return () => { };

  // If no queries provided, fallback to default (fetch all)
  if (!queries || queries.length === 0) {
    return onSnapshot(collection(firestore, COLLECTION_NAME), (snapshot) => {
      callback(mapQuerySnapshot<User>(snapshot));
    });
  }

  // Handle multiple queries
  const unsubscribes: (() => void)[] = [];
  const results = new Map<number, User[]>(); // Map query index to results

  queries.forEach((filter, index) => {
    let q = query(collection(firestore, COLLECTION_NAME));

    if (filter.role) {
      const roles = Array.isArray(filter.role) ? filter.role : [filter.role];
      if (roles.length > 0) {
        q = query(q, where('role', 'in', roles));
      }
    }

    if (filter.classId) {
      const classIds = Array.isArray(filter.classId) ? filter.classId : [filter.classId];
      if (classIds.length > 0) {
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

    const unsub = onSnapshot(q, (snapshot) => {
      const users = mapQuerySnapshot<User>(snapshot);
      results.set(index, users);

      // Merge results
      const allUsersMap = new Map<string, User>();
      results.forEach((userList) => {
        userList.forEach((u) => allUsersMap.set(u.id, u));
      });

      callback(Array.from(allUsersMap.values()));
    });

    unsubscribes.push(unsub);
  });

  return () => {
    unsubscribes.forEach((unsub) => unsub());
  };
};
