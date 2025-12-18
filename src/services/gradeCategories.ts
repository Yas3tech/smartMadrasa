import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import type { GradeCategory } from '../types/bulletin';
import { getDb } from './firebaseHelper';

const COLLECTION_NAME = 'gradeCategories';

/**
 * Subscribe to all grade categories
 */
export const subscribeToGradeCategories = (
  callback: (categories: GradeCategory[]) => void
): (() => void) => {
  const q = query(collection(getDb(), COLLECTION_NAME), orderBy('name', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const categories: GradeCategory[] = [];
    snapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() } as GradeCategory);
    });
    callback(categories);
  });
};

/**
 * Create a new grade category
 */
export const createGradeCategory = async (category: Omit<GradeCategory, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), category);
  return docRef.id;
};

/**
 * Update a grade category
 */
export const updateGradeCategory = async (
  id: string,
  updates: Partial<GradeCategory>
): Promise<void> => {
  const docRef = doc(getDb(), COLLECTION_NAME, id);
  await updateDoc(docRef, updates);
};

/**
 * Delete a grade category
 */
export const deleteGradeCategory = async (id: string): Promise<void> => {
  const docRef = doc(getDb(), COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
