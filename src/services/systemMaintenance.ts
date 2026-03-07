import {
  addDoc,
  collection,
  collectionGroup,
  getDocs,
  writeBatch,
  type DocumentReference,
} from 'firebase/firestore';
import { deleteObject, listAll, ref } from 'firebase/storage';
import type { AcademicPeriod } from '../types/bulletin';
import { db, storage } from '../config/db';

type AnnualCollectionName =
  | 'messages'
  | 'homeworks'
  | 'announcements'
  | 'notifications'
  | 'events'
  | 'attendance'
  | 'courseGrades'
  | 'teacherComments';

export interface AdvanceYearResult {
  nextAcademicYear: string;
  deletedDocs: Record<AnnualCollectionName, number>;
  deletedStorageFiles: number;
  createdPeriods: number;
}

const YEAR_RANGE_PATTERN = /^(\d{4})-(\d{4})$/;

const deleteInBatches = async (refs: DocumentReference[]): Promise<void> => {
  if (!db || refs.length === 0) {
    return;
  }

  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    refs.slice(i, i + 450).forEach((docRef) => batch.delete(docRef));
    await batch.commit();
  }
};

const shiftIsoDateByOneYear = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
};

const buildNextAcademicYear = (academicYear: string): string => {
  const match = academicYear.match(YEAR_RANGE_PATTERN);
  if (!match) {
    throw new Error(`Format d'annee scolaire invalide: ${academicYear}`);
  }

  return `${Number(match[1]) + 1}-${Number(match[2]) + 1}`;
};

const getLatestAcademicYear = (periods: AcademicPeriod[]): string => {
  const academicYears = [...new Set(periods.map((period) => period.academicYear))].sort();
  const latestAcademicYear = academicYears.at(-1);

  if (!latestAcademicYear) {
    throw new Error("Aucune annee scolaire n'est disponible.");
  }

  return latestAcademicYear;
};

const createNextPeriods = async (
  latestAcademicYear: string,
  periods: AcademicPeriod[]
): Promise<{ nextAcademicYear: string; createdPeriods: number }> => {
  if (!db) {
    throw new Error('Firebase Firestore non configure');
  }

  const nextAcademicYear = buildNextAcademicYear(latestAcademicYear);
  const sourcePeriods = periods
    .filter((period) => period.academicYear === latestAcademicYear)
    .sort((a, b) => a.order - b.order);

  if (sourcePeriods.length === 0) {
    throw new Error(`Aucune periode trouvee pour ${latestAcademicYear}`);
  }

  const existingNextPeriods = periods.filter((period) => period.academicYear === nextAcademicYear);
  if (existingNextPeriods.length > 0) {
    return { nextAcademicYear, createdPeriods: 0 };
  }

  for (const period of sourcePeriods) {
    await addDoc(collection(db, 'academicPeriods'), {
      name: period.name,
      academicYear: nextAcademicYear,
      startDate: shiftIsoDateByOneYear(period.startDate),
      endDate: shiftIsoDateByOneYear(period.endDate),
      gradeEntryStartDate: shiftIsoDateByOneYear(period.gradeEntryStartDate),
      gradeEntryEndDate: shiftIsoDateByOneYear(period.gradeEntryEndDate),
      isPublished: false,
      order: period.order,
    });
  }

  return { nextAcademicYear, createdPeriods: sourcePeriods.length };
};

const deleteCollectionDocs = async (name: AnnualCollectionName): Promise<number> => {
  if (!db) {
    return 0;
  }

  const snapshot = await getDocs(collection(db, name));
  await deleteInBatches(snapshot.docs.map((docSnap) => docSnap.ref));
  return snapshot.size;
};

const deleteHomeworkSubmissions = async (): Promise<number> => {
  if (!db) {
    return 0;
  }

  const snapshot = await getDocs(collectionGroup(db, 'submissions'));
  await deleteInBatches(snapshot.docs.map((docSnap) => docSnap.ref));
  return snapshot.size;
};

const deleteStorageFolder = async (path: string): Promise<number> => {
  if (!storage) {
    return 0;
  }

  try {
    const rootRef = ref(storage, path);
    const result = await listAll(rootRef);
    await Promise.all(result.items.map((itemRef) => deleteObject(itemRef)));
    const nestedCounts = await Promise.all(
      result.prefixes.map((prefixRef) => deleteStorageFolder(prefixRef.fullPath))
    );

    return result.items.length + nestedCounts.reduce((sum, count) => sum + count, 0);
  } catch {
    return 0;
  }
};

export const advanceToNextAcademicYear = async (
  periods: AcademicPeriod[]
): Promise<AdvanceYearResult> => {
  if (!db) {
    throw new Error('Firebase Firestore non configure');
  }

  const latestAcademicYear = getLatestAcademicYear(periods);
  const { nextAcademicYear, createdPeriods } = await createNextPeriods(latestAcademicYear, periods);

  const deletedDocs: Record<AnnualCollectionName, number> = {
    messages: 0,
    homeworks: 0,
    announcements: 0,
    notifications: 0,
    events: 0,
    attendance: 0,
    courseGrades: 0,
    teacherComments: 0,
  };

  deletedDocs.messages = await deleteCollectionDocs('messages');
  await deleteHomeworkSubmissions();
  deletedDocs.homeworks = await deleteCollectionDocs('homeworks');
  deletedDocs.announcements = await deleteCollectionDocs('announcements');
  deletedDocs.notifications = await deleteCollectionDocs('notifications');
  deletedDocs.events = await deleteCollectionDocs('events');
  deletedDocs.attendance = await deleteCollectionDocs('attendance');
  deletedDocs.courseGrades = await deleteCollectionDocs('courseGrades');
  deletedDocs.teacherComments = await deleteCollectionDocs('teacherComments');

  const deletedStorageFiles =
    (await deleteStorageFolder('homework')) +
    (await deleteStorageFolder('messages')) +
    (await deleteStorageFolder('events'));

  return {
    nextAcademicYear,
    deletedDocs,
    deletedStorageFiles,
    createdPeriods,
  };
};
