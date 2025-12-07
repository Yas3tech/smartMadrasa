import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Homework, Submission } from '../types';

const COLLECTION_NAME = 'homeworks';
const SUBMISSIONS_COLLECTION = 'submissions';

export const getHomeworks = async (classId?: string): Promise<Homework[]> => {
    if (!db) return [];

    let q;
    if (classId) {
        q = query(collection(db, COLLECTION_NAME), where('classId', '==', classId), orderBy('dueDate', 'asc'));
    } else {
        q = query(collection(db, COLLECTION_NAME), orderBy('dueDate', 'asc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        dueDate: doc.data().dueDate?.toDate?.()?.toISOString() || doc.data().dueDate
    } as Homework));
};

export const createHomework = async (homework: Omit<Homework, 'id'>): Promise<string> => {
    if (!db) throw new Error('Firebase not configured');
    const docRef = await addDoc(collection(db, COLLECTION_NAME), homework);
    return docRef.id;
};

export const updateHomework = async (id: string, updates: Partial<Homework>): Promise<void> => {
    if (!db) throw new Error('Firebase not configured');
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
};

export const deleteHomework = async (id: string): Promise<void> => {
    if (!db) throw new Error('Firebase not configured');
    await deleteDoc(doc(db, COLLECTION_NAME, id));
};

export const subscribeToHomeworks = (callback: (homeworks: Homework[]) => void) => {
    if (!db) return () => { };
    const q = query(collection(db, COLLECTION_NAME), orderBy('dueDate', 'asc'));
    return onSnapshot(q, snapshot => {
        const homeworks = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            dueDate: doc.data().dueDate?.toDate?.()?.toISOString() || doc.data().dueDate
        } as Homework));
        callback(homeworks);
    });
};

// Submissions

export const getSubmissions = async (homeworkId: string): Promise<Submission[]> => {
    if (!db) return [];
    const q = query(collection(db, COLLECTION_NAME, homeworkId, SUBMISSIONS_COLLECTION));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        submittedAt: doc.data().submittedAt?.toDate?.()?.toISOString() || doc.data().submittedAt
    } as Submission));
};

export const submitHomework = async (homeworkId: string, submission: Omit<Submission, 'id'>): Promise<string> => {
    if (!db) throw new Error('Firebase not configured');
    const docRef = await addDoc(collection(db, COLLECTION_NAME, homeworkId, SUBMISSIONS_COLLECTION), submission);
    return docRef.id;
};

export const gradeSubmission = async (homeworkId: string, submissionId: string, grade: number, feedback?: string): Promise<void> => {
    if (!db) throw new Error('Firebase not configured');
    const docRef = doc(db, COLLECTION_NAME, homeworkId, SUBMISSIONS_COLLECTION, submissionId);
    await updateDoc(docRef, { grade, feedback });
};

export const subscribeToSubmissions = (homeworkId: string, callback: (submissions: Submission[]) => void) => {
    if (!db) return () => { };
    const q = query(collection(db, COLLECTION_NAME, homeworkId, SUBMISSIONS_COLLECTION));
    return onSnapshot(q, snapshot => {
        const submissions = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            submittedAt: doc.data().submittedAt?.toDate?.()?.toISOString() || doc.data().submittedAt
        } as Submission));
        callback(submissions);
    });
};
