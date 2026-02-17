import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Setup config from env vars
// Note: This script is intended to be run with bun or a node environment that loads .env
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error('Error: Firebase config not found in environment variables.');
  console.error('Make sure you have a .env file with VITE_FIREBASE_... variables.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function migrate() {
    // Authenticate
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.error('Error: Please set ADMIN_EMAIL and ADMIN_PASSWORD in .env or environment variables to authenticate as an admin.');
        process.exit(1);
    }

    try {
        console.log(`Authenticating as ${email}...`);
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Authenticated successfully.');
    } catch (e) {
        console.error('Authentication failed:', e);
        process.exit(1);
    }

    // Fetch all users
    console.log('Fetching users...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    const parents = users.filter(u => u.role === 'parent');
    const students = users.filter(u => u.role === 'student');
    const studentMap = new Map(students.map(s => [s.id, s]));

    console.log(`Found ${parents.length} parents and ${students.length} students.`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const parent of parents) {
        const childrenIds = parent.childrenIds || [];
        const relatedClassIds = new Set<string>();

        for (const childId of childrenIds) {
            const student = studentMap.get(childId);
            if (student && student.classId) {
                relatedClassIds.add(student.classId);
            }
        }

        const newRelatedClassIds = Array.from(relatedClassIds);

        // Check if update is needed
        const currentRelated = parent.relatedClassIds || [];
        const needsUpdate = !arraysEqual(currentRelated.sort(), newRelatedClassIds.sort());

        if (needsUpdate) {
            console.log(`Updating parent ${parent.id} (${parent.name}): relatedClassIds = [${newRelatedClassIds.join(', ')}]`);
            try {
                await updateDoc(doc(db, 'users', parent.id), {
                    relatedClassIds: newRelatedClassIds
                });
                updatedCount++;
            } catch (err) {
                console.error(`Failed to update parent ${parent.id}:`, err);
            }
        } else {
            skippedCount++;
        }
    }

    console.log(`Migration complete.`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped (already up to date): ${skippedCount}`);
    process.exit(0);
}

function arraysEqual(a: any[], b: any[]) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

migrate();
