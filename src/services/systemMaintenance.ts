import { addDoc, collection, collectionGroup, deleteDoc, getDocs } from 'firebase/firestore';
import { deleteObject, listAll, ref } from 'firebase/storage';
import type { AcademicPeriod } from '../types/bulletin';
import { db, storage } from '../config/db';

interface YearAdvanceResult {
  nextAcademicYear: string;
  createdPeriods: number;
  deletedDocs: Record<string, number>;
  deletedStorageFiles: number;
}

const YEAR_TRANSITION_COLLECTIONS = [
  'messages',
  'homeworks',
  'announcements',
  'notifications',
  'events',
  'attendance',
  'courseGrades',
  'teacherComments',
] as const;

const STORAGE_ROOTS = ['documents', 'events', 'homework', 'messages', 'profiles', 'users'] as const;

const shiftIsoDateByYears = (isoDate: string | undefined, years: number): string | undefined => {
  if (!isoDate) return undefined;

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return undefined;

  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().slice(0, 10);
};

const parseAcademicYear = (academicYear: string): { startYear: number; endYear: number } | null => {
  const match = academicYear.match(/^(\d{4})-(\d{4})$/);
  if (!match) return null;

  return {
    startYear: Number(match[1]),
    endYear: Number(match[2]),
  };
};

const getLatestAcademicYear = (periods: AcademicPeriod[]): string => {
  const years = periods
    .map((period) => period.academicYear)
    .filter((value, index, array) => array.indexOf(value) === index)
    .sort((a, b) => {
      const parsedA = parseAcademicYear(a);
      const parsedB = parseAcademicYear(b);
      return (parsedB?.startYear ?? 0) - (parsedA?.startYear ?? 0);
    });

  if (years.length === 0) {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${currentYear + 1}`;
  }

  return years[0];
};

const buildNextAcademicYear = (academicYear: string): string => {
  const parsed = parseAcademicYear(academicYear);
  if (!parsed) {
    const currentYear = new Date().getFullYear();
    return `${currentYear + 1}-${currentYear + 2}`;
  }

  return `${parsed.startYear + 1}-${parsed.endYear + 1}`;
};

const deleteCollectionDocs = async (collectionName: string): Promise<number> => {
  if (!db) return 0;

  const snapshot = await getDocs(collection(db, collectionName));
  await Promise.all(snapshot.docs.map((document) => deleteDoc(document.ref)));
  return snapshot.size;
};

const deleteCollectionGroupDocs = async (collectionName: string): Promise<number> => {
  if (!db) return 0;

  const snapshot = await getDocs(collectionGroup(db, collectionName));
  await Promise.all(snapshot.docs.map((document) => deleteDoc(document.ref)));
  return snapshot.size;
};

const deleteStorageFolderRecursively = async (folderPath: string): Promise<number> => {
  if (!storage) return 0;

  try {
    const folderRef = ref(storage, folderPath);
    const result = await listAll(folderRef);

    const nestedCounts = await Promise.all(
      result.prefixes.map((childPrefix) => deleteStorageFolderRecursively(childPrefix.fullPath))
    );

    await Promise.all(result.items.map((item) => deleteObject(item)));

    return result.items.length + nestedCounts.reduce((sum, count) => sum + count, 0);
  } catch {
    return 0;
  }
};

export const advanceToNextAcademicYear = async (
  academicPeriods: AcademicPeriod[]
): Promise<YearAdvanceResult> => {
  if (!db) throw new Error('Firebase not configured');

  const latestAcademicYear = getLatestAcademicYear(academicPeriods);
  const nextAcademicYear = buildNextAcademicYear(latestAcademicYear);

  const sourcePeriods = academicPeriods
    .filter((period) => period.academicYear === latestAcademicYear)
    .sort((a, b) => a.order - b.order);

  if (sourcePeriods.length === 0) {
    throw new Error('Aucune periode source trouvee pour generer l annee suivante.');
  }

  const existingNextYearPeriods = academicPeriods.filter(
    (period) => period.academicYear === nextAcademicYear
  );

  if (existingNextYearPeriods.length > 0) {
    throw new Error(`L annee ${nextAcademicYear} existe deja.`);
  }

  for (const period of sourcePeriods) {
    const periodData: Omit<AcademicPeriod, 'id'> = {
      name: period.name,
      academicYear: period.academicYear,
      startDate: period.startDate,
      endDate: period.endDate,
      gradeEntryStartDate: period.gradeEntryStartDate,
      gradeEntryEndDate: period.gradeEntryEndDate,
      bulletinPublishDate: period.bulletinPublishDate,
      isPublished: period.isPublished,
      order: period.order,
    };
    await addDoc(collection(db, 'academicPeriods'), {
      ...periodData,
      academicYear: nextAcademicYear,
      startDate: shiftIsoDateByYears(period.startDate, 1),
      endDate: shiftIsoDateByYears(period.endDate, 1),
      gradeEntryStartDate: shiftIsoDateByYears(period.gradeEntryStartDate, 1),
      gradeEntryEndDate: shiftIsoDateByYears(period.gradeEntryEndDate, 1),
      bulletinPublishDate: shiftIsoDateByYears(period.bulletinPublishDate, 1),
      isPublished: false,
    });
  }

  const deletedDocs: Record<string, number> = {};
  for (const collectionName of YEAR_TRANSITION_COLLECTIONS) {
    deletedDocs[collectionName] = await deleteCollectionDocs(collectionName);
  }
  deletedDocs.submissions = await deleteCollectionGroupDocs('submissions');

  let deletedStorageFiles = 0;
  for (const root of STORAGE_ROOTS) {
    deletedStorageFiles += await deleteStorageFolderRecursively(root);
  }

  return {
    nextAcademicYear,
    createdPeriods: sourcePeriods.length,
    deletedDocs,
    deletedStorageFiles,
  };
};
