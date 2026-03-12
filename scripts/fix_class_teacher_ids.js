/**
 * fix_class_teacher_ids.js
 *
 * Finds classes where teacherId is an old Firestore UUID instead of the Firebase Auth UID.
 * Repairs by looking up the teacher's Auth UID via email.
 *
 * Usage:
 *   node scripts/fix_class_teacher_ids.js --dry-run   (shows what would change)
 *   node scripts/fix_class_teacher_ids.js              (applies fixes)
 */
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = JSON.parse(
    readFileSync(path.join(__dirname, 'serviceAccountKey.json'), 'utf8')
);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const auth = admin.auth();
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
    console.log(`\n🔍 Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}\n`);

    // Load all Firestore users
    const usersSnap = await db.collection('users').get();
    const userDocs = usersSnap.docs.map((d) => ({ fsId: d.id, ...d.data() }));

    // Load all Firebase Auth users
    const allAuthUsers = [];
    let nextPageToken;
    do {
        const result = await auth.listUsers(1000, nextPageToken);
        allAuthUsers.push(...result.users);
        nextPageToken = result.pageToken;
    } while (nextPageToken);

    // Map: email → auth UID
    const emailToAuthUid = new Map(
        allAuthUsers
            .filter((u) => u.email)
            .map((u) => [u.email.toLowerCase(), u.uid])
    );

    // Map: firestoreDocId → user data
    const byFsId = new Map(userDocs.map((u) => [u.fsId, u]));

    // Also map: authUid → user data (for if teacherId is already the auth UID)
    const byAuthUid = new Map(
        userDocs
            .filter((u) => u.email && emailToAuthUid.has(u.email?.toLowerCase()))
            .map((u) => [emailToAuthUid.get(u.email.toLowerCase()), u])
    );

    // Process all classes
    const classesSnap = await db.collection('classes').get();
    let fixedCount = 0, okCount = 0, skippedCount = 0;

    for (const classDoc of classesSnap.docs) {
        const cls = classDoc.data();
        const currentTeacherId = cls.teacherId;

        if (!currentTeacherId) {
            console.log(`[SKIP] Class "${cls.name || classDoc.id}" - no teacherId`);
            skippedCount++;
            continue;
        }

        // Check if it's already an auth UID
        if (byAuthUid.has(currentTeacherId)) {
            console.log(`[OK ] Class "${cls.name}" - teacherId "${currentTeacherId}" is already the Auth UID`);
            okCount++;
            continue;
        }

        // Try to resolve via old Firestore doc
        const teacherDoc = byFsId.get(currentTeacherId);
        if (!teacherDoc || !teacherDoc.email) {
            console.log(`[????] Class "${cls.name}" - teacherId "${currentTeacherId}" not found in users`);
            skippedCount++;
            continue;
        }

        const correctUid = emailToAuthUid.get(teacherDoc.email.toLowerCase());
        if (!correctUid) {
            console.log(`[WARN] Class "${cls.name}" - teacher email "${teacherDoc.email}" has no Auth account`);
            skippedCount++;
            continue;
        }

        console.log(`[FIX] Class "${cls.name}": teacherId "${currentTeacherId}" → "${correctUid}" (${teacherDoc.email})`);
        if (!DRY_RUN) {
            await db.collection('classes').doc(classDoc.id).update({ teacherId: correctUid });
        }
        fixedCount++;
    }

    console.log(`\n📊 Summary: OK=${okCount}, Fixed=${fixedCount}, Skipped/Unknown=${skippedCount}`);
    if (DRY_RUN && fixedCount > 0) {
        console.log('Re-run without --dry-run to apply fixes.');
    }
    process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
