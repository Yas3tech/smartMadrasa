import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Cloud Function déclenchée par Firestore.
 * Quand un document /users/{userId} est créé ou modifié,
 * on copie le champ 'role' dans les Custom Claims du token Auth.
 *
 * Cela permet d'utiliser `request.auth.token.role` dans les
 * Firestore/Storage rules au lieu de lire le document user.
 */
export const syncRoleToClaims = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;

    // Si le document est supprimé, supprimer les claims
    if (!change.after.exists) {
      try {
        await admin.auth().setCustomUserClaims(userId, {});
        functions.logger.info(`Claims cleared for deleted user ${userId}`);
      } catch (err) {
        // L'utilisateur Auth peut ne pas exister (supprimé avant le doc)
        functions.logger.warn(`Could not clear claims for ${userId}:`, err);
      }
      return;
    }

    const userData = change.after.data();
    if (!userData?.role) {
      functions.logger.warn(`No role found for user ${userId}, skipping`);
      return;
    }

    const role = userData.role as string;
    const validRoles = ['student', 'teacher', 'parent', 'director', 'superadmin'];

    if (!validRoles.includes(role)) {
      functions.logger.error(`Invalid role "${role}" for user ${userId}`);
      return;
    }

    // Vérifier si le claim a changé (évite les écritures inutiles)
    try {
      const userRecord = await admin.auth().getUser(userId);
      const currentRole = userRecord.customClaims?.role;

      if (currentRole === role) {
        functions.logger.info(`Role unchanged for ${userId} (${role}), skipping`);
        return;
      }

      await admin.auth().setCustomUserClaims(userId, { role });
      functions.logger.info(`✅ Custom claim set: ${userId} → role: ${role}`);
    } catch (err) {
      functions.logger.error(`Failed to set claims for ${userId}:`, err);
    }
  });

/**
 * Cloud Function HTTPS Callable
 * Deletes all authentication accounts. Requires superadmin role.
 */
export const wipeAllAuthUsers = functions.https.onCall(async (data, context) => {
  // 1. Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to wipe the database.'
    );
  }

  // 2. Check authorization (superadmin)
  // First check custom claims, fallback to Firestore if needed
  let isSuperAdmin = context.auth.token.role === 'superadmin';

  // If claim is not present, check Firestore as fallback (for newly created superadmins)
  if (!isSuperAdmin) {
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    if (userDoc.exists && userDoc.data()?.role === 'superadmin') {
      isSuperAdmin = true;
    }
  }

  if (!isSuperAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only superadmins can wipe the authentication database.'
    );
  }

  try {
    let nextPageToken;
    let deletedCount = 0;
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      const uids = listUsersResult.users.map((userRecord) => userRecord.uid);

      if (uids.length > 0) {
        // Delete in batches to avoid timeout/limits
        const deleteResult = await admin.auth().deleteUsers(uids);
        deletedCount += deleteResult.successCount;
        if (deleteResult.failureCount > 0) {
          functions.logger.warn(`Failed to delete ${deleteResult.failureCount} users`);
        }
      }
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    functions.logger.info(`Successfully wiped ${deletedCount} authentication accounts.`);
    return { success: true, count: deletedCount };
  } catch (error: unknown) {
    functions.logger.error('Error wiping auth users:', error);
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while wiping authentication accounts.',
      (error as Error).message
    );
  }
});
