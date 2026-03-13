import admin from 'firebase-admin';
import { readFileSync } from 'fs';
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

async function fix() {
  try {
    const emailToFix = 'ya33.tech@gmail.com';
    const listUsersResult = await admin.auth().listUsers(100);
    const superadminUser = listUsersResult.users.find((u) => u.email === emailToFix);

    if (!superadminUser) {
      console.log(
        `User ${emailToFix} not found in Firebase Auth. Assuming the user has deleted it and hasn't recreated it yet.`
      );
      process.exit(1);
    }

    const uid = superadminUser.uid;
    console.log(`Found Auth User: ${uid}`);

    // Create user doc
    await db
      .collection('users')
      .doc(uid)
      .set({
        id: uid,
        name: superadminUser.displayName || 'Super Admin',
        email: emailToFix,
        role: 'superadmin',
        avatar: 'admin',
        createdAt: new Date().toISOString(),
      });
    console.log('Successfully created user document in Firestore.');

    // Create setup doc
    await db.collection('_setup').doc('config').set({
      setupCompletedAt: new Date().toISOString(),
      completedBy: uid,
      status: 'locked',
    });
    console.log('Successfully locked setup config.');

    console.log('SUCCESS! Everything is fixed.');
    process.exit(0);
  } catch (e) {
    console.error('An error occurred:', e);
    process.exit(1);
  }
}

fix();
