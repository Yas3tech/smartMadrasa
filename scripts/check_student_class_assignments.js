/**
 * check_student_class_assignments.js
 *
 * Checks if students in Firestore have classId set correctly.
 * Dumps the class info and which students belong to it.
 *
 * Usage: node scripts/check_student_class_assignments.js
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

async function main() {
  // Get all classes
  const classesSnap = await db.collection('classes').get();
  console.log(`\n📚 ${classesSnap.size} class(es) found:\n`);
  for (const d of classesSnap.docs) {
    console.log(`  ID="${d.id}" name="${d.data().name}" teacherId="${d.data().teacherId}"`);
  }

  // Get all students
  const usersSnap = await db.collection('users').where('role', '==', 'student').get();
  console.log(`\n👩‍🎓 ${usersSnap.size} student(s) found:\n`);
  for (const d of usersSnap.docs) {
    const u = d.data();
    console.log(`  ID="${d.id}" name="${u.name}" classId="${u.classId || '(none)'}"`);
  }

  // For each class, count how many students have that classId
  console.log('\n🔗 Students per class:\n');
  for (const classDoc of classesSnap.docs) {
    const studentsInClass = usersSnap.docs.filter((d) => d.data().classId === classDoc.id);
    console.log(
      `  "${classDoc.data().name}" (ID=${classDoc.id}): ${studentsInClass.length} student(s)`
    );
    for (const s of studentsInClass) {
      console.log(`    - ${s.data().name}`);
    }
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
