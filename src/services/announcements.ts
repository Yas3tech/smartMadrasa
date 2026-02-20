import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '../config/db';
import { mapQuerySnapshot } from './firebaseHelper';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'urgent' | 'info' | 'event' | 'general';
  target: 'all' | 'students' | 'parents' | 'teachers';
  author: string;
  authorRole: string;
  date: string;
  pinned: boolean;
  read?: boolean;
}

const COLLECTION_NAME = 'announcements';

// Helper for transforming timestamps
const transformAnnouncement = (data: DocumentData): Partial<Announcement> => ({
  date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
});

export const subscribeToAnnouncements = (callback: (announcements: Announcement[]) => void) => {
  if (!db) return () => {};

  const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));

  return onSnapshot(q, (snapshot) => {
    callback(mapQuerySnapshot<Announcement>(snapshot, transformAnnouncement));
  });
};

export const createAnnouncement = async (
  announcement: Omit<Announcement, 'id'>
): Promise<string> => {
  if (!db) throw new Error('Firebase not configured');
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...announcement,
    date: new Date().toISOString(),
  });
  return docRef.id;
};

export const updateAnnouncement = async (
  id: string,
  updates: Partial<Announcement>
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, updates);
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};
