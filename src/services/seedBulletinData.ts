import { db, isFirebaseConfigured } from '../config/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import type { GradeCategory, AcademicPeriod } from '../types/bulletin';

/**
 * Seed default grade categories
 */
export const seedGradeCategories = async (): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    console.warn('⚠️ Firebase not configured. Skipping grade categories seed.');
    return;
  }

  try {
    // Check if categories already exist
    const categoriesRef = collection(db, 'gradeCategories');
    const snapshot = await getDocs(categoriesRef);

    if (snapshot.size > 0) {
      console.log('✅ Grade categories already seeded.');
      return;
    }

    // Default categories
    const defaultCategories: Omit<GradeCategory, 'id'>[] = [
      {
        name: 'Test',
        code: 'TEST',
        description: 'Tests réguliers sur chapitres',
        weight: 1,
        color: '#3B82F6', // Blue
      },
      {
        name: 'Examen',
        code: 'EXAM',
        description: 'Examens trimestriels/semestriels',
        weight: 2,
        color: '#EF4444', // Red
      },
      {
        name: 'Devoir',
        code: 'HW',
        description: 'Devoirs à la maison',
        weight: 0.5,
        color: '#10B981', // Green
      },
      {
        name: 'Contrôle Continu',
        code: 'CC',
        description: 'Évaluations continues',
        weight: 1,
        color: '#F59E0B', // Amber
      },
      {
        name: 'Projet',
        code: 'PROJ',
        description: 'Projets et travaux pratiques',
        weight: 1.5,
        color: '#8B5CF6', // Purple
      },
      {
        name: 'Oral',
        code: 'ORAL',
        description: 'Présentations orales',
        weight: 1,
        color: '#EC4899', // Pink
      },
      {
        name: 'Participation',
        code: 'PART',
        description: 'Participation en classe',
        weight: 0.5,
        color: '#14B8A6', // Teal
      },
    ];

    // Add categories to Firestore
    for (const category of defaultCategories) {
      await addDoc(categoriesRef, category);
    }

    console.log('✅ Successfully seeded grade categories!');
  } catch (error) {
    console.error('❌ Error seeding grade categories:', error);
    throw error;
  }
};

/**
 * Seed a default academic year with periods
 */
export const seedDefaultAcademicYear = async (): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    console.warn('⚠️ Firebase not configured. Skipping academic year seed.');
    return;
  }

  try {
    // Check if periods already exist
    const periodsRef = collection(db, 'academicPeriods');
    const snapshot = await getDocs(periodsRef);

    if (snapshot.size > 0) {
      console.log('✅ Academic periods already seeded.');
      return;
    }

    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;

    // Default periods (3 trimestres)
    const defaultPeriods: Omit<AcademicPeriod, 'id'>[] = [
      {
        name: 'Trimestre 1',
        academicYear,
        startDate: `${currentYear}-09-01`,
        endDate: `${currentYear}-12-15`,
        gradeEntryStartDate: `${currentYear}-09-01`,
        gradeEntryEndDate: `${currentYear}-12-10`,
        bulletinPublishDate: `${currentYear}-12-20`,
        isPublished: false,
        order: 1,
      },
      {
        name: 'Trimestre 2',
        academicYear,
        startDate: `${currentYear + 1}-01-05`,
        endDate: `${currentYear + 1}-03-30`,
        gradeEntryStartDate: `${currentYear + 1}-01-05`,
        gradeEntryEndDate: `${currentYear + 1}-03-25`,
        bulletinPublishDate: `${currentYear + 1}-04-05`,
        isPublished: false,
        order: 2,
      },
      {
        name: 'Trimestre 3',
        academicYear,
        startDate: `${currentYear + 1}-04-15`,
        endDate: `${currentYear + 1}-06-30`,
        gradeEntryStartDate: `${currentYear + 1}-04-15`,
        gradeEntryEndDate: `${currentYear + 1}-06-25`,
        bulletinPublishDate: `${currentYear + 1}-07-05`,
        isPublished: false,
        order: 3,
      },
    ];

    // Add periods to Firestore
    for (const period of defaultPeriods) {
      await addDoc(periodsRef, period);
    }

    console.log('✅ Successfully seeded academic periods!');
  } catch (error) {
    console.error('❌ Error seeding academic periods:', error);
    throw error;
  }
};

/**
 * Seed all bulletin system data
 */
export const seedBulletinSystem = async (): Promise<void> => {
  console.log('🌱 Starting bulletin system seed...');

  try {
    await seedGradeCategories();
    await seedDefaultAcademicYear();

    console.log('✅ Bulletin system seed completed successfully!');
  } catch (error) {
    console.error('❌ Bulletin system seed failed:', error);
    throw error;
  }
};

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).seedBulletinSystem = seedBulletinSystem;
  (window as any).seedGradeCategories = seedGradeCategories;
  (window as any).seedDefaultAcademicYear = seedDefaultAcademicYear;
}
