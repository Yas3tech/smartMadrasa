import { db, storage } from '../config/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    writeBatch
} from 'firebase/firestore';
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
 * Supprime tous les documents d'une collection où un champ correspond à une valeur
 */
async function deleteDocumentsWhere(
    collectionName: string,
    field: string,
    value: string
): Promise<number> {
    if (!db) return 0;
    const q = query(collection(db, collectionName), where(field, '==', value));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return 0;

    const batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
        count++;
    });

    await batch.commit();
    return count;
}

/**
 * Supprime un document par son ID
 */
async function deleteDocumentById(collectionName: string, docId: string): Promise<boolean> {
    if (!db) return false;
    try {
        await deleteDoc(doc(db, collectionName, docId));
        return true;
    } catch {
        return false;
    }
}

/**
 * Supprime tous les fichiers d'un dossier Storage
 */
async function deleteStorageFolder(folderPath: string): Promise<number> {
    if (!storage) return 0;
    try {
        const folderRef = ref(storage, folderPath);
        const listResult = await listAll(folderRef);

        let count = 0;
        for (const itemRef of listResult.items) {
            await deleteObject(itemRef);
            count++;
        }

        // Récursion pour les sous-dossiers
        for (const prefixRef of listResult.prefixes) {
            count += await deleteStorageFolder(prefixRef.fullPath);
        }

        return count;
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
        errors: []
    };

    try {
        // 1. Supprimer le document utilisateur principal
        if (await deleteDocumentById('users', userId)) {
            result.deletedCounts.users = 1;
        }

        // 2. Supprimer les données spécifiques au rôle
        switch (userRole) {
            case 'student':
                // Supprimer le profil étudiant
                if (await deleteDocumentById('students', userId)) {
                    result.deletedCounts.students = 1;
                }
                // Supprimer les notes de l'étudiant
                result.deletedCounts.grades = await deleteDocumentsWhere('grades', 'studentId', userId);
                // Supprimer les présences
                result.deletedCounts.attendance = await deleteDocumentsWhere('attendance', 'studentId', userId);
                // Supprimer les soumissions de devoirs
                result.deletedCounts.homeworkSubmissions = await deleteDocumentsWhere('homeworkSubmissions', 'studentId', userId);
                // Supprimer les commentaires enseignants sur cet étudiant
                result.deletedCounts.teacherComments = await deleteDocumentsWhere('teacherComments', 'studentId', userId);
                break;

            case 'parent':
                // Supprimer le profil parent
                if (await deleteDocumentById('parents', userId)) {
                    result.deletedCounts.parents = 1;
                }
                break;

            case 'teacher':
                // Supprimer le profil enseignant
                if (await deleteDocumentById('teachers', userId)) {
                    result.deletedCounts.teachers = 1;
                }
                // Supprimer les devoirs créés par l'enseignant (optionnel - peut-être garder)
                result.deletedCounts.homework = await deleteDocumentsWhere('homework', 'teacherId', userId);
                // Supprimer les commentaires de l'enseignant
                result.deletedCounts.teacherComments += await deleteDocumentsWhere('teacherComments', 'teacherId', userId);
                break;

            case 'director':
            case 'superadmin':
                // Pour les admins, ne supprimer que le profil
                break;
        }

        // 3. Supprimer les messages (envoyés et reçus)
        const sentMessages = await deleteDocumentsWhere('messages', 'senderId', userId);
        const receivedMessages = await deleteDocumentsWhere('messages', 'recipientId', userId);
        result.deletedCounts.messages = sentMessages + receivedMessages;

        // 4. Supprimer les notifications
        result.deletedCounts.notifications = await deleteDocumentsWhere('notifications', 'userId', userId);

        // 5. Supprimer les fichiers Storage
        result.deletedCounts.storageFiles = await deleteStorageFolder(`users/${userId}`);
        result.deletedCounts.storageFiles += await deleteStorageFolder(`homework/${userId}`);

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
export async function deleteUserFirestoreData(userId: string, userRole: string): Promise<DeleteUserDataResult> {
    return deleteAllUserData(userId, userRole);
}

/**
 * Génère un rapport de ce qui sera supprimé (sans supprimer)
 * Utile pour confirmer avec l'utilisateur avant suppression
 */
export async function previewUserDataDeletion(userId: string, userRole: string): Promise<{
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
        storageSize: 'Non calculé' // Le calcul de la taille storage est coûteux
    };
}
