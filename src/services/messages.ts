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
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/db';
import type { Message } from '../types';

const COLLECTION_NAME = 'messages';

export const getMessages = async (userId?: string): Promise<Message[]> => {
  if (!db) return [];

  let q;
  if (userId) {
    q = query(
      collection(db, COLLECTION_NAME),
      where('receiverId', 'in', [userId, 'all']),
      orderBy('timestamp', 'desc')
    );
  } else {
    q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        ...doc.data(),
        id: doc.id,
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp,
      }) as Message
  );
};

export const sendMessage = async (message: Omit<Message, 'id' | 'timestamp'>): Promise<string> => {
  if (!db) throw new Error('Firebase not configured');
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...message,
    timestamp: Timestamp.now(),
  });
  return docRef.id;
};

export const markMessageAsRead = async (id: string): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { read: true });
};

export const updateMessage = async (id: string, updates: Partial<Message>): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, updates);
};

export const deleteMessage = async (id: string): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};

export const subscribeToMessages = (callback: (messages: Message[]) => void) => {
  if (!db) return () => { };
  const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          id: doc.id,
          timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp,
        }) as Message
    );
    callback(messages);
  });
};
