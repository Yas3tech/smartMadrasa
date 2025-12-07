import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ClassGroup } from '../types';

const COLLECTION_NAME = 'classes';

export const getClasses = async (): Promise<ClassGroup[]> => {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ClassGroup));
};

export const createClass = async (classGroup: Omit<ClassGroup, 'id'>): Promise<string> => {
    if (!db) throw new Error('Firebase not configured');
    const docRef = await addDoc(collection(db, COLLECTION_NAME), classGroup);
    return docRef.id;
};

export const updateClass = async (id: string, updates: Partial<ClassGroup>): Promise<void> => {
    if (!db) throw new Error('Firebase not configured');
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
};

export const deleteClass = async (id: string): Promise<void> => {
    if (!db) throw new Error('Firebase not configured');
    await deleteDoc(doc(db, COLLECTION_NAME, id));
};

export const subscribeToClasses = (callback: (classes: ClassGroup[]) => void) => {
    if (!db) return () => { };
    return onSnapshot(collection(db, COLLECTION_NAME), snapshot => {
        const classes = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ClassGroup));
        callback(classes);
    });
};
