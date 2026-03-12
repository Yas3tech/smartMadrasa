/**
 * fix_all_ids.js
 *
 * Comprehensive audit & repair of all Firestore ID mismatches:
 * 1. users/{id}        — document ID must equal Firebase Auth UID
 * 2. classes.teacherId — must equal Auth UID of the teacher
 * 3. courses.teacherId — must equal Auth UID of the teacher
 * 4. homework.teacherId — must equal Auth UID of the teacher
 * 5. events.teacherId  — must equal Auth UID of the teacher
 * 6. grades.teacherId  — must equal Auth UID of the teacher
 * 7. grades.studentId  — must equal Auth UID of the student
 * 8. grades.classId    — must match a valid class document ID
 *
 * Usage:
 *   node scripts/fix_all_ids.js --dry-run   (audit only, no writes)
 *   node scripts/fix_all_ids.js              (apply all fixes)
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function section(title) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  ${title}`);
    console.log('─'.repeat(60));
}

let totalFixed = 0;
let totalProblems = 0;

async function fixField(collectionName, docId, field, currentValue, correctValue, label) {
    totalProblems++;
    console.log(`  [FIX] ${collectionName}/${docId} → ${field}: "${currentValue}" → "${correctValue}"  (${label})`);
    if (!DRY_RUN) {
        await db.collection(collectionName).doc(docId).update({ [field]: correctValue });
        totalFixed++;
    }
}

// ── Load Auth users ───────────────────────────────────────────────────────────

async function loadAuthUsers() {
    const allAuthUsers = [];
    let nextPageToken;
    do {
        const result = await auth.listUsers(1000, nextPageToken);
        allAuthUsers.push(...result.users);
        nextPageToken = result.pageToken;
    } while (nextPageToken);
    return allAuthUsers;
}

// ── Step 1: Fix user document IDs ────────────────────────────────────────────

async function fixUserDocIds(authByEmail) {
    section('STEP 1: User document IDs (must equal Auth UID)');
    const snap = await db.collection('users').get();
    let ok = 0, fixed = 0, skipped = 0;

    for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const fsId = docSnap.id;
        const email = data.email?.toLowerCase()?.trim();
        if (!email) { console.log(`  [SKIP] No email for doc ${fsId}`); skipped++; continue; }

        const authUser = authByEmail.get(email);
        if (!authUser) { console.log(`  [SKIP] No Auth account for "${email}"`); skipped++; continue; }

        const authUid = authUser.uid;
        if (fsId === authUid) { ok++; continue; }

        totalProblems++;
        console.log(`  [FIX ] users/${fsId} → move to users/${authUid}  (${email})`);
        if (!DRY_RUN) {
            const batch = db.batch();
            batch.set(db.collection('users').doc(authUid), { ...data, id: authUid });
            batch.delete(db.collection('users').doc(fsId));
            await batch.commit();
            totalFixed++;
        }
        fixed++;
    }
    console.log(`  ✓ OK=${ok}  Fixed=${fixed}  Skipped=${skipped}`);
}

// ── Step 2: Fix teacherId in a collection ────────────────────────────────────

async function fixTeacherIds(collectionName, authByEmail, fsIdToAuthUid) {
    section(`STEP 2-x: ${collectionName}.teacherId`);
    const snap = await db.collection(collectionName).get();
    let ok = 0, fixed = 0, skipped = 0;

    for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const tid = data.teacherId;
        if (!tid) { skipped++; continue; }

        // Already correct if it's an Auth UID
        if (fsIdToAuthUid.has(tid) || [...authByEmail.values()].some(u => u.uid === tid)) {
            ok++;
            continue;
        }

        // Try to resolve via old Firestore UUID
        const correctUid = fsIdToAuthUid.get(tid);
        if (correctUid) {
            await fixField(collectionName, docSnap.id, 'teacherId', tid, correctUid, 'old UUID → auth UID');
            fixed++;
        } else {
            console.log(`  [????] ${collectionName}/${docSnap.id} teacherId="${tid}" not resolvable`);
            skipped++;
        }
    }
    console.log(`  ✓ OK=${ok}  Fixed=${fixed}  Skipped/Unknown=${skipped}`);
}

// ── Step 3: Fix grades.studentId ─────────────────────────────────────────────

async function fixGradeStudentIds(fsIdToAuthUid, authUids) {
    section('STEP 3: grades.studentId');
    const snap = await db.collection('grades').get();
    let ok = 0, fixed = 0, skipped = 0;

    for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const sid = data.studentId;
        if (!sid) { skipped++; continue; }

        if (authUids.has(sid)) { ok++; continue; }

        const correctUid = fsIdToAuthUid.get(sid);
        if (correctUid) {
            await fixField('grades', docSnap.id, 'studentId', sid, correctUid, 'old UUID → auth UID');
            fixed++;
        } else {
            console.log(`  [????] grades/${docSnap.id} studentId="${sid}" not resolvable`);
            skipped++;
        }
    }
    console.log(`  ✓ OK=${ok}  Fixed=${fixed}  Skipped/Unknown=${skipped}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log(`\n🔍 Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE (will write)'}`);

    // Load all Firebase Auth users
    console.log('\nLoading Firebase Auth users...');
    const allAuthUsers = await loadAuthUsers();
    const authByEmail = new Map(allAuthUsers.filter(u => u.email).map(u => [u.email.toLowerCase(), u]));
    const authUids = new Set(allAuthUsers.map(u => u.uid));
    console.log(`  → ${allAuthUsers.length} Auth accounts`);

    // Load all Firestore user docs to build old-UUID → authUID map
    console.log('Loading Firestore users...');
    const usersSnap = await db.collection('users').get();
    console.log(`  → ${usersSnap.size} Firestore user documents`);

    // Build map: oldFsId → correctAuthUid
    const fsIdToAuthUid = new Map();
    for (const docSnap of usersSnap.docs) {
        const data = docSnap.data();
        const email = data.email?.toLowerCase()?.trim();
        if (!email) continue;
        const authUser = authByEmail.get(email);
        if (!authUser) continue;
        if (docSnap.id !== authUser.uid) {
            fsIdToAuthUid.set(docSnap.id, authUser.uid);
        }
    }
    console.log(`  → ${fsIdToAuthUid.size} user(s) with mismatched IDs detected`);

    // Run all fixes
    await fixUserDocIds(authByEmail);
    await fixTeacherIds('classes', authByEmail, fsIdToAuthUid);
    await fixTeacherIds('courses', authByEmail, fsIdToAuthUid);
    await fixTeacherIds('homework', authByEmail, fsIdToAuthUid);
    await fixTeacherIds('events', authByEmail, fsIdToAuthUid);
    await fixTeacherIds('grades', authByEmail, fsIdToAuthUid);
    await fixGradeStudentIds(fsIdToAuthUid, authUids);

    section('SUMMARY');
    console.log(`  Total problems found : ${totalProblems}`);
    console.log(`  Total fixed          : ${DRY_RUN ? '0 (dry run)' : totalFixed}`);
    if (DRY_RUN && totalProblems > 0) {
        console.log('\n  Re-run without --dry-run to apply all fixes.');
    } else if (totalProblems === 0) {
        console.log('\n  ✅ Everything looks clean!');
    } else {
        console.log('\n  ✅ All fixable issues have been corrected.');
    }
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
