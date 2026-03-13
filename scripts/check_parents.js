import admin from 'firebase-admin';
import { readFileSync, writeFileSync } from 'fs';
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

async function checkParents() {
  try {
    console.log('--- Checking Parent relatedClassIds ---');
    const usersSnap = await db.collection('users').get();
    const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const students = allUsers.filter((u) => u.role === 'student');
    const parents = allUsers.filter((u) => u.role === 'parent');

    const studentMap = new Map();
    students.forEach((s) => studentMap.set(s.id, s));

    let report = '';
    let missingOrIncorrect = 0;

    for (const p of parents) {
      const childrenIds = p.childrenIds || [];
      const actualClassIds = new Set();
      childrenIds.forEach((cid) => {
        const s = studentMap.get(cid);
        if (s && s.classId) actualClassIds.add(s.classId);
      });

      const existingRelated = new Set(p.relatedClassIds || []);

      // Check if they match
      const isCorrect =
        actualClassIds.size === existingRelated.size &&
        [...actualClassIds].every((id) => existingRelated.has(id));

      if (!isCorrect) {
        missingOrIncorrect++;
        report += `Parent: ${p.name} (${p.email})\n`;
        report += `  Children IDs: ${childrenIds.join(', ')}\n`;
        report += `  Expected Classes: ${[...actualClassIds].join(', ')}\n`;
        report += `  Found Classes: ${[...existingRelated].join(', ')}\n`;
        report += `---\n`;
      }
    }

    console.log(`Found ${missingOrIncorrect} parents with missing or incorrect relatedClassIds.`);
    if (report) {
      writeFileSync('scripts/parent_check_results.txt', report);
      console.log('Details written to scripts/parent_check_results.txt');
    }

    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

checkParents();
