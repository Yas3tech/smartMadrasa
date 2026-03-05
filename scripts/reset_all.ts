/**
 * ⚠️ SCRIPT DESTRUCTIF — Supprime TOUTES les données Firebase
 *
 * Ce script :
 * 1. Supprime TOUS les comptes Firebase Auth
 * 2. Supprime TOUS les documents Firestore (toutes les collections)
 *
 * Après exécution, l'app affichera la page FirstRunSetup pour
 * recréer le superadmin.
 *
 * EXÉCUTION :
 *    npx tsx scripts/reset_all.ts
 */

import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'serviceAccountKey.json'), 'utf-8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

// --- Confirmation ---
async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'oui');
    });
  });
}

// --- Supprimer tous les Auth users ---
async function deleteAllAuthUsers(): Promise<number> {
  let deleted = 0;
  let nextPageToken: string | undefined;

  do {
    const listResult = await auth.listUsers(1000, nextPageToken);
    if (listResult.users.length === 0) break;

    const uids = listResult.users.map((u) => u.uid);
    await auth.deleteUsers(uids);
    deleted += uids.length;
    console.log(`  🗑️  ${deleted} comptes Auth supprimés...`);

    nextPageToken = listResult.pageToken;
  } while (nextPageToken);

  return deleted;
}

// --- Supprimer tous les documents d'une collection ---
async function deleteCollection(collectionPath: string): Promise<number> {
  const batchSize = 500;
  let deleted = 0;

  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(batchSize);

  while (true) {
    const snapshot = await query.get();
    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.docs.length;
  }

  return deleted;
}

// --- Lister toutes les collections racines ---
async function deleteAllFirestoreData(): Promise<number> {
  const collections = await db.listCollections();
  let totalDeleted = 0;

  for (const collection of collections) {
    const count = await deleteCollection(collection.id);
    console.log(`  🗑️  Collection "${collection.id}" : ${count} documents supprimés`);
    totalDeleted += count;
  }

  return totalDeleted;
}

// --- Main ---
async function main(): Promise<void> {
  console.log('\n⚠️  ATTENTION — SCRIPT DESTRUCTIF ⚠️');
  console.log('Ce script va supprimer :');
  console.log('  - TOUS les comptes Firebase Auth');
  console.log('  - TOUS les documents Firestore\n');

  const ok = await confirm('Tapez "oui" pour confirmer : ');
  if (!ok) {
    console.log('❌ Annulé.');
    process.exit(0);
  }

  console.log('\n1/2 — Suppression des comptes Auth...');
  const authCount = await deleteAllAuthUsers();
  console.log(`  ✅ ${authCount} comptes supprimés\n`);

  console.log('2/2 — Suppression des données Firestore...');
  const firestoreCount = await deleteAllFirestoreData();
  console.log(`  ✅ ${firestoreCount} documents supprimés\n`);

  console.log('🎉 Reset complet ! Tu peux maintenant :');
  console.log("  1. Lancer l'app (npm run dev)");
  console.log('  2. Aller sur http://localhost:5173/setup');
  console.log('  3. Créer ton superadmin');
  console.log('  → La Cloud Function assignera automatiquement les Custom Claims\n');

  process.exit(0);
}

main();
