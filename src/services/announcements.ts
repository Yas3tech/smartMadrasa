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
import { db } from '../config/db';

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

export const subscribeToAnnouncements = (callback: (announcements: Announcement[]) => void) => {
  if (!db) return () => { };

  const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const announcements = snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          id: doc.id,
          date:
            doc.data().date instanceof Timestamp
              ? doc.data().date.toDate().toISOString()
              : doc.data().date,
        }) as Announcement
    );
    callback(announcements);
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
