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

async function analyze() {
  try {
    let output = '--- Analyzing Parent-Student Links ---\n';
    const usersSnap = await db.collection('users').get();
    const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const students = allUsers.filter((u) => u.role === 'student');
    const parents = allUsers.filter((u) => u.role === 'parent');

    const studentMap = new Map();
    students.forEach((s) => studentMap.set(s.id, s));

    const brokenParents = [];

    parents.forEach((p) => {
      const childrenIds = p.childrenIds || [];
      const brokenIds = childrenIds.filter((cid) => !studentMap.has(cid));

      if (brokenIds.length > 0) {
        brokenParents.push({
          parent: p,
          brokenIds,
        });
      }
    });

    output += `Found ${brokenParents.length} parents with broken children links.\n\n`;

    for (const item of brokenParents) {
      const p = item.parent;
      output += `Parent: ${p.name} (${p.email}) [ID: ${p.id}] Created: ${p.createdAt || 'N/A'}\n`;
      output += `  Broken IDs: ${item.brokenIds.join(', ')}\n`;
      output += `  Related Classes: ${p.relatedClassIds?.join(', ') || 'None'}\n`;

      // Suggest candidates
      const candidates = students.filter((s) => {
        // Heuristic 1: Related Class
        const inClass = p.relatedClassIds && s.classId && p.relatedClassIds.includes(s.classId);

        // Heuristic 2: Creation Timestamp (within 10 seconds)
        const pTime = p.createdAt ? new Date(p.createdAt).getTime() : 0;
        const sTime = s.createdAt ? new Date(s.createdAt).getTime() : 0;
        const sameTime = pTime && sTime && Math.abs(pTime - sTime) < 10000;

        if (!inClass && !sameTime) return false;

        // Check if student is already linked to ANOTHER parent correctly
        const isLinkedElsewhere = parents.some(
          (otherP) => otherP.id !== p.id && (otherP.childrenIds || []).includes(s.id)
        );

        return !isLinkedElsewhere;
      });

      if (candidates.length > 0) {
        output += `  Potential Candidates:\n`;
        candidates.forEach((c) => {
          output += `    - ${c.name} (${c.email}) [ID: ${c.id}] Created: ${c.createdAt || 'N/A'}\n`;
        });
      } else {
        output += `  No unlinked candidates found.\n`;
      }
      output += '---\n';
    }

    output += '\n--- All Students ---\n';
    students.forEach((s) => {
      output += `Student: ${s.name} (${s.email}) [ID: ${s.id}] Created: ${s.createdAt || 'N/A'}\n`;
    });

    writeFileSync('scripts/analysis_results.txt', output);
    console.log('Results written to scripts/analysis_results.txt');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

analyze();
