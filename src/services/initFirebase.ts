import { collection, doc, getDocs, deleteDoc, setDoc, collectionGroup, clearIndexedDbPersistence } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../config/db';
import { auth } from '../config/firebase';

export const clearAllData = async () => {
  if (!db || !auth) return;

  // 0. Dispatch event to unsubscribe all active listeners to prevent Firebase internals crash
  window.dispatchEvent(new Event('app:wipeData'));

  try {
    // 1. Delete all Firebase Auth Accounts first via Cloud Function
    const functions = getFunctions();
    const wipeAuthUsers = httpsCallable(functions, 'wipeAllAuthUsers');
    await wipeAuthUsers();
    console.log('Successfully wiped all auth users');
  } catch (error) {
    console.error('Failed to wipe auth users:', error);
    // Continue with Firestore deletion even if Auth wipe fails (e.g. timeout)
  }

  // Subcollections first
  const subcollections = ['grades', 'attendance', 'courses'];
  for (const subcol of subcollections) {
    const querySnapshot = await getDocs(collectionGroup(db!, subcol));
    const deletePromises = querySnapshot.docs.map((document) => deleteDoc(document.ref));
    await Promise.all(deletePromises);
  }

  // Then main collections
  const collections = [
    'classes',
    'messages',
    'events',
    'academicPeriods',
    'gradeCategories',
    'courseGrades',
    'teacherComments',
    'homeworks',
    'announcements',
    'notifications',
    '_setup',
  ];

  for (const collectionName of collections) {
    const querySnapshot = await getDocs(collection(db!, collectionName));
    const deletePromises = querySnapshot.docs.map((document) =>
      deleteDoc(doc(db!, collectionName, document.id))
    );
    await Promise.all(deletePromises);
  }

  // Delete users VERY LAST so the superadmin doesn't lose privileges midway through script
  const usersSnapshot = await getDocs(collection(db!, 'users'));
  const usersDeletePromises = usersSnapshot.docs.map((document) =>
    deleteDoc(doc(db!, 'users', document.id))
  );
  await Promise.all(usersDeletePromises);

  // Obliterate the local IndexedDB cache so the JS SDK doesn't try to reconcile deleted documents
  try {
    await clearIndexedDbPersistence(db!);
    console.log('Successfully cleared Firestore IndexedDB persistence');
  } catch (e) {
    console.warn('Failed to clear IndexedDB persistence. This is usually fine if persistence was not enabled.', e);
  }
};

export const seedSystemBasics = async () => {
  if (!db) return;

  const periods = [
    {
      id: 'period-2024-2025-t1',
      name: 'Trimestre 1',
      academicYear: '2024-2025',
      startDate: '2024-09-01',
      endDate: '2024-12-20',
      gradeEntryStartDate: '2024-09-01',
      gradeEntryEndDate: '2024-12-25',
      isPublished: false,
      order: 1,
    },
    {
      id: 'period-2024-2025-t2',
      name: 'Trimestre 2',
      academicYear: '2024-2025',
      startDate: '2025-01-06',
      endDate: '2025-03-28',
      gradeEntryStartDate: '2025-01-06',
      gradeEntryEndDate: '2025-04-02',
      isPublished: false,
      order: 2,
    },
    {
      id: 'period-2024-2025-t3',
      name: 'Trimestre 3',
      academicYear: '2024-2025',
      startDate: '2025-04-14',
      endDate: '2025-06-30',
      gradeEntryStartDate: '2025-04-14',
      gradeEntryEndDate: '2025-07-05',
      isPublished: false,
      order: 3,
    },
  ];

  for (const period of periods) {
    await setDoc(doc(db, 'academicPeriods', period.id), period);
  }

  const categories = [
    {
      id: 'cat-test',
      name: 'Test',
      code: 'TEST',
      weight: 20,
      color: '#3B82F6',
      description: '20% de la note finale',
    },
    {
      id: 'cat-exam',
      name: 'Examen',
      code: 'EXAM',
      weight: 50,
      color: '#EF4444',
      description: '50% de la note finale',
    },
    {
      id: 'cat-homework',
      name: 'Devoir',
      code: 'HW',
      weight: 20,
      color: '#10B981',
      description: '20% de la note finale',
    },
    {
      id: 'cat-participation',
      name: 'Participation',
      code: 'PART',
      weight: 10,
      color: '#F59E0B',
      description: '10% de la note finale',
    },
  ];

  for (const cat of categories) {
    await setDoc(doc(db, 'gradeCategories', cat.id), cat);
  }
};
