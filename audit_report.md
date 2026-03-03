# Audit Technique Complet : SaaS Scolaire (React + Firebase)

**Date** : Mars 2025
**Contexte** : Application SaaS pour écoles (React SPA, Firebase Auth, Firestore, Storage).
**Périmètre** : Audit de sécurité, performance, architecture, robustesse et préparation à la production.

---

## 🏆 VERDICT FINAL & SCORE

**Verdict** : `READY WITH WARNINGS`
**Score global** : **82/100**

**Justification du verdict** :
L'application est globalement très bien conçue et structurée. Le découpage React est performant (code splitting via `React.lazy`, manualChunks), les règles Firestore ont été pensées avec de vraies fonctions d'autorisation granulaires (`isOwnerSafeUpdate`), et la validation des fichiers uploadés est stricte (vérification des signatures / magic numbers).
Néanmoins, l'application présente des avertissements de sécurité et de robustesse qu'il faut adresser avant le déploiement réel. Le système de rôles actuel repose sur des lectures de documents Firestore plutôt que sur des Custom Claims, et bien que les règles soient robustes contre l'élévation de privilèges, cela représente un risque architectural et financier (multiplication des lectures).

L'absence d'un système de Custom Claims robuste empêche de qualifier le système de "Ready for Production" sans réserve pour des données scolaires. De plus, quelques dépendances comportent des vulnérabilités de niveau "High".

---

## 🛑 1. PROBLÈMES CRITIQUES BLOQUANTS (Résolus ou à résoudre)

- **[RÉSOLU] Absence du fichier d'index Firestore (`firestore.indexes.json`)** :
  Le fichier `firebase.json` référençait `firestore.indexes.json` mais il était absent du dépôt. En production, cela provoquerait un échec de déploiement des règles ou des erreurs d'exécution silencieuses dans la console (erreur "index missing").
  *Action : Un fichier `firestore.indexes.json` minimal (ciblant les collections `messages` et `courseGrades`) a été généré.*

- **[À VALIDER] Gestion des rôles sans Firebase Custom Claims** :
  Actuellement, l'authentification et l'autorisation sont gérées par une lecture d'un document utilisateur (ex: `/users/$(request.auth.uid)`).
  - *Risque de sécurité* : Bien que les règles Firestore interdisent la modification du champ `role` par l'utilisateur lui-même (grâce à la whitelist `isOwnerSafeUpdate`), si une faille applicative permettait un jour à un utilisateur d'écrire ce document, il pourrait s'attribuer le rôle `superadmin`.
  - *Risque financier/Performance* : Chaque requête Firestore nécessite de lire à nouveau le document utilisateur (coût = lectures Firestore facturées + latence).
  - *Remédiation proposée* : Migrer la gestion des rôles vers les **Custom Claims Firebase Auth**. Cela nécessite le déploiement d'une Cloud Function (ex: au moment de la création par un `superadmin`, la fonction définit le claim `role: 'teacher'`). La règle deviendrait `request.auth.token.role == 'teacher'`. *Action requise : Architecture à valider par l'équipe.*

- **[À RÉSOUDRE] Vulnérabilités critiques dans les dépendances (npm/pnpm audit)** :
  L'audit des paquets (`pnpm audit`) a révélé 9 vulnérabilités "High", principalement dans `minimatch`, `rollup` et `xlsx` (ReDoS : attaques par déni de service régulier).
  - *Remédiation proposée* : Mettre à jour Vite, ESLint et TypeScript pour embarquer les versions patchées de `minimatch` et `rollup`.

---

## ⚠️ 2. WARNINGS IMPORTANTS (Architecture & Robustesse)

- **Audit Configuration Console Firebase & IAM** :
  L'audit de sécurité des règles (code) est robuste, mais il est impossible de vérifier la configuration réelle de la console Firebase via le code source.
  - *Action requise* : Assurez-vous que l'API key exposée dans `.env` pointe bien vers un environnement de PROD et non de DEV. Vérifiez que Google Cloud IAM ne donne pas les droits `Editor` à des comptes de service inutilisés, et que Firebase Auth limite bien les domaines autorisés (Authorized Domains) aux seuls domaines de l'école.

- **Import croisé dynamique/statique dans Vite (`db.ts`)** :
  Lors du build production, un avertissement critique de Vite apparaît : `db.ts is dynamically imported by AuthContext.tsx but also statically imported by [...]`.
  - *Risque* : Cela casse l'optimisation du code splitting et force le module Firestore à être chargé de manière non optimale.
  - *Action requise* : Uniformiser l'import de `src/config/db.ts` dans tout le projet (soit tout statique, soit tout dynamique).

- **Backups et Monitoring (Sentry) manquants** :
  Il n'y a aucune trace d'intégration d'un outil de monitoring (ex: Sentry ou Datadog) pour capturer les erreurs React ou Firestore (ex: `permission-denied`).
  - *Risque* : En production, si un professeur n'arrive pas à entrer une note à cause d'un bug d'index ou de règles, il n'y a aucun log centralisé pour analyser le problème.
  - *Action requise* : Intégrer un Logger Error Boundary dans React et activer les sauvegardes automatiques de la base de données (Google Cloud Console > Firestore > Backups).

---

## 💡 3. RECOMMANDATIONS & AMÉLIORATIONS (Performance & UX)

- **Performance du Bundle (ExcelJS)** :
  Le fichier `exceljs.min` représente **930 kB (255 kB gzip)** à lui seul dans le build de production.
  *Amélioration* : Même s'il est importé dynamiquement (ce qui est excellent !), il conviendrait de vérifier si une librairie plus légère (comme `xlsx` ou `sheetjs`) pourrait suffire pour les besoins d'export/import.

- **Vérification d'Environnement** :
  Des `console.log` de performances (utilisés pour les benchmarks et tests, ex: `DataContext.perf.test.tsx`, `courseGrades.bench.test.ts`) subsistent dans les fichiers sources. Le minifier Terser (configuré dans `vite.config.ts` via `drop_console: true`) les supprimera en production, mais il est de bonne pratique de nettoyer le code source.

- **Simulation d'attaque "Utilisateur Malveillant" (Validée ✅)** :
  J'ai simulé et vérifié que les règles interdisent bien à un Élève de modifier son `classId` ou d'usurper l'identité d'un autre élève (`isOwnerSafeUpdate`). L'étanchéité inter-utilisateurs et inter-rôles fonctionne. De même, un élève ne peut pas lire les devoirs ou notes d'une classe qui n'est pas la sienne.

- **Intégrité des données après suppression (Validée ✅)** :
  Le service `deleteAllUserData` est extrêmement exhaustif : il utilise `writeBatch` et `Promise.all` pour supprimer non seulement le profil utilisateur, mais aussi ses fichiers (Storage), ses notes, ses présences et ses messages. C'est un point fort majeur du système.

---

## CONCLUSION

Le socle technique de cette application (React + Firebase) est solide, l'architecture est pensée pour la maintenabilité (hooks spécialisés, séparation des responsabilités), et des efforts considérables ont été faits sur la sécurisation granulaire des composants (validation des signatures de fichiers pour l'upload, utilisation de `writeBatch` pour l'intégrité).

Avant la mise en production, la priorité est :
1. De corriger les dépendances vulnérables (`pnpm audit`).
2. De valider l'architecture d'autorisation (migration des rôles vers les Custom Claims).
3. De mettre en place une stratégie de sauvegarde (Backup Firestore) depuis la console Google Cloud.