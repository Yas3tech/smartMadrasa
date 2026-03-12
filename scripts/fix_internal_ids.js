/**
 * fix_internal_ids.js
 *
 * Problem: Even though Firestore document IDs match Firebase Auth UIDs,
 * the `id` field INSIDE user documents may still hold an old UUID.
 * Also, the `teacherId` field in the `classes` collection might reference
 * the old UUID instead of the Auth UID.
 *
 * Fix:
 * 1. For each user doc, ensure the `id` field matches the document ID (Auth UID).
 * 2. For each class, if `teacherId` is an old UUID, update it to the Auth UID.
 *
 * Usage: node scripts/fix_internal_ids.js
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

async function fixInternalIds() {
    console.log('=== Step 1: Fix user document internal id fields ===\n');

    const usersSnapshot = await db.collection('users').get();
    // Build a map: oldUUID → { authUid, email }
    const oldIdToNewId = new Map(); // maps old UUID → new auth UID
    const emailToAuthUid = new Map(); // maps email → auth UID (doc ID)

    let userFixes = 0;
    for (const docSnap of usersSnapshot.docs) {
        const docId = docSnap.id; // This should already be the Auth UID
        const data = docSnap.data();
        const internalId = data.id;

        emailToAuthUid.set(data.email?.toLowerCase()?.trim(), docId);

        if (internalId && internalId !== docId) {
            console.log(`🔧 User "${data.email}": internal id "${internalId}" → "${docId}"`);
            oldIdToNewId.set(internalId, docId);
            await docSnap.ref.update({ id: docId });
            userFixes++;
        }
    }

    if (userFixes === 0) {
        console.log('✅ All user internal ids are already correct.');
    } else {
        console.log(`✅ Fixed ${userFixes} user internal id(s).`);
    }

    console.log('\n=== Step 2: Fix teacherId references in classes ===\n');

    const classesSnapshot = await db.collection('classes').get();
    let classFixes = 0;

    for (const classDoc of classesSnapshot.docs) {
        const data = classDoc.data();
        const oldTeacherId = data.teacherId;

        if (!oldTeacherId) continue;

        // Check if the teacherId is an old UUID that needs to be remapped
        if (oldIdToNewId.has(oldTeacherId)) {
            const newTeacherId = oldIdToNewId.get(oldTeacherId);
            console.log(`🔧 Class "${data.name}" teacherId: "${oldTeacherId}" → "${newTeacherId}"`);
            await classDoc.ref.update({ teacherId: newTeacherId });
            classFixes++;
        }
    }

    if (classFixes === 0) {
        console.log('✅ All class teacherId references are already correct.');
    } else {
        console.log(`✅ Fixed ${classFixes} class teacherId reference(s).`);
    }

    console.log('\n=== Step 3: Fix teacherId in courses ===\n');

    const classesForCourses = await db.collection('classes').get();
    let courseFixes = 0;

    for (const classDoc of classesForCourses.docs) {
        const coursesSnapshot = await classDoc.ref.collection('courses').get();
        for (const courseDoc of coursesSnapshot.docs) {
            const data = courseDoc.data();
            const oldTeacherId = data.teacherId;
            if (!oldTeacherId) continue;

            if (oldIdToNewId.has(oldTeacherId)) {
                const newTeacherId = oldIdToNewId.get(oldTeacherId);
                console.log(`🔧 Course "${data.name}" in class "${classDoc.data().name}" teacherId: "${oldTeacherId}" → "${newTeacherId}"`);
                await courseDoc.ref.update({ teacherId: newTeacherId });
                courseFixes++;
            }
        }
    }

    if (courseFixes === 0) {
        console.log('✅ All course teacherId references are already correct.');
    } else {
        console.log(`✅ Fixed ${courseFixes} course teacherId reference(s).`);
    }

    console.log('\n🎉 All done!');
    process.exit(0);
}

fixInternalIds().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
});
