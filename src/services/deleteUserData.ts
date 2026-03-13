import { db, storage } from '../config/db';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { deleteUser, type User } from 'firebase/auth';

/**
 * Service pour supprimer toutes les données d'un utilisateur
 * Conforme au RGPD - Droit à l'effacement
 */

interface DeleteUserDataResult {
  success: boolean;
  deletedCounts: {
    users: number;
    students: number;
    parents: number;
    teachers: number;
    grades: number;
    attendance: number;
    homework: number;
    homeworkSubmissions: number;
    messages: number;
    notifications: number;
    teacherComments: number;
    storageFiles: number;
  };
  errors: string[];
}

/**
 * Recueille les références des documents où un champ correspond à une valeur
 */
async function getDocumentRefsWhere(
  collectionName: string,
  field: string,
  value: string
): Promise<any[]> {
  if (!db) return [];
  const q = query(collection(db, collectionName), where(field, '==', value));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.ref);
}

/**
 * Exécute une série d'opérations en lots (batches) de 500 maximum (limite Firestore)
 */
async function executeBatchOperations(
  deletes: any[],
  updates: { ref: any; data: any }[] = []
): Promise<void> {
  if (!db) return;
  const CHUNK_SIZE = 500;

  // Combine all operations
  const operations = [
    ...deletes.map((ref) => ({ type: 'delete' as const, ref })),
    ...updates.map((u) => ({ type: 'update' as const, ref: u.ref, data: u.data })),
  ];

  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const chunk = operations.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    chunk.forEach((op) => {
      if (op.type === 'delete') {
        batch.delete(op.ref);
      } else {
        batch.update(op.ref, op.data);
      }
    });

    await batch.commit();
  }
}

/**
 * Supprime un document par son ID (renvoie l'objet ref au lieu de supprimer)
 */
function getDocumentRefById(collectionName: string, docId: string): any | null {
  if (!db) return null;
  return doc(db, collectionName, docId);
}

/**
 * Supprime tous les fichiers d'un dossier Storage (Inchangé car Storage est séparé de Firestore)
 */
async function deleteStorageFolder(folderPath: string): Promise<number> {
  if (!storage) return 0;
  try {
    const folderRef = ref(storage, folderPath);
    const listResult = await listAll(folderRef);

    // PERFORMANCE: Delete files in parallel instead of sequentially
    await Promise.all(listResult.items.map((itemRef) => deleteObject(itemRef)));
    let count = listResult.items.length;

    // Recursion for subfolders (also in parallel)
    const subCounts = await Promise.all(
      listResult.prefixes.map((prefixRef) => deleteStorageFolder(prefixRef.fullPath))
    );
    count += subCounts.reduce((sum, c) => sum + c, 0);

    return count;
  } catch {
    return 0;
  }
}

/**
 * Deletes all homework submission files for a specific student.
 * Storage layout: homework/{homeworkId}/{studentId}/{fileName}
 */
async function deleteStudentHomeworkFiles(studentId: string): Promise<number> {
  if (!storage) return 0;

  try {
    const homeworkRootRef = ref(storage, 'homework');
    const homeworkRoot = await listAll(homeworkRootRef);
    let deletedCount = 0;

    for (const homeworkFolder of homeworkRoot.prefixes) {
      const perHomework = await listAll(homeworkFolder);
      for (const studentFolder of perHomework.prefixes) {
        const segments = studentFolder.fullPath.split('/');
        const folderStudentId = segments[segments.length - 1];
        if (folderStudentId === studentId) {
          deletedCount += await deleteStorageFolder(studentFolder.fullPath);
        }
      }
    }

    return deletedCount;
  } catch {
    return 0;
  }
}

/**
 * Supprime toutes les données associées à un utilisateur
 * @param userId - L'ID Firebase de l'utilisateur
 * @param userRole - Le rôle de l'utilisateur (student, parent, teacher, director, superadmin)
 * @param authUser - L'objet User Firebase Auth (optionnel, pour supprimer le compte auth)
 */
export async function deleteAllUserData(
  userId: string,
  userRole: string,
  authUser?: User
): Promise<DeleteUserDataResult> {
  const result: DeleteUserDataResult = {
    success: false,
    deletedCounts: {
      users: 0,
      students: 0,
      parents: 0,
      teachers: 0,
      grades: 0,
      attendance: 0,
      homework: 0,
      homeworkSubmissions: 0,
      messages: 0,
      notifications: 0,
      teacherComments: 0,
      storageFiles: 0,
    },
    errors: [],
  };

  try {
    const refsToDelete: any[] = [];
    const refsToUpdate: { ref: any; data: any }[] = [];

    // Phase 1: Collect all references (Reads) to ensure atomic-like failure model
    // --------------------------------------------------------------------------

    // 1. Utilisateur principal
    const userRef = getDocumentRefById('users', userId);
    if (userRef) {
      refsToDelete.push(userRef);
      result.deletedCounts.users = 1;
    }

    // 2. Données spécifiques au rôle
    switch (userRole) {
      case 'student': {
        const studentRef = getDocumentRefById('students', userId);
        if (studentRef) {
          refsToDelete.push(studentRef);
          result.deletedCounts.students = 1;
        }

        const grades = await getDocumentRefsWhere('grades', 'studentId', userId);
        refsToDelete.push(...grades);
        result.deletedCounts.grades = grades.length;

        const attendance = await getDocumentRefsWhere('attendance', 'studentId', userId);
        refsToDelete.push(...attendance);
        result.deletedCounts.attendance = attendance.length;

        const submissions = await getDocumentRefsWhere('homeworkSubmissions', 'studentId', userId);
        refsToDelete.push(...submissions);
        result.deletedCounts.homeworkSubmissions = submissions.length;

        const comments = await getDocumentRefsWhere('teacherComments', 'studentId', userId);
        refsToDelete.push(...comments);
        result.deletedCounts.teacherComments = comments.length;
        break;
      }
      case 'parent': {
        const parentRef = getDocumentRefById('parents', userId);
        if (parentRef) {
          refsToDelete.push(parentRef);
          result.deletedCounts.parents = 1;
        }
        break;
      }
      case 'teacher': {
        const teacherRef = getDocumentRefById('teachers', userId);
        if (teacherRef) {
          refsToDelete.push(teacherRef);
          result.deletedCounts.teachers = 1;
        }

        const homeworks = await getDocumentRefsWhere('homeworks', 'teacherId', userId);
        refsToDelete.push(...homeworks);
        result.deletedCounts.homework = homeworks.length;

        const comments = await getDocumentRefsWhere('teacherComments', 'teacherId', userId);
        refsToDelete.push(...comments);
        result.deletedCounts.teacherComments = comments.length;

        // WARN-05/LOGIC-06: Handle orphaned courseGrades
        // Using 'deleted_teacher' instead of empty string maintains a valid key format,
        // and provides a clear signal to the frontend to render the 'Utilisateur Supprimé' state.
        const courseGrades = await getDocumentRefsWhere('courseGrades', 'teacherId', userId);
        courseGrades.forEach((ref) =>
          refsToUpdate.push({
            ref,
            data: { teacherId: 'deleted_teacher', teacherName: 'Utilisateur Supprimé' },
          })
        );
        result.deletedCounts.grades += courseGrades.length;

        // WARN-05: Handle orphaned courses
        const courses = await getDocumentRefsWhere('courses', 'teacherId', userId);
        refsToDelete.push(...courses);

        // WARN-05: Handle orphaned classes (reset teacherId instead of deleting class)
        const classes = await getDocumentRefsWhere('classes', 'teacherId', userId);
        classes.forEach((classRef) => {
          refsToUpdate.push({
            ref: classRef,
            data: { teacherId: 'deleted_teacher', teacherName: '' },
          });
        });
        break;
      }
      case 'director':
      case 'superadmin':
        break;
    }

    // 3. Messages (envoyés et reçus)
    const sentMessages = await getDocumentRefsWhere('messages', 'senderId', userId);
    const receivedMessages = await getDocumentRefsWhere('messages', 'receiverId', userId);
    refsToDelete.push(...sentMessages, ...receivedMessages);
    result.deletedCounts.messages = sentMessages.length + receivedMessages.length;

    // 4. Notifications
    const notifications = await getDocumentRefsWhere('notifications', 'userId', userId);
    refsToDelete.push(...notifications);
    result.deletedCounts.notifications = notifications.length;

    // Phase 2: Execute all Firestore writes in batches (limit 500 per batch)
    // ----------------------------------------------------------------------
    await executeBatchOperations(refsToDelete, refsToUpdate);

    // Phase 3: External systems (Storage & Auth) which cannot be batched with Firestore
    // ---------------------------------------------------------------------------------

    // 5. Supprimer les fichiers Storage
    result.deletedCounts.storageFiles = await deleteStorageFolder(`users/${userId}`);
    result.deletedCounts.storageFiles += await deleteStorageFolder(`profiles/${userId}`);
    if (userRole === 'student') {
      result.deletedCounts.storageFiles += await deleteStudentHomeworkFiles(userId);
    }

    // 6. Supprimer le compte Firebase Auth (si fourni)
    if (authUser) {
      try {
        await deleteUser(authUser);
      } catch (error) {
        result.errors.push(`Erreur suppression compte auth: ${error}`);
      }
    }

    result.success = true;
  } catch (error) {
    result.errors.push(`Erreur générale: ${error}`);
  }

  return result;
}

/**
 * Supprime uniquement les données Firestore sans toucher au compte Auth
 * Utile pour nettoyer les données avant de réassigner un utilisateur
 */
export async function deleteUserFirestoreData(
  userId: string,
  userRole: string
): Promise<DeleteUserDataResult> {
  return deleteAllUserData(userId, userRole);
}

/**
 * Génère un rapport de ce qui sera supprimé (sans supprimer)
 * Utile pour confirmer avec l'utilisateur avant suppression
 */
export async function previewUserDataDeletion(
  userId: string,
  userRole: string
): Promise<{
  collections: { name: string; count: number }[];
  storageSize: string;
}> {
  const collections: { name: string; count: number }[] = [];

  if (!db) {
    return { collections, storageSize: 'Non disponible' };
  }

  // Vérifier chaque collection
  const collectionsToCheck = [
    { name: 'users', field: null },
    { name: 'students', field: null },
    { name: 'parents', field: null },
    { name: 'teachers', field: null },
    { name: 'grades', field: 'studentId' },
    { name: 'attendance', field: 'studentId' },
    { name: 'homeworkSubmissions', field: 'studentId' },
    { name: 'messages', field: 'senderId' },
    { name: 'notifications', field: 'userId' },
    { name: 'teacherComments', field: userRole === 'teacher' ? 'teacherId' : 'studentId' },
  ];

  for (const col of collectionsToCheck) {
    try {
      if (col.field) {
        const q = query(collection(db, col.name), where(col.field, '==', userId));
        const snapshot = await getDocs(q);
        if (snapshot.size > 0) {
          collections.push({ name: col.name, count: snapshot.size });
        }
      } else {
        // Vérifier si le document existe
        const q = query(collection(db, col.name), where('__name__', '==', userId));
        const snapshot = await getDocs(q);
        if (snapshot.size > 0) {
          collections.push({ name: col.name, count: 1 });
        }
      }
    } catch {
      // Collection n'existe pas ou erreur
    }
  }

  return {
    collections,
    storageSize: 'Non calculé', // Le calcul de la taille storage est coûteux
  };
}
