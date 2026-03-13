/**
 * dump_courses.js
 * Dumps all course data to diagnose why courses don't show in the schedule.
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

async function dumpCourses() {
  const classesSnap = await db.collection('classes').get();
  for (const classDoc of classesSnap.docs) {
    const classData = classDoc.data();
    console.log(`\nClass: "${classData.name}" [${classDoc.id}]`);
    const coursesSnap = await classDoc.ref.collection('courses').get();
    console.log(`  Courses count: ${coursesSnap.size}`);
    for (const courseDoc of coursesSnap.docs) {
      console.log(`  Course [${courseDoc.id}]:`);
      console.log(JSON.stringify(courseDoc.data(), null, 4));
    }
  }
  process.exit(0);
}

dumpCourses().catch((e) => {
  console.error(e);
  process.exit(1);
});
