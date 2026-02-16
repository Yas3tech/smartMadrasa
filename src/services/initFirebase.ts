import { collection, getDocs, deleteDoc, doc, setDoc, collectionGroup } from 'firebase/firestore';
import { db } from '../config/db';

export const clearAllData = async () => {
  if (!db) return;

  const collections = [
    'users',
    'classes',
    'messages',
    'events',
    'academicPeriods',
    'gradeCategories',
    'courseGrades',
    'teacherComments',
  ];

  for (const collectionName of collections) {
    const querySnapshot = await getDocs(collection(db!, collectionName));
    const deletePromises = querySnapshot.docs.map((document) =>
      deleteDoc(doc(db!, collectionName, document.id))
    );
    await Promise.all(deletePromises);
  }

  const subcollections = ['grades', 'attendance', 'courses'];
  for (const subcol of subcollections) {
    const querySnapshot = await getDocs(collectionGroup(db!, subcol));
    const deletePromises = querySnapshot.docs.map((document) => deleteDoc(document.ref));
    await Promise.all(deletePromises);
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
