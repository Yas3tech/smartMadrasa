import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  onSnapshot,
  or,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/db';
import type { Message } from '../types';
import { formatFirestoreTimestamp } from '../utils/dateUtils';
import { mapQuerySnapshot } from './firebaseHelper';

const COLLECTION_NAME = 'messages';

// Helper for transforming message timestamps
const transformMessage = (data: DocumentData): Partial<Message> => ({
  timestamp: formatFirestoreTimestamp(data.timestamp),
});

export const getMessages = async (userId?: string): Promise<Message[]> => {
  if (!db) return [];

  let q;
  if (userId) {
    q = query(
      collection(db, COLLECTION_NAME),
      or(
        where('senderId', '==', userId),
        where('receiverId', 'in', [userId, 'all'])
      )
    );
  } else {
    q = query(collection(db, COLLECTION_NAME));
  }

  const snapshot = await getDocs(q);
  const messages = mapQuerySnapshot<Message>(snapshot, transformMessage);

  return messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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

export const subscribeToMessages = (callback: (messages: Message[]) => void, userId?: string) => {
  if (!db) return () => { };

  let q;
  if (userId) {
    q = query(
      collection(db, COLLECTION_NAME),
      or(
        where('senderId', '==', userId),
        where('receiverId', 'in', [userId, 'all'])
      )
    );
  } else {
    q = query(collection(db, COLLECTION_NAME));
  }

  return onSnapshot(q, (snapshot) => {
    const messages = mapQuerySnapshot<Message>(snapshot, transformMessage);
    messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    callback(messages);
  });
};
