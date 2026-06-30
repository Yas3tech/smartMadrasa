# smartMadrasa — Documentation de Référence

> Document principal. Point d'entrée unique pour tout développeur (humain ou IA) qui rejoint ce projet.
> Dernière mise à jour : 2026-06-30

---

## Qu'est-ce que smartMadrasa ?

**smartMadrasa** est une application web de gestion scolaire destinée aux écoles islamiques (madrasas). Elle permet de gérer les élèves, les notes, les présences, les devoirs, les bulletins et la communication entre les différents acteurs de l'école.

L'application est disponible en **3 langues** : Français (défaut), Arabe (RTL), Néerlandais.

### Qui utilise l'application ?

| Rôle | Accès | Ce qu'il peut faire |
|------|-------|---------------------|
| `superadmin` | Tout | Administration complète, création directeur, paramètres système |
| `director` | Tout l'établissement | Gestion classes/élèves, configuration, bulletins, vue absences, analytics |
| `teacher` | Ses classes uniquement | Saisie notes, présences, devoirs, bulletins pour ses cours |
| `student` | Ses propres données | Voir ses notes, devoirs, planning, bulletin |
| `parent` | Données de ses enfants | Voir notes/absences de ses enfants, messagerie avec profs |

---

## Démarrage rapide

```bash
# Installer les dépendances
npm install

# Lancer en développement (http://localhost:5173)
npm run dev

# Vérifier les types TypeScript (doit retourner vide = aucune erreur)
npx tsc --noEmit

# Lancer les tests
npm run test

# Build de production
npm run build
```

**Variables d'environnement** : Copier `.env.example` → `.env` et remplir avec les clés Firebase du projet Firebase console.

---

## Stack technique

| Technologie | Version | Rôle |
|------------|---------|------|
| React | 19.x | Framework UI |
| TypeScript | 5.x | Typage statique (strict) |
| Vite | 7.x | Build tool + HMR |
| Firebase Auth | 12.x | Authentification |
| Firestore | 12.x | Base de données NoSQL temps réel |
| Firebase Storage | 12.x | Stockage fichiers (ressources, avatars) |
| Tailwind CSS | 3.x | Styles utilitaires |
| React Router | 7.x | Routing côté client |
| react-i18next | 25.x | Internationalisation (FR/NL/AR) |
| lucide-react | — | Icônes SVG |
| exceljs | 4.4+ | Export Excel (absences, notes) |
| react-hot-toast | — | Notifications toast |
| Vitest | 4.x | Tests unitaires |

---

## Architecture générale

L'application est une **Single Page Application (SPA)** sans backend propre. Firebase est le backend complet (Auth + DB + Storage). Il n'y a pas de serveur intermédiaire ni d'API REST custom.

```
Browser (React SPA)
│
├── AuthContext          → Session utilisateur (Firebase Auth + profil Firestore)
│
├── Context slices       → État global en temps réel (onSnapshot)
│   ├── UserContext      → users, students
│   ├── AcademicContext  → classes, courses, academicPeriods, gradeCategories
│   ├── CommunicationContext → messages, events
│   └── PerformanceContext   → grades, attendance, homeworks
│
├── Hooks personnalisés  → Logique métier (useTeacherGrades, useDashboard, ...)
│
├── Services (src/services/) → Seul endroit qui touche à Firestore directement
│
└── Pages / Composants   → UI pure, consomment les contextes et hooks
                                ↕ WebSocket temps réel
                           Firebase Cloud (Firestore + Auth + Storage)
```

**Règle clé** : Les composants et pages **n'appellent jamais Firestore directement**. Tout passe par les services (`src/services/*.ts`), qui sont appelés par les contextes ou les hooks.

---

## Structure des dossiers

```
src/
├── App.tsx                 # Router principal + lazy loading des pages
├── main.tsx                # Point d'entrée React + i18n
├── i18n.ts                 # Config internationalisation
│
├── config/
│   └── firebase.ts         # Initialisation Firebase (clés depuis .env)
│
├── context/
│   ├── AuthContext.tsx      # Session, login, logout, user enrichi
│   ├── DataContext.tsx      # Re-exporte les hooks de tous les slices
│   └── slices/
│       ├── UserContext.tsx
│       ├── AcademicContext.tsx
│       ├── CommunicationContext.tsx
│       └── PerformanceContext.tsx
│
├── hooks/
│   ├── useTeacherGrades.ts  # Logique complète de la page Grades (états + handlers)
│   ├── useDashboard.ts      # Calculs statistiques Dashboard
│   ├── useHomework.ts       # CRUD devoirs + upload fichiers
│   └── ...
│
├── services/               # Couche accès données Firebase
│   ├── courseGrades.ts     # Notes système bulletin (ACTIF)
│   ├── [grades.ts supprimé] # Notes legacy — migration terminée, fichier supprimé
│   ├── attendance.ts
│   ├── classes.ts
│   ├── courses.ts
│   ├── users.ts
│   ├── messages.ts
│   ├── homework.ts
│   ├── events.ts
│   ├── academicPeriods.ts
│   ├── teacherComments.ts
│   └── firebaseHelper.ts   # Utilitaires (mapQuerySnapshot, getDb)
│
├── pages/
│   ├── auth/Login.tsx
│   ├── common/             # Dashboard, Messages, Schedule, Calendar, ...
│   ├── teacher/            # Grades, Attendance, BulletinGrades
│   ├── director/           # Classes, AcademicYearConfig, BulletinDashboard
│   ├── student/            # StudentBulletin
│   └── admin/              # Users, Analytics, Settings, DatabaseAdmin
│
├── components/
│   ├── UI/                 # Button, Card, Modal, Input, ...
│   ├── Layout/             # Sidebar, MainLayout, NotificationBell
│   ├── Auth/               # ProtectedRoute
│   ├── Grades/             # GradeModal, BulkGradeModal, TeacherGradesView, ...
│   ├── Attendance/         # TeacherAttendance, DirectorAttendanceView, ...
│   ├── Schedule/           # ExamModal, HomeworkDetailModal, ...
│   └── bulletin/           # BulletinPreview, ClassBulletinListModal
│
├── types/
│   ├── index.ts            # Tous les types principaux (User, Grade, Course, ...)
│   └── bulletin.ts         # Types système bulletins (AcademicPeriod, CourseGrade, ...)
│
├── locales/
│   ├── fr/translation.json # Français (langue par défaut)
│   ├── ar/translation.json # Arabe (RTL)
│   └── nl/translation.json # Néerlandais
│
├── utils/
│   ├── academic.ts         # getRelevantPeriodIds()
│   ├── gradeReports.ts     # Génération PDF bulletins
│   └── lang.ts             # Helpers RTL / détection langue
│
└── styles/
    └── theme.css           # Variables CSS thème clair/sombre
```

---

## Modèle de données Firestore

Firestore est NoSQL orienté documents. Les collections principales sont :

### Collections racine

| Collection | Description | Clé importante |
|-----------|-------------|----------------|
| `users` | Tous les utilisateurs. Le champ `role` définit le type. | `role`, `classId` (élèves), `childrenIds` (parents) |
| `classes` | Groupes d'élèves (ex: "MAT1"). | `teacherId` (prof principal) |
| `courses` | Cours dans l'emploi du temps. | `classId`, `teacherId`, `subject`, `dayOfWeek` (1=Lundi, 7=Dimanche ISO) |
| `courseGrades` | Notes des élèves — **système actif**. | `studentId`, `courseId`, `classId`, `periodId`, `score`, `maxScore` |
| `attendance` | Présences/absences. | `studentId`, `classId`, `status` (`present`/`absent`/`late`/`justified`) |
| `homeworks` | Devoirs assignés. | `classId`, `subject`, `dueDate` |
| `messages` | Messagerie interne. | `senderId`, `receiverId` (`'all'` = broadcast) |
| `events` | Événements calendrier (examens, évaluations). | `classId`, `type`, `start` |
| `academicPeriods` | Trimestres/semestres. | `startDate`, `endDate`, `gradeEntryStartDate`, `gradeEntryEndDate` (ISO strings) |
| `gradeCategories` | Types de notes avec pondération. | `name`, `weight` |
| `teacherComments` | Appréciations prof dans les bulletins. | `studentId`, `periodId`, `courseId` |
| `announcements` | Annonces globales. | — |

### Système de notes : deux collections coexistent

**Attention** : Il existe deux systèmes de notes dans le code.

```
courseGrades.ts   → collection courseGrades              (ACTIF, système bulletin)
[grades.ts supprimé — migration terminée]
```

Tout nouveau développement doit utiliser `courseGrades`. Le `DataContext` (via `PerformanceContext`) convertit automatiquement les `Grade` (ancien format) en `CourseGrade` avant l'envoi à Firestore.

**Piège connu** : `addDoc()` Firestore rejette les valeurs `undefined`. Toujours utiliser un spread conditionnel pour les champs optionnels :
```ts
...(grade.eventId !== undefined ? { eventId: grade.eventId } : {})
```

---

## Gestion d'état : Context slices

Le `DataContext` original a été **découpé en 4 slices** pour éviter les re-renders inutiles :

```ts
// Utilisation dans les composants — toujours importer le hook le plus spécifique
import { useUsers, useAcademics, usePerformance, useCommunication } from '../context/DataContext';
// Ne pas utiliser l'ancien useData() — il existe encore pour compatibilité mais est déprécié
```

| Hook | Expose | Slice |
|------|--------|-------|
| `useAuth()` | `user`, `logout` | AuthContext |
| `useUsers()` | `students`, `users` | UserContext |
| `useAcademics()` | `classes`, `courses`, `academicPeriods`, `gradeCategories` | AcademicContext |
| `usePerformance()` | `grades`, `attendance`, `homeworks`, `addGrade`, `addGradesBatch`, `markAttendance` | PerformanceContext |
| `useCommunication()` | `messages`, `events`, `homeworks` | CommunicationContext |

---

## Workflow : Saisie de notes

Flux complet depuis le clic jusqu'à Firestore :

```
1. UI (TeacherGradesView)
   → ouvre BulkGradeModal ou GradeModal

2. Modal (BulkGradeModal / GradeModal)
   → onSave(gradesData) avec score, maxScore, date (ISO), subject

3. useTeacherGrades.handleBulkSave() ou handleIndividualGradeSave()
   → ajoute teacherId, classId, courseId (lookup dans courses)
   → appelle addGradesBatch() ou addGrade() du PerformanceContext

4. PerformanceContext.addGrade()
   → cherche la AcademicPeriod correspondant à la date de la note
   → si non trouvée : fallback sur la période la plus récente
   → convertit Grade → CourseGrade (avec periodId, categoryId, etc.)
   → NE JAMAIS inclure undefined dans l'objet (Firestore le rejette)
   → appelle fbCreateCourseGrade() du service

5. courseGrades.ts (service)
   → addDoc(collection(db, 'courseGrades'), courseGrade)

6. Firestore Rules
   → vérifie isDirector() || isSuperAdmin() || (isTeacher() && isTeacherForClass(classId))
   → vérifie isValidGrade() : score >= 0 && score <= maxScore
   → si refusé : Firebase lance une erreur → catch → toast.error(error.message)

7. onSnapshot réactif
   → toutes les instances de l'app reçoivent la mise à jour en temps réel
```

---

## Workflow : Bulletins

```
1. Director crée des AcademicPeriods (trimestres) dans /bulletins/config
2. Teacher entre des CourseGrades via /bulletins/grades (BulletinGrades.tsx)
   + ajoute un TeacherComment par élève/matière/période
3. Director valide et publie via BulletinDashboard.tsx
4. Élève consulte son bulletin via /bulletins/view (StudentBulletin.tsx)
```

---

## Workflow : Présences (Attendance)

```
Page /attendance → src/pages/teacher/Attendance.tsx

Si director/superadmin :
  - Onglet "Vue générale" → DirectorAttendanceView (stats + export Excel)
  - Onglet "Marquer présence" → TeacherAttendance (tous les cours, filtre par classe)

Si teacher :
  - Directement TeacherAttendance (ses cours du jour uniquement)

Si student/parent :
  - StudentAttendance (son historique)
```

**Important** : `dayOfWeek` dans les courses suit le standard ISO : 1=Lundi, 7=Dimanche. Ce n'est PAS le standard JavaScript (0=Dimanche). La conversion se fait dans `TeacherAttendance.tsx` : `day === 0 ? 7 : day`.

---

## Sécurité : Firestore Rules

Le fichier `firestore.rules` applique le RBAC côté serveur. Quelques points clés :

- `isTeacherForClass(classId)` : vérifie dans Firestore que `classes/{classId}.teacherId == request.auth.uid`. Ne pas utiliser `user.classIds` (non fiable).
- `isValidGrade()` : vérifie `0 <= score <= maxScore` avant toute écriture de note.
- `isOwnerSafeUpdate()` : empêche un utilisateur de changer son propre `role` ou `classId`.
- Les règles `create` et `update` sont **séparées** depuis le fix IDOR (commit 80f6fb3).

**Règle critique update CourseGrades** :
```
allow update: if (isDirector() || isSuperAdmin() || 
  (isTeacher() && isTeacherForClass(resource.data.classId) && 
   request.resource.data.classId == resource.data.classId)) && isValidGrade();
```
La condition `request.resource.data.classId == resource.data.classId` empêche un prof de réassigner une note à une autre classe.

---

## Internationalisation (i18n)

- 3 langues : `fr` (défaut), `ar` (RTL), `nl`
- Clés dans `src/locales/{lang}/translation.json`
- Hook : `const { t } = useTranslation()`
- Direction RTL : automatique pour l'arabe via classe CSS sur `<html>`

**Règle obligatoire** : toute nouvelle clé d'interface doit être ajoutée dans les **3 fichiers** simultanément. Une clé manquante affiche le nom de la clé brut à l'utilisateur (ex: `grades.subject` s'il manque).

Structure des clés :
```
common.*      → labels génériques (Enregistrer, Annuler, ...)
grades.*      → tout ce qui concerne les notes
attendance.*  → présences (section attendance_teacher.*)
classes.*     → gestion des classes
bulletins.*   → système de bulletins
...
```

---

## Ajouter une fonctionnalité : guide rapide

### Nouvelle page

1. Créer `src/pages/{role}/MaPage.tsx`
2. Ajouter la route dans `src/App.tsx` (avec `React.lazy`)
3. Ajouter le lien dans `src/components/Layout/Sidebar.tsx` sous `getLinks()`
4. Protéger par rôle si nécessaire

### Nouveau champ en base

1. Ajouter le champ dans le type TypeScript (`src/types/index.ts` ou `bulletin.ts`)
2. Mettre à jour le service concerné dans `src/services/`
3. Vérifier les règles Firestore si besoin (`firestore.rules`)
4. **Ne jamais passer `undefined` à Firestore** — utiliser spread conditionnel ou omettre le champ

### Nouveau texte UI

1. Ajouter la clé dans `src/locales/fr/translation.json`
2. Ajouter la même clé (traduite) dans `ar/translation.json` et `nl/translation.json`
3. Utiliser `t('section.clé')` dans le composant

---

## Gestion des erreurs

Les fonctions de sauvegarde (`handleBulkSave`, `handleIndividualGradeSave`, etc.) affichent maintenant le **message d'erreur réel** dans le toast et loggent dans la console :

```ts
} catch (error) {
  console.error('[Grade save error]', error);
  const msg = error instanceof Error ? error.message : t('grades.saveError');
  toast.error(msg, { duration: 6000 });
}
```

Si vous voyez une erreur Firebase dans le toast, les messages courants sont :
- `"Missing or insufficient permissions"` → règles Firestore bloquent l'écriture
- `"Unsupported field value: undefined"` → un champ est `undefined` dans l'objet envoyé
- `"Aucune période académique configurée"` → aucune AcademicPeriod en base

---

## Suivi des modifications

Toute modification du code doit être notée dans [DEVLOG.md](../DEVLOG.md) à la racine du projet.
Format : date, fichiers touchés, raison du changement.

---

## Index de toute la documentation

### Documentation technique (ce dossier `docs/`)

| Document | Contenu |
|----------|---------|
| [docs/README.md](README.md) | **Ce fichier** — référence principale |
| [docs/ARCHITECTURE.md](ARCHITECTURE.md) | Vue détaillée de chaque fichier source avec tableaux |
| [docs/architecture/overview.md](architecture/overview.md) | Stack, structure dossiers, patterns de conception |
| [docs/database/schema.md](database/schema.md) | Schéma Firestore complet, relations, dénormalisation |
| [docs/contexts/auth.md](contexts/auth.md) | AuthContext : flux login, API exposée, cas limites |
| [docs/contexts/data.md](contexts/data.md) | DataContext (hub de données), slices, stratégie souscription |
| [docs/services/overview.md](services/overview.md) | Patterns services, dualité grades/courseGrades |
| [docs/services/core_services.md](services/core_services.md) | Analyse détaillée des services critiques |
| [docs/hooks/overview.md](hooks/overview.md) | useTeacherGrades, useDashboard, useHomework |
| [docs/flows/critical_paths.md](flows/critical_paths.md) | Flux login, saisie notes, soumission devoirs (diagrammes ASCII) |
| [docs/flows/data_lifecycle.md](flows/data_lifecycle.md) | Cycle de vie des données, subscription vs requête unique |
| [docs/security/audit.md](security/audit.md) | Audit sécurité, vulnérabilités corrigées, recommandations |

### Fichiers pour les IA et le suivi

| Fichier | Contenu |
|---------|---------|
| [DEVLOG.md](../DEVLOG.md) | Journal chronologique de toutes les modifications du code |
| `.Jules/learnings.md` | Apprentissages de l'agent Jules (si utilisé) |
| `~/.claude/projects/.../memory/` | Mémoire persistante de l'agent Claude (contexte projet) |

---

## État du projet & dette technique

| Sujet | Statut | Notes |
|-------|--------|-------|
| Notes (courseGrades) | Stable | Seul système actif. `grades.ts` supprimé. |
| Bulletins | Stable | Flux complet director → teacher → élève |
| Présences directeur | Stable | Vue générale + export Excel |
| Internationalisation | Stable | 3 langues, RTL arabe |
| Tests | Partiel | Vitest configuré, couverture limitée |
| Performance Contexts | Améliorée | DataContext découpé en 4 slices. Peut encore optimiser |
| Cloud Functions | Absent | Toute la logique est côté client. Risque si règles Firestore mal configurées |
| Migration grades legacy | Terminé | `grades.ts` supprimé. Seul `courseGrades.ts` utilisé. |
