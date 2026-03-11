/**
 * check_courses.js
 * Lists all courses and their teacherId so we can verify if they need fixing.
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

admin.initializeApp({ credential: admin.credential.cert(serviceAccountParams) });
const db = admin.firestore();

async function checkCourses() {
    // Load all users to build a map of email → authUid
    const usersSnap = await db.collection('users').get();
    console.log('\n=== Users ===');
    const uidByEmail = new Map();
    for (const doc of usersSnap.docs) {
        const d = doc.data();
        console.log(`  [${doc.id}] ${d.email} | role: ${d.role} | internal id: ${d.id}`);
        uidByEmail.set(d.email?.toLowerCase(), doc.id);
    }

    // Load all classes and their subcollections
    const classesSnap = await db.collection('classes').get();
    console.log('\n=== Classes & Courses ===');
    let totalCoursesFixed = 0;

    for (const classDoc of classesSnap.docs) {
        const classData = classDoc.data();
        console.log(`\n  Class [${classDoc.id}]: "${classData.name}" | teacherId: ${classData.teacherId}`);

        const coursesSnap = await classDoc.ref.collection('courses').get();
        for (const courseDoc of coursesSnap.docs) {
            const courseData = courseDoc.data();
            console.log(`    Course [${courseDoc.id}]: "${courseData.name}" | teacherId: ${courseData.teacherId}`);

            // Check if teacherId matches any user doc's id
            const matchingUser = usersSnap.docs.find(u => u.data().id === courseData.teacherId || u.id === courseData.teacherId);
            if (matchingUser) {
                const realUid = matchingUser.id;
                if (courseData.teacherId !== realUid) {
                    console.log(`      ⚠️  teacherId mismatch! Stored: ${courseData.teacherId}, should be: ${realUid}`);
                    await courseDoc.ref.update({ teacherId: realUid });
                    console.log(`      ✅ Fixed!`);
                    totalCoursesFixed++;
                } else {
                    console.log(`      ✅ teacherId already matches auth UID`);
                }
            } else {
                console.log(`      ⚠️  Could not find matching user for teacherId: ${courseData.teacherId}`);
            }
        }
    }

    // Also fix root-level courses if any
    const rootCoursesSnap = await db.collectionGroup('courses').get();
    console.log(`\n=== All courses via collectionGroup: ${rootCoursesSnap.docs.length} total ===`);

    console.log(`\n✅ Total courses fixed: ${totalCoursesFixed}`);
    process.exit(0);
}

checkCourses().catch(e => { console.error(e); process.exit(1); });
