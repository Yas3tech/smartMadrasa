import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  documentId,
} from 'firebase/firestore';
import { db } from '../config/db';
import type { ClassGroup } from '../types';
import { mapQuerySnapshot } from './firebaseHelper';

const COLLECTION_NAME = 'classes';

export const getClasses = async (): Promise<ClassGroup[]> => {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return mapQuerySnapshot<ClassGroup>(snapshot);
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

export const subscribeToClasses = (
  callback: (classes: ClassGroup[]) => void,
  classIds?: string[]
) => {
  if (!db) return () => { };

  if (classIds) {
    if (classIds.length === 0) {
      callback([]);
      return () => { };
    }

    const q = query(collection(db, COLLECTION_NAME), where(documentId(), 'in', classIds));
    return onSnapshot(q, (snapshot) => {
      callback(mapQuerySnapshot<ClassGroup>(snapshot));
    });
  }

  return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
    callback(mapQuerySnapshot<ClassGroup>(snapshot));
  });
};
