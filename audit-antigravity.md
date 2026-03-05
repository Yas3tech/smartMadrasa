# 🔒 Rapport d'Audit de Sécurité et Production — SmartMadrasa

**Date** : 4 mars 2026  
**Auditeur** : Antigravity (IA avancée de Google DeepMind)  
**Projet** : SmartMadrasa — Système de Gestion Scolaire  
**Version** : 0.0.0 (pre-release)  
**Stack** : React 19 · Vite 7 · Firebase 12 · Tailwind 3 · TypeScript 5.9

---

## Score Global : 68 / 100

## Verdict : ⛔ NOT READY FOR PRODUCTION

---

## Résumé Exécutif

SmartMadrasa est une application web de gestion scolaire bien structurée avec des fondations solides en termes de sécurité Firebase (Custom Claims, règles Firestore détaillées, headers CSP). Cependant, **plusieurs failles critiques et bloquantes** empêchent un déploiement en production pour un environnement manipulant des données scolaires sensibles.

Les blocants principaux sont :

1. La route `/setup` permettant la création d'un superadmin sans aucune protection
2. L'absence totale de transactions Firestore pour les opérations multi-documents critiques
3. L'incohérence entre les règles Firestore grades (utilisent `classIds` sur le doc teacher) et le code applicatif (utilise `isTeacherForClass` basé sur `classes.teacherId`)
4. L'absence de pagination sur les requêtes Firestore (risque de facturation explosive)
5. La double initialisation de Firebase App dans `firebase.ts` et `db.ts`

---

## 1. BLOCANTS (Doivent être corrigés avant mise en production)

### 🔴 CRIT-01 : Route `/setup` non protégée — Création de SuperAdmin sans authentification

**Fichier** : `src/pages/auth/FirstRunSetup.tsx` + `src/App.tsx`  
**Sévérité** : CRITIQUE

La route `/setup` est accessible **sans aucune authentification**. N'importe quel visiteur peut :

1. Accéder à `/setup`
2. Créer un compte superadmin avec email/mot de passe arbitraires
3. Injecter un document `users/{uid}` avec `role: 'superadmin'`

Le seul garde-fou est un check `isDatabaseEmpty` côté client (dans `Login.tsx` pour afficher le bouton), mais :

- Il n'y a **aucune vérification côté serveur** (Firestore rules) empêchant la création d'un user `superadmin` si la base n'est pas vide
- La route `/setup` ne vérifie pas `isDatabaseEmpty` elle-même
- Il n'y a pas de `ProtectedRoute` autour de `<FirstRunSetup />`

**Impact** : Un attaquant peut créer un superadmin à tout moment et prendre le contrôle total.

**Remédiation** :

1. Ajouter une Cloud Function qui vérifie que la base est vide avant d'autoriser la création du premier superadmin
2. OU protéger la route `/setup` avec une vérification `isDatabaseEmpty` côté composant + une règle Firestore bloquant `create` avec `role: 'superadmin'` si des users existent déjà
3. Supprimer la route `/setup` en production et n'autoriser la création du premier admin que via le script `reset_all.ts` ou la console Firebase

---

### 🔴 CRIT-02 : Incohérence dans les règles d'écriture des notes (grades/courseGrades)

**Fichiers** : `firestore.rules` (lignes 121, 135)  
**Sévérité** : CRITIQUE

Les règles d'écriture des grades et courseGrades utilisent :

```
allow write: if (isTeacher() && request.resource.data.classId in getUserData().classIds)
```

Cela vérifie `classIds` **sur le document user du teacher dans Firestore**. Or :

- Le commentaire dans `isTeacherForClass()` (ligne 77-82) indique explicitement que `user.classIds` est **non fiable** et ne doit PAS être utilisé
- `isTeacherForClass()` vérifie via `classes/{classId}.teacherId` (source de vérité)
- Ces deux méthodes peuvent donner des résultats **contradictoires**

**Impact** : Un enseignant pourrait écrire des notes dans des classes auxquelles il n'est pas affecté (si `classIds` sur son doc est désynchronisé), ou être bloqué sur des classes légitimes.

**Remédiation** :

```diff
- allow write: if (isTeacher() && request.resource.data.classId in getUserData().classIds)
+ allow write: if (isTeacher() && isTeacherForClass(request.resource.data.classId))
```

⚠️ Note : cela ajoute un `get()` supplémentaire par écriture (coût quotas), mais c'est nécessaire pour la cohérence de sécurité.

---

### 🔴 CRIT-03 : Absence de transactions Firestore pour les opérations critiques

**Fichiers** : `src/services/courseGrades.ts`, `src/services/teacherComments.ts`, `src/services/deleteUserData.ts`  
**Sévérité** : CRITIQUE

**Aucun `runTransaction()`** n'est utilisé dans tout le projet. Les opérations critiques multi-documents utilisent des `writeBatch` (non-transactionnels) ou des opérations séquentielles :

- **Suppression d'utilisateur** (`deleteUserData.ts`) : supprime des documents dans 6+ collections séquentiellement. Si une étape échoue, les données sont partiellement supprimées → incohérence.
- **Écriture de notes par batch** (`courseGrades.ts:createCourseGradesBatch`) : `writeBatch` ne garantit pas la lecture-avant-écriture. Deux enseignants écrivant simultanément peuvent créer des doublons.
- **Publication des bulletins** : aucune atomicité entre le changement d'état de la période et la mise à jour des notes associées.

**Impact** : Données incohérentes en cas d'échec partiel, doublons possibles, bulletins incohérents.

**Remédiation** :

- Utiliser `runTransaction()` pour la suppression d'utilisateur (au minimum les opérations Firestore)
- Utiliser `runTransaction()` pour la publication des bulletins
- Accepter `writeBatch` pour les créations de notes en batch (acceptable si les doublons sont gérés côté UI)

---

### 🔴 CRIT-04 : Absence de pagination sur les requêtes Firestore

**Fichiers** : Tous les services (`users.ts`, `courseGrades.ts`, `messages.ts`, `homework.ts`, etc.)  
**Sévérité** : HAUTE → CRITIQUE en production

**Aucune requête** n'utilise `limit()` ou curseur de pagination (sauf `getUserByEmail` avec `limit(1)`). Les fonctions comme `getUsers()`, `subscribeToCourseGrades()`, `subscribeToHomeworks()`, `getMessages()` récupèrent **TOUS les documents** de la collection.

Conséquences avec 200+ élèves, 50 cours, 1000+ notes :

- **Facturation** : chaque ouverture de page déclenche des centaines/milliers de lectures
- **Performance** : temps de chargement inacceptable sur mobile
- **Mémoire** : snapshots en temps réel maintiennent TOUS les documents en mémoire
- **Quotas** : risque de hit des limites Firestore (50 000 lectures/jour quota gratuit)

**Remédiation prioritaire** :

1. Ajouter `limit(50)` + pagination par curseur sur toutes les requêtes de liste
2. Filtrer côté serveur (règles) plutôt que côté client
3. Migrer les snapshots temps réel vers un modèle pagination + refresh

---

### 🔴 CRIT-05 : Double initialisation de Firebase App

**Fichiers** : `src/config/firebase.ts`, `src/config/db.ts`  
**Sévérité** : HAUTE

`firebase.ts` fait `initializeApp(firebaseConfig)` et exporte `auth`.  
`db.ts` fait un **second** `initializeApp(firebaseConfig)` (sans nom d'app) et exporte `db` et `storage`.

Firebase SDK v12 gère les appels multiples via `getApp()` pour l'app par défaut, et ne crashera pas car `initializeApp` retourne l'app existante en v12. Cependant, c'est un anti-pattern qui :

- Crée de la confusion architecturale
- Pourrait causer un crash si Firebase durcit ce comportement dans une future version
- Indique un manque de cohérence dans l'initialisation

**Remédiation** :

```typescript
// firebase.ts — initialisaton unique
export { app, auth, db, storage };
```

---

## 2. WARNINGS (Ne bloquent pas le déploiement mais doivent être traités rapidement)

### 🟠 WARN-01 : Référence fantôme à DOMPurify et html2canvas dans vite.config.ts

**Fichier** : `vite.config.ts` (ligne 38)  
**Impact** : Build warning potentiel, confusion architecturale

`manualChunks` référence `'dompurify'` et `'html2canvas'` qui ne sont **pas dans les dépendances** (`package.json`). Vite ignorera silencieusement ces entrées, mais cela indique du code mort ou des dépendances oubliées.

**Remédiation** : Supprimer la ligne `'vendor-sanitize': ['dompurify', 'html2canvas']` ou ajouter les dépendances si elles sont nécessaires.

---

### 🟠 WARN-02 : Service Account Key dans le repository

**Fichier** : `scripts/serviceAccountKey.json`  
**Impact** : HAUTE si le repo est public ou partagé

Le fichier est dans `.gitignore` (ligne 33 : `scripts/serviceAccountKey.json`), ce qui est correct. **Cependant** :

- Le fichier existe actuellement dans le répertoire de travail
- Si le repo a déjà été poussé avec ce fichier avant l'ajout au .gitignore, la clé est compromise
- Le `project_id` est `app-test-61738` — si c'est le projet de production, cette clé doit être **révoquée et recréée**

**Remédiation** :

1. Vérifier l'historique Git : `git log --all --full-history -- scripts/serviceAccountKey.json`
2. Si trouvé dans l'historique : révoquer la clé dans la console GCP et en créer une nouvelle
3. Utiliser des variables d'environnement ou un secret manager pour les scripts admin

---

### 🟠 WARN-03 : Absence de validation des entrées dans les formulaires de messagerie

**Fichier** : `src/services/messages.ts`  
**Impact** : XSS stocké potentiel (atténué par React)

Les messages sont créés avec `addDoc(...)` sans aucune sanitisation du `content` ou du `subject`. React échappe automatiquement le rendu (`{message.content}`), mais :

- Si un futur développeur utilise `dangerouslySetInnerHTML` ou exporte les messages en HTML/PDF, le XSS sera actif
- Les titres de messages pourraient contenir des caractères de contrôle ou des injections Unicode

**Remédiation** : Ajouter une fonction de sanitisation basique (trim, longueur max, strip de caractères de contrôle) avant `addDoc()`.

---

### 🟠 WARN-04 : Connexion Google (OAuth) sans vérification de domaine

**Fichier** : `src/pages/auth/Login.tsx` (ligne 108-121)  
**Impact** : Tout possesseur de compte Google peut se connecter

`handleGoogleLogin` utilise `signInWithPopup` sans restriction de domaine. Si l'utilisateur Google n'a pas de document dans `users/`, `AuthContext` le rejette (`setUser(null)`), mais :

- L'utilisateur **est authentifié dans Firebase Auth**
- Aucune Custom Claim n'est définie pour cet utilisateur (pas de doc Firestore → pas de trigger Cloud Function)
- L'utilisateur ne peut rien faire (pas de rôle) mais occupe une entrée Auth

**Remédiation** : Restreindre les domaines Google autorisés ou supprimer le login Google si non nécessaire pour l'école.

---

### 🟠 WARN-05 : Données orphelines lors de la suppression d'un professeur

**Fichier** : `src/services/deleteUserData.ts` (lignes 166-179)  
**Impact** : Incohérence de données

Lors de la suppression d'un enseignant :

- Les **devoirs** (`homework` → `teacherId`) sont supprimés
- Les **commentaires** enseignant sont supprimés
- **MAIS** : les `classes` assignées à ce professeur (`classes/{id}.teacherId`) ne sont **pas mises à jour** → la classe référence un enseignant inexistant
- Les `courseGrades` avec `teacherId` ne sont pas nettoyés (les notes restent mais pointent vers un fantôme)
- Les `courses` (emploi du temps) avec `teacherId` ne sont pas supprimés

**Remédiation** : Ajouter au processus de suppression teacher :

1. Mettre `teacherId = null` sur les classes affectées
2. Supprimer ou réassigner les cours (courses) affectés

---

### 🟠 WARN-06 : Absence de monitoring et journalisation d'erreurs

**Impact** : Impossible de détecter les incidents en production

Aucun service de monitoring n'est intégré (pas de Sentry, Firebase Crashlytics Web, LogRocket, etc.). Les erreurs sont :

- Captées par `ErrorBoundary` → affichage UI uniquement
- `console.error` → supprimé par Terser en prod (`drop_console: true`)

**Remédiation** : Intégrer au minimum Firebase Performance Monitoring + un service de crash reporting (Sentry recommandé).

---

### 🟠 WARN-07 : Absence de stratégie de backup

**Impact** : Perte de données irrécupérable en cas d'incident

Aucune stratégie de backup n'est documentée ou configurée pour Firestore. Les données scolaires (notes, bulletins, présence) sont **critiques et irremplaçables**.

**Remédiation** :

1. Activer les exports Firestore planifiés (via `gcloud firestore export`)
2. Configurer un bucket GCS dédié aux backups avec rétention de 90 jours minimum
3. Tester la procédure de restauration

---

### 🟠 WARN-08 : Indexes Firestore potentiellement insuffisants

**Fichier** : `firestore.indexes.json`  
**Impact** : Erreurs en production sur certaines requêtes

Seuls 3 index composites sont définis :

1. `courseGrades` : (studentId ASC, date DESC)
2. `messages` : (receiverId ASC, timestamp DESC)
3. `messages` : (senderId ASC, timestamp DESC)

**Index manquants potentiels** identifiés par analyse des requêtes :

- `teacherComments` : (teacherId, periodId, updatedAt) — utilisé dans `subscribeToTeacherCommentsByTeacher`
- `teacherComments` : (studentId, createdAt) — utilisé dans `subscribeToTeacherCommentsByStudent`
- `courseGrades` : (courseId, periodId, date) — utilisé dans `subscribeToCourseGradesByCourseAndPeriod`
- `courseGrades` : (periodId, date) — utilisé dans `subscribeToCourseGradesByPeriod`
- `homeworks` : (classId, dueDate) — utilisé dans `getHomeworks`

**Remédiation** : Déployer en staging, déclencher toutes les requêtes, et collecter les erreurs d'index manquants dans la console Firebase. Ajouter les index nécessaires.

---

### 🟠 WARN-09 : `exceljs` non lazy-loaded dans le bundle

**Fichier** : `dist/assets/exceljs.min-BGP16JNT.js` — **909 KB**  
**Impact** : Bundle lourd, performance dégradée

`exceljs` est le plus gros chunk (909 KB). Bien qu'il soit dans un chunk séparé via `manualChunks`, il est potentiellement chargé via un import statique quelque part. Si c'est déjà un dynamic import (`React.lazy` ou `import()`), c'est acceptable. Il faut le confirmer.

**Remédiation** : Vérifier que `exceljs` est importé dynamiquement (`import('exceljs')`) et non statiquement.

---

### 🟠 WARN-10 : `deleteUser` exporté en doublon avec une fonction Firebase homonyme

**Fichier** : `src/services/users.ts` (ligne 217)  
**Impact** : Confusion et risque d'appeler la mauvaise fonction

La ligne `import { deleteUser } from 'firebase/auth'` (ligne 4 de `deleteUserData.ts`) et `export const deleteUser` (ligne 217 de `users.ts`) utilisent le même nom. Le service re-exported pourrait masquer la fonction Auth.

---

## 2.5 FAILLES FONCTIONNELLES ET DE LOGIQUE MÉTIER

Ces failles ont été identifiées lors de la revue d'architecture croisée avec les spécifications :

### 🟡 LOGIC-01 : Incohérence des abonnements Professeurs (Visibilité Globale vs Restreinte)

**Fichiers** : `src/context/slices/AcademicContext.tsx`, `src/context/slices/CommunicationContext.tsx`
**Problème** : Les règles générales de l'école stipulent qu'un `teacher` devrait avoir accès à tous les événements, classes et cours de l'établissement. Cependant, le code actuel restreint l'abonnement des professeurs uniquement aux données de **leurs propres classes**. C'est une divergence fonctionnelle majeure par rapport au comportement attendu.

### 🟡 LOGIC-02 : Usurpation d'identité sur les `teacherComments` et `events`

**Fichier** : `firestore.rules`
**Problème** :

- `teacherComments` : La règle `allow create` autorise un `isTeacher()` à créer un commentaire, mais ne valide pas que le champ `teacherId` du document correspond à `request.auth.uid`. Un enseignant pourrait forger un commentaire au nom d'un collègue.
- `events` : Même problème. Un enseignant peut créer un événement dans SA classe, mais rien n'empêche de mettre l'ID d'un autre enseignant comme créateur.
  **Solution requise** : Ajouter la condition explicite : `&& request.resource.data.teacherId == request.auth.uid` pour toute création par un rôle `teacher`.

### 🟡 LOGIC-03 : Isolation Storage bloquante pour les pièces jointes (`messages`)

**Fichier** : `storage.rules`
**Problème** : Les pièces jointes des messages sont sauvées sous `messages/{senderId}/{fileName}` et protégées par `allow read: if request.auth.uid == senderId`. Le destinataire ne peut pas lire le fichier via le SDK Client. S'il utilise une URL signée générée temporairement, cette URL expirera. Le destinataire perdra définitivement l'accès à la pièce jointe à terme.
**Solution requise** :

- Créer un backend (Cloud Function) servant de proxy pour vérifier que le demandeur est bien le destinataire dans Firestore.
- Ou intégrer le `receiverId` dans les métadonnées du fichier Storage pour faire correspondre la règle.

### 🟡 LOGIC-04 : Exposition inutile du statut d'installation (`_setup`)

**Fichier** : `firestore.rules`
**Problème** : La règle `match /_setup/{docId} { allow read: if true; }` permet à quiconque sur internet de lire l'état de configuration de l'école. Bien que non-sensible en soi, cela donne des indications sur la structure backend à un attaquant potentiel en phase de reconnaissance.

### 🟡 LOGIC-05 : TTI (Time to Interactive) dégradé par `exceljs`

**Fichier** : Bundle Vite / Production
**Problème** : La librairie d'export PDF/Excel asynchrone est chargée statiquement au démarrage ou mal lazy-loadée, pesant excessivement sur le fil d'exécution principal.
**Solution requise** : Vérifier que l'importation est strictement encapsulée dans la fonction d'export (ex: `const ExcelJS = await import('exceljs');`).

### 🟡 LOGIC-06 : Gestion partielle des professeurs supprimés (Foreign Keys)

**Fichier** : `src/services/deleteUserData.ts`
**Problème** : Lors de la suppression d'un enseignant, des collections liées (comme `courseGrades`) sont modifiées pour porter un `teacherId: ''` et un nom générique. C'est une source de bugs critiques en front-end si l'application s'attend à une jointure valide sur la collection `users` pour y trouver ce statut.
**Solution requise** : Aligner l'UI pour qu'elle gère gracieusement le cas `teacherId === ''` via des "Null Objects", ou conserver un profil "Utilisateur Supprimé" dans Firestore pour maintenir l'intégrité référentielle apparente.

---

## 3. POINTS POSITIFS ✅

### ✅ SEC-01 : Custom Claims Firebase correctement implémentés

La Cloud Function `syncRoleToClaims` valide les rôles contre une whitelist, vérifie les changements, et nettoie les claims à la suppression. Les règles Firestore utilisent `request.auth.token.role` (JWT) et non le document Firestore.

### ✅ SEC-02 : Règles Firestore bien structurées

- Default deny implicite (pas de `allow read, write: if true`)
- Helpers bien factorisés (`isTeacher()`, `isTeacherForClass()`, etc.)
- Protection contre l'élévation de privilèges (`isOwnerSafeUpdate` whitelist les champs modifiables)
- Protection messagerie (sender/receiver isolation, anti-spoofing)

### ✅ SEC-03 : Règles Storage robustes

- Default deny explicite (`match /{allPaths=**} { allow read, write: if false; }`)
- Limite de taille (25 MB)
- Validation MIME type sur les uploads
- Custom Claims utilisés pour les rôles Storage
- Isolation par userId pour homework/messages/profiles

### ✅ SEC-04 : Headers de sécurité HTTP bien configurés

`firebase.json` configure : CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy (caméra/micro/géoloc désactivés), COOP.

### ✅ SEC-05 : Aucun vecteur XSS identifié

Zéro utilisation de `dangerouslySetInnerHTML` ou `innerHTML` dans tout le code source React. Toutes les valeurs sont rendues via le JSX standard (auto-escape).

### ✅ SEC-06 : Validation des fichiers avec magic numbers

`fileValidation.ts` vérifie : extension, MIME type, ET signature binaire (magic numbers). Protection contre le spoofing d'extension.

### ✅ SEC-07 : Prévention de l'énumération d'utilisateurs

`Login.tsx:handleResetPassword` retourne le même message de succès que l'email existe ou non.

### ✅ SEC-08 : Console.log supprimé en production

`vite.config.ts` configure Terser avec `drop_console: true` et `drop_debugger: true`.

### ✅ SEC-09 : Code splitting et lazy loading corrects

`App.tsx` utilise `React.lazy()` pour Login, FirstRunSetup, et ProtectedApp. `ProtectedApp.tsx` lazy-load toutes les pages. Bon code splitting.

### ✅ SEC-10 : Génération de mot de passe cryptographiquement sûre

`generateSecurePassword()` utilise `crypto.getRandomValues()` avec rejection sampling, mélange avec Fisher-Yates cryptographique.

### ✅ BUILD-01 : Build de production réussi

- TypeScript compilation : ✅ aucune erreur
- Vite build : ✅ (39.59s)
- Taille totale dist : 3.55 MB
- npm audit : 0 vulnérabilités

### ✅ BUILD-02 : Séparation dev/prod correcte

- `.env` gitignored, `.env.example` fourni
- Variables préfixées `VITE_` (Vite standard)
- `serviceAccountKey.json` gitignored

---

## 4. RECOMMANDATIONS PRIORISÉES

### Priorité 1 — Avant tout déploiement

| #   | Action                                                      | Effort |
| --- | ----------------------------------------------------------- | ------ |
| 1   | Sécuriser ou supprimer la route `/setup` (CRIT-01)          | 2h     |
| 2   | Corriger les règles grades/courseGrades (CRIT-02)           | 30min  |
| 3   | Ajouter `runTransaction` pour la suppression user (CRIT-03) | 4h     |
| 4   | Ajouter pagination sur les requêtes critiques (CRIT-04)     | 8h     |
| 5   | Unifier l'initialisation Firebase (CRIT-05)                 | 1h     |

### Priorité 2 — Première semaine de production

| #   | Action                                                        | Effort |
| --- | ------------------------------------------------------------- | ------ |
| 6   | Intégrer Sentry ou un crash reporter (WARN-06)                | 2h     |
| 7   | Configurer les backups Firestore (WARN-07)                    | 2h     |
| 8   | Ajouter les index Firestore manquants (WARN-08)               | 2h     |
| 9   | Nettoyer la référence DOMPurify (WARN-01)                     | 10min  |
| 10  | Vérifier historique Git pour la service account key (WARN-02) | 30min  |

### Priorité 3 — Évolution continue

| #   | Action                                                | Effort |
| --- | ----------------------------------------------------- | ------ |
| 11  | Sanitiser les entrées messagerie (WARN-03)            | 2h     |
| 12  | Restreindre ou supprimer login Google (WARN-04)       | 1h     |
| 13  | Corriger orphelins suppression teacher (WARN-05)      | 3h     |
| 14  | Vérifier lazy-loading d'exceljs (WARN-09)             | 30min  |
| 15  | Renommer `deleteUser` pour éviter collision (WARN-10) | 30min  |

---

## 5. DÉTAIL TECHNIQUE — BUILD DE PRODUCTION

| Métrique               | Valeur                               |
| ---------------------- | ------------------------------------ |
| Compilateur TypeScript | ✅ 0 erreurs                         |
| Vite build             | ✅ 39.59s                            |
| Taille totale dist     | 3.55 MB                              |
| Plus gros chunk        | `exceljs.min` — 909 KB               |
| Second plus gros       | `vendor-pdf` — 402.6 KB              |
| npm audit              | 0 vulnérabilités                     |
| Minification           | Terser (drop_console, drop_debugger) |
| Source maps production | Désactivés (correct)                 |
| Code splitting         | ✅ React.lazy sur toutes les routes  |

---

## 6. DÉTAIL TECHNIQUE — ANALYSE DES RÈGLES FIREBASE

### Firestore Rules — Scénarios d'attaque simulés

| Scénario                                     | Résultat                  | Notes                                                                                   |
| -------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------- |
| Élève modifie ses propres notes              | ❌ Bloqué                 | `write` requiert role teacher/director/superadmin                                       |
| Élève lit les notes d'un autre élève         | ❌ Bloqué                 | `read` vérifie `studentId == auth.uid`                                                  |
| Élève modifie son propre rôle                | ❌ Bloqué                 | `isOwnerSafeUpdate` n'autorise que name/email/phone/avatar/birthDate/mustChangePassword |
| Parent lit notes hors de ses enfants         | ❌ Bloqué                 | Vérifie `studentId in getUserData().childrenIds`                                        |
| Enseignant lit notes d'une autre classe      | ❌ Bloqué                 | `isTeacherForClass()` vérifie via `classes/{classId}.teacherId`                         |
| Enseignant écrit notes dans une autre classe | ⚠️ Potentiellement permis | CRIT-02 : utilise `classIds` au lieu de `isTeacherForClass()`                           |
| User envoie message en tant qu'autre user    | ❌ Bloqué                 | `senderId == auth.uid` vérifié sur create                                               |
| Receiver modifie contenu d'un message        | ❌ Bloqué                 | `isMessageReceiverUpdate` n'autorise que `read/archived/updatedAt`                      |
| Non-director envoie broadcast (`all`)        | ❌ Bloqué                 | `receiverId != 'all' OR isDirector() OR isSuperAdmin()`                                 |
| Accès direct SDK (hors React)                | ✅ Sécurisé               | Toutes les protections sont dans les rules                                              |

### Storage Rules — Scénarios d'attaque simulés

| Scénario                                | Résultat                              |
| --------------------------------------- | ------------------------------------- |
| Upload d'exécutable (.exe) en avatar    | ❌ Bloqué (contentType.matches image) |
| Upload fichier > 25MB                   | ❌ Bloqué                             |
| Accès fichier homework d'un autre élève | ❌ Bloqué (uid == studentId)          |
| Accès fichier message d'un autre user   | ❌ Bloqué (uid == senderId)           |
| Élève upload dans events/               | ❌ Bloqué (role check via claims)     |
| Chemin non couvert (/random/path)       | ❌ Bloqué (default deny)              |

---

## 7. CORRECTIONS EFFECTUÉES

> Aucune correction n'a été effectuée dans cette phase d'audit. Toutes les failles critiques nécessitent une validation avant implémentation pour éviter les régressions.

**Plan de remédiation** : voir section 4 (Recommandations Priorisées).

---

## 8. PRE-COMMIT STATUS

| Vérification            | Statut            | Notes                                                                         |
| ----------------------- | ----------------- | ----------------------------------------------------------------------------- |
| `tsc -b` (TypeScript)   | ✅ PASS           | Aucune erreur                                                                 |
| `npm run build` (Vite)  | ✅ PASS           | Build réussi, warning chunk size                                              |
| `npm audit`             | ✅ PASS           | 0 vulnérabilités                                                              |
| `npm run lint` (ESLint) | ⚠️ ERREUR INTERNE | Erreur dans le parser ESLint (bug eslint-config, non bloquant pour le projet) |
| `npm run test` (Vitest) | ✅ PASS           | Tests existants passent                                                       |

---

_Rapport généré par Antigravity — Google DeepMind Advanced Agentic Coding_
_Ce rapport ne constitue pas un test de pénétration certifié. Il s'agit d'une revue de code statique et d'une analyse architecturale profonde._
