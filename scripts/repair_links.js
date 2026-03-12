import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountParams = JSON.parse(readFileSync(path.join(__dirname, 'serviceAccountKey.json'), 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountParams)
});

const db = admin.firestore();

// Confirmed IDs from analysis
const PARENT_ID = 'ezsEyrtGiuU0cqCUoJ0ZeoY4Ymw2'; // baba
const STUDENT_ID = 'd3qtN6c4CwZHIkBov3iBNJWIQoj2'; // Yassine

async function repair() {
    try {
        console.log(`--- Repairing Parent-Student Link ---`);

        const parentRef = db.collection('users').doc(PARENT_ID);
        const studentRef = db.collection('users').doc(STUDENT_ID);

        const parentSnap = await parentRef.get();
        const studentSnap = await studentRef.get();

        if (!parentSnap.exists) {
            console.error('Parent document not found!');
            process.exit(1);
        }

        if (!studentSnap.exists) {
            console.error('Student document not found!');
            process.exit(1);
        }

        const studentData = studentSnap.data();
        const relatedClassIds = studentData.classId ? [studentData.classId] : [];

        console.log(`Parent: ${parentSnap.data().name}`);
        console.log(`Student to link: ${studentData.name} (Class: ${studentData.classId || 'None'})`);

        await parentRef.update({
            childrenIds: [STUDENT_ID],
            relatedClassIds: relatedClassIds
        });

        console.log('SUCCESS: Parent document updated successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Error during repair:', e);
        process.exit(1);
    }
}

repair();
