import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User } from '../types';

const COLLECTION_NAME = 'users';

export const getUsers = async (): Promise<User[]> => {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as User);
};

export const getUserById = async (id: string): Promise<User | null> => {
  if (!db) return null;
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ ...docSnap.data(), id: docSnap.id } as User) : null;
};

import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '../config/firebase';

// ... existing imports

export const createUser = async (user: Omit<User, 'id'>): Promise<string> => {
  if (!db) throw new Error('Firebase not configured');

  // 1. Create Auth User (if email is provided)
  if (user.email) {
    try {
      await createAuthUser(user.email);
    } catch (error: any) {
      console.error('Error creating auth user:', error);
      // Continue even if auth creation fails (might already exist),
      // but ideally we should handle this better.
      if (error.code !== 'auth/email-already-in-use') {
        throw error;
      }
    }
  }

  // 2. Create Firestore Document with mustChangePassword flag
  const userWithPasswordFlag = {
    ...user,
    mustChangePassword: true,
  };
  const docRef = await addDoc(collection(db, COLLECTION_NAME), userWithPasswordFlag);
  return docRef.id;
};

/**
 * Creates a user in Firebase Auth using a secondary app instance
 * to avoid logging out the current user.
 * Uses a default password that users must change on first login.
 *
 * DEFAULT PASSWORD: School2024!
 */
export const DEFAULT_PASSWORD = 'School2024!';

const createAuthUser = async (email: string) => {
  // Initialize a secondary app
  const secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
  const secondaryAuth = getAuth(secondaryApp);

  try {
    // Create user with the default password
    await createUserWithEmailAndPassword(secondaryAuth, email, DEFAULT_PASSWORD);

    // Sign out from secondary auth immediately
    await signOut(secondaryAuth);
  } finally {
    // Clean up the secondary app
    await deleteApp(secondaryApp);
  }
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

export const subscribeToUsers = (callback: (users: User[]) => void) => {
  if (!db) return () => {};
  return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
    const users = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as User);
    callback(users);
  });
};
