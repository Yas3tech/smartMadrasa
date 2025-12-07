import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    writeBatch
} from 'firebase/firestore';
import { getDb } from './firebaseHelper';
import type { TeacherComment } from '../types/bulletin';

const COLLECTION_NAME = 'teacherComments';

/**
 * Subscribe to teacher comments for a student
 */
export const subscribeToTeacherCommentsByStudent = (
    studentId: string,
    callback: (comments: TeacherComment[]) => void
): (() => void) => {
    const q = query(
        collection(getDb(), COLLECTION_NAME),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const comments: TeacherComment[] = [];
        snapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() } as TeacherComment);
        });
        callback(comments);
    });
};

/**
 * Subscribe to teacher comments for a specific course and period
 */
export const subscribeToTeacherCommentsByCourseAndPeriod = (
    courseId: string,
    periodId: string,
    callback: (comments: TeacherComment[]) => void
): (() => void) => {
    const q = query(
        collection(getDb(), COLLECTION_NAME),
        where('courseId', '==', courseId),
        where('periodId', '==', periodId)
    );

    return onSnapshot(q, (snapshot) => {
        const comments: TeacherComment[] = [];
        snapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() } as TeacherComment);
        });
        callback(comments);
    });
};

/**
 * Subscribe to comments by a specific teacher
 */
export const subscribeToTeacherCommentsByTeacher = (
    teacherId: string,
    periodId: string,
    callback: (comments: TeacherComment[]) => void
): (() => void) => {
    const q = query(
        collection(getDb(), COLLECTION_NAME),
        where('teacherId', '==', teacherId),
        where('periodId', '==', periodId),
        orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const comments: TeacherComment[] = [];
        snapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() } as TeacherComment);
        });
        callback(comments);
    });
};

/**
 * Create a new teacher comment
 */
export const createTeacherComment = async (
    comment: Omit<TeacherComment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), {
        ...comment,
        createdAt: now,
        updatedAt: now
        // Don't override isValidated - respect the value passed in
    });
    return docRef.id;
};

/**
 * Batch create or update teacher comments
 * Optimized for bulk validation
 */
export const batchCreateTeacherComments = async (
    comments: Omit<TeacherComment, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<void> => {
    const db = getDb();
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    comments.forEach(comment => {
        const docRef = doc(collection(db, COLLECTION_NAME));
        batch.set(docRef, {
            ...comment,
            createdAt: now,
            updatedAt: now
        });
    });

    await batch.commit();
};

/**
 * Update a teacher comment
 */
export const updateTeacherComment = async (
    id: string,
    updates: Partial<TeacherComment>
): Promise<void> => {
    const docRef = doc(getDb(), COLLECTION_NAME, id);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
    });
};

/**
 * Validate a teacher comment (marks course as ready for publication)
 */
export const validateTeacherComment = async (id: string): Promise<void> => {
    const docRef = doc(getDb(), COLLECTION_NAME, id);
    await updateDoc(docRef, {
        isValidated: true,
        validationDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
};

/**
 * Delete a teacher comment
 */
export const deleteTeacherComment = async (id: string): Promise<void> => {
    const docRef = doc(getDb(), COLLECTION_NAME, id);
    await deleteDoc(docRef);
};

/**
 * Subscribe to all teacher comments for a period (for Director Dashboard)
 */
export const subscribeToTeacherCommentsByPeriod = (
    periodId: string,
    callback: (comments: TeacherComment[]) => void
): (() => void) => {
    const q = query(
        collection(getDb(), COLLECTION_NAME),
        where('periodId', '==', periodId)
    );

    return onSnapshot(q, (snapshot) => {
        const comments: TeacherComment[] = [];
        snapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() } as TeacherComment);
        });
        callback(comments);
    });
};
