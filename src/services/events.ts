import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/db';
import type { Event } from '../types';
import { formatFirestoreTimestamp } from '../utils/dateUtils';

const COLLECTION_NAME = 'events';

export const getEvents = async (): Promise<Event[]> => {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.docs.map(
    (doc) =>
      ({
        ...doc.data(),
        id: doc.id,
        start: formatFirestoreTimestamp(doc.data().start),
        end: formatFirestoreTimestamp(doc.data().end),
      }) as Event
  );
};

export const createEvent = async (event: Omit<Event, 'id'>): Promise<string> => {
  if (!db) throw new Error('Firebase not configured');
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...event,
    start: Timestamp.fromDate(new Date(event.start)),
    end: Timestamp.fromDate(new Date(event.end)),
  });
  return docRef.id;
};

export const updateEvent = async (id: string, updates: Partial<Event>): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');
  const docRef = doc(db, COLLECTION_NAME, id);
  const processedUpdates: any = { ...updates };

  if (updates.start) {
    processedUpdates.start = Timestamp.fromDate(new Date(updates.start));
  }
  if (updates.end) {
    processedUpdates.end = Timestamp.fromDate(new Date(updates.end));
  }

  await updateDoc(docRef, processedUpdates);
};

export const deleteEvent = async (id: string): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};

export const subscribeToEvents = (callback: (events: Event[]) => void) => {
  if (!db) return () => { };
  return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
    const events = snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          id: doc.id,
          start: formatFirestoreTimestamp(doc.data().start),
          end: formatFirestoreTimestamp(doc.data().end),
        }) as Event
    );
    callback(events);
  });
};

export const subscribeToEventsByClassIds = (
  classIds: string[],
  callback: (events: Event[]) => void
) => {
  if (!db || classIds.length === 0) return () => { };

  const q = query(collection(db, COLLECTION_NAME), where('classId', 'in', classIds));

  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          id: doc.id,
          start: formatFirestoreTimestamp(doc.data().start),
          end: formatFirestoreTimestamp(doc.data().end),
        }) as Event
    );
    callback(events);
  });
};
