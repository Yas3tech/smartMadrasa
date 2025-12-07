import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    collectionGroup,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Course } from '../types';

const COLLECTION_NAME = 'courses';
const CLASSES_COLLECTION = 'classes';

export const getCourses = async (classId?: string): Promise<Course[]> => {
    if (!db) return [];

    let q;
    if (classId) {
        q = collection(db, CLASSES_COLLECTION, classId, COLLECTION_NAME);
    } else {
        q = collectionGroup(db, COLLECTION_NAME);
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Course));
};

export const createCourse = async (classId: string, course: Omit<Course, 'id'>): Promise<string> => {
    if (!db) throw new Error('Firebase not configured');
    const docRef = await addDoc(collection(db, CLASSES_COLLECTION, classId, COLLECTION_NAME), course);
    return docRef.id;
};

export const updateCourse = async (classId: string, courseId: string, updates: Partial<Course>): Promise<void> => {
    if (!db) throw new Error('Firebase not configured');
    const docRef = doc(db, CLASSES_COLLECTION, classId, COLLECTION_NAME, courseId);
    await updateDoc(docRef, updates);
};

export const deleteCourse = async (classId: string, courseId: string): Promise<void> => {
    if (!db) throw new Error('Firebase not configured');
    await deleteDoc(doc(db, CLASSES_COLLECTION, classId, COLLECTION_NAME, courseId));
};

export const subscribeToCourses = (callback: (courses: Course[]) => void) => {
    if (!db) return () => { };
    // Use collectionGroup to listen to ALL courses across all classes
    return onSnapshot(collectionGroup(db, COLLECTION_NAME), snapshot => {
        const courses = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Course));
        callback(courses);
    });
};
