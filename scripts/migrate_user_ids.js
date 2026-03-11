/**
 * migrate_user_ids.js
 *
 * Problem: Users created manually had their Firestore document ID set to a random UUID
 * instead of their Firebase Auth UID. This breaks Firestore security rules because 
 * getUserData() looks up users/{request.auth.uid} which doesn't exist.
 *
 * Fix: For each user in Firestore, find their matching Firebase Auth account (by email),
 * then copy the document to users/{authUid} and delete the old document.
 *
 * Usage: node scripts/migrate_user_ids.js
 *        (or run: node --experimental-vm-modules scripts/migrate_user_ids.js)
 */
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountParams = JSON.parse(
    readFileSync(path.join(__dirname, 'serviceAccountKey.json'), 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountParams),
});

const db = admin.firestore();

async function migrateUserIds() {
    console.log('🔍 Fetching all users from Firestore...');
    const snapshot = await db.collection('users').get();
    const firestoreDocs = snapshot.docs;

    console.log(`📋 Found ${firestoreDocs.length} user documents.`);

    // Load all Firebase Auth users for lookup by email
    console.log('🔑 Fetching Firebase Auth users...');
    const allAuthUsers = [];
    let nextPageToken;
    do {
        const listResult = await admin.auth().listUsers(1000, nextPageToken);
        allAuthUsers.push(...listResult.users);
        nextPageToken = listResult.pageToken;
    } while (nextPageToken);

    const authByEmail = new Map(
        allAuthUsers.map((u) => [u.email?.toLowerCase() ?? '', u])
    );
    console.log(`🔑 Found ${allAuthUsers.length} Firebase Auth accounts.`);

    let fixed = 0;
    let skipped = 0;
    let errors = 0;

    for (const docSnap of firestoreDocs) {
        const data = docSnap.data();
        const firestoreId = docSnap.id;
        const email = data.email?.toLowerCase()?.trim();

        if (!email) {
            console.warn(`⚠️  Doc ${firestoreId} has no email, skipping.`);
            skipped++;
            continue;
        }

        const authUser = authByEmail.get(email);
        if (!authUser) {
            console.warn(`⚠️  No Auth account found for email "${email}" (doc: ${firestoreId}), skipping.`);
            skipped++;
            continue;
        }

        const authUid = authUser.uid;

        if (firestoreId === authUid) {
            // Already correct
            skipped++;
            continue;
        }

        console.log(`🔧 Migrating user "${email}": ${firestoreId} → ${authUid}`);

        try {
            const batch = db.batch();
            // Copy document to the correct UID-based ID
            const newDocRef = db.collection('users').doc(authUid);
            batch.set(newDocRef, { ...data, id: authUid });
            // Delete the old document
            batch.delete(db.collection('users').doc(firestoreId));
            await batch.commit();

            console.log(`   ✅ Done.`);
            fixed++;
        } catch (e) {
            console.error(`   ❌ Failed for ${email}:`, e.message);
            errors++;
        }
    }

    console.log('\n📊 Migration summary:');
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ⏭️  Skipped (already correct or no auth): ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);

    if (errors > 0) {
        console.log('\n⚠️  Some users could not be migrated. Please review the errors above.');
        process.exit(1);
    } else {
        console.log('\n🎉 Migration complete!');
        process.exit(0);
    }
}

migrateUserIds().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
});
