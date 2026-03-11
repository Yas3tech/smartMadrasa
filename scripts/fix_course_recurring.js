/**
 * fix_course_recurring.js
 * Fixes courses that have isRecurring=false and no specificDate → sets isRecurring=true.
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

async function fixCourseRecurring() {
    let fixed = 0;
    const classesSnap = await db.collection('classes').get();
    for (const classDoc of classesSnap.docs) {
        const coursesSnap = await classDoc.ref.collection('courses').get();
        for (const courseDoc of coursesSnap.docs) {
            const d = courseDoc.data();
            if (!d.isRecurring && !d.specificDate) {
                console.log(`Fixing course "${d.name}" in class "${classDoc.data().name}" → isRecurring=true`);
                await courseDoc.ref.update({ isRecurring: true });
                fixed++;
            }
        }
    }
    console.log(`\nFixed ${fixed} course(s).`);
    process.exit(0);
}

fixCourseRecurring().catch(e => { console.error(e); process.exit(1); });
