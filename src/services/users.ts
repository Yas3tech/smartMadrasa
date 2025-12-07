import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User } from '../types';

const COLLECTION_NAME = 'users';

export const getUsers = async (): Promise<User[]> => {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
};

export const getUserById = async (id: string): Promise<User | null> => {
    if (!db) return null;
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } as User : null;
};

import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
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

    // 2. Create Firestore Document
    const docRef = await addDoc(collection(db, COLLECTION_NAME), user);
    return docRef.id;
};

/**
 * Creates a user in Firebase Auth using a secondary app instance
 * to avoid logging out the current user.
 * Then sends a password reset email.
 */
const createAuthUser = async (email: string) => {
    // Initialize a secondary app
    const secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
    const secondaryAuth = getAuth(secondaryApp);

    try {
        // Create user with a temporary random password
        const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!";
        await createUserWithEmailAndPassword(secondaryAuth, email, tempPassword);

        // Send password reset email
        await sendPasswordResetEmail(secondaryAuth, email);

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

export const deleteUser = async (id: string): Promise<void> => {
    if (!db) throw new Error('Firebase not configured');
    await deleteDoc(doc(db, COLLECTION_NAME, id));
};

export const subscribeToUsers = (callback: (users: User[]) => void) => {
    if (!db) return () => { };
    return onSnapshot(collection(db, COLLECTION_NAME), snapshot => {
        const users = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
        callback(users);
    });
};
