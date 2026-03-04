/**
 * Script de migration : synchronise les Custom Claims pour tous les users existants.
 *
 * PRÉREQUIS :
 * 1. Télécharger la clé de service account :
 *    Console Firebase → ⚙️ Project Settings → Service Accounts → Generate new private key
 *    Sauvegarder le fichier JSON dans : scripts/serviceAccountKey.json
 *
 * 2. ⚠️ Ajouter "scripts/serviceAccountKey.json" au .gitignore !!!
 *
 * EXÉCUTION :
 *    npx tsx scripts/migrate_custom_claims.ts
 */

import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger la clé de service account
const serviceAccount = JSON.parse(
    fs.readFileSync(path.join(__dirname, "serviceAccountKey.json"), "utf-8")
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

const VALID_ROLES = ["student", "teacher", "parent", "director", "superadmin"];

async function migrateAllUsers(): Promise<void> {
    console.log("🔄 Démarrage de la migration des Custom Claims...\n");

    const usersSnapshot = await db.collection("users").get();
    let success = 0;
    let errors = 0;
    let skipped = 0;

    for (const doc of usersSnapshot.docs) {
        const data = doc.data();
        const userId = doc.id;
        const role = data.role;

        if (!role || !VALID_ROLES.includes(role)) {
            console.log(`⏭️  ${userId} — rôle invalide ou manquant (${role}), ignoré`);
            skipped++;
            continue;
        }

        try {
            // Vérifier si le claim existe déjà
            const userRecord = await auth.getUser(userId);
            if (userRecord.customClaims?.role === role) {
                console.log(`✅ ${userId} → ${role} (déjà migré)`);
                skipped++;
                continue;
            }

            await auth.setCustomUserClaims(userId, { role });
            console.log(`✅ ${userId} → ${role}`);
            success++;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`❌ ${userId} — ${message}`);
            errors++;
        }
    }

    console.log(
        `\n📊 Résultat : ${success} migrés, ${skipped} ignorés/déjà migrés, ${errors} erreurs sur ${usersSnapshot.size} utilisateurs`
    );
    process.exit(errors > 0 ? 1 : 0);
}

migrateAllUsers();
