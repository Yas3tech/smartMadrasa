# 🕌 SmartMadrasa

**Système de Gestion Scolaire Islamique** - Application web multilingue (FR/NL/AR) pour la gestion complète d'une école.

---

## 📋 Sommaire

1. [Présentation](#1-présentation)
2. [Technologies](#2-technologies)
3. [Architecture](#3-architecture)
4. [Installation](#4-installation)
5. [Structure du Projet](#5-structure-du-projet)
6. [Configuration](#6-configuration)
7. [Modules Fonctionnels](#7-modules-fonctionnels)
8. [Documentation Technique](#8-documentation-technique)

---

## 1. Présentation

SmartMadrasa est une plateforme complète de gestion scolaire offrant :

| Fonctionnalité    | Description                                         |
| ----------------- | --------------------------------------------------- |
| **Multi-rôles**   | Étudiant, Parent, Enseignant, Directeur, SuperAdmin |
| **Multilingue**   | Français, Néerlandais, Arabe (avec support RTL)     |
| **Temps réel**    | Synchronisation instantanée via Firebase            |
| **Bulletins PDF** | Génération automatique des bulletins scolaires      |
| **Mode sombre**   | Thème adaptatif clair/sombre                        |

---

## 2. Technologies

### Frontend

| Package      | Usage                |
| ------------ | -------------------- |
| React 19     | Framework UI         |
| TypeScript   | Typage statique      |
| Tailwind CSS | Styles utility-first |
| Vite         | Build tool           |

### Backend (Firebase)

| Service   | Usage            |
| --------- | ---------------- |
| Auth      | Authentification |
| Firestore | Base de données  |
| Storage   | Fichiers         |

### Librairies

| Package          | Usage                |
| ---------------- | -------------------- |
| react-router-dom | Navigation           |
| i18next          | Internationalisation |
| jspdf            | Génération PDF       |
| recharts         | Graphiques           |
| lucide-react     | Icônes               |
| xlsx             | Export Excel         |

---

## 3. Architecture

Une documentation architecturale détaillée est disponible dans le dossier `docs/`.

👉 **[Consulter la Vue d'ensemble de l'Architecture](docs/architecture/overview.md)**

### Points clés

*   **SPA (Single Page Application)** : React + Vite.
*   **State Management** : Context API (`AuthContext`, `DataContext`) agissant comme un "Hub de Données".
*   **Service Layer** : Abstraction complète des appels Firebase dans `src/services/`.
*   **Real-time** : Utilisation intensive de `onSnapshot` pour la synchronisation.

---

## 4. Installation

```bash
# 1. Cloner
git clone <repo-url>
cd smartschool

# 2. Installer
npm install

# 3. Configurer
cp .env.example .env
# Éditer .env avec vos credentials Firebase

# 4. Lancer
npm run dev
```

---

## 5. Structure du Projet

```
src/
├── config/
│   └── firebase.ts          # Configuration Firebase
│
├── context/
│   ├── AuthContext.tsx      # Gestion authentification
│   └── DataContext.tsx      # État global des données
│
├── services/                 # 18 services CRUD
│   ├── users.ts
│   ├── classes.ts
│   ├── grades.ts
│   ├── attendance.ts
│   ├── messages.ts
│   ├── events.ts
│   ├── courses.ts
│   ├── homework.ts
│   └── ...
│
├── types/
│   ├── index.ts             # Types principaux
│   └── bulletin.ts          # Types bulletins
│
├── components/
│   ├── UI/                  # Card, Button, Modal, Input
│   ├── Layout/              # MainLayout, Sidebar
│   ├── Grades/              # Vues des notes
│   ├── Schedule/            # Modales emploi du temps
│   └── bulletin/            # Aperçu bulletins
│
├── pages/
│   ├── auth/Login.tsx
│   ├── common/              # Dashboard, Messages, Schedule...
│   ├── admin/               # Users, Analytics, Settings
│   ├── director/            # Classes, BulletinDashboard
│   ├── teacher/             # Grades, Attendance
│   └── student/             # StudentBulletin
│
├── locales/                 # Traductions FR/NL/AR
├── hooks/                   # useGradeStats
├── utils/                   # pdfGenerator, gradeReports
└── styles/                  # theme.css
```

---

## 6. Configuration

### Variables d'environnement (.env)

```env
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

---

## 7. Modules Fonctionnels

Pour plus de détails sur les flux métiers, consultez :
👉 **[Flux Critiques et Workflows](docs/flows/critical_paths.md)**

### 7.1 Authentification

Supporte les rôles multiples (Student, Teacher, Director, Admin) avec redirection automatique vers le dashboard approprié.

### 7.2 Gestion des Notes

Système complet de saisie de notes, consultation par élèves/parents, et génération de bulletins.

### 7.3 Emploi du Temps

Gestion des cours, examens, et événements spéciaux.

---

## 8. Documentation Technique

La documentation complète est disponible dans le dossier `docs/`.

📚 **[Accéder à la Documentation Technique Complète](docs/README.md)**

### Sections Disponibles :

*   **[Architecture](docs/architecture/overview.md)** : Vue d'ensemble, stack technique, diagrammes de flux.
*   **[Base de Données](docs/database/schema.md)** : Schéma Firestore, collections, relations.
*   **[Sécurité](docs/database/security.md)** : Règles Firestore, rôles et permissions.
*   **[Services](docs/services/overview.md)** : Couche d'accès aux données.
*   **[Contexts](docs/contexts/data.md)** : Gestion d'état global.
*   **[Flux de Données](docs/flows/data_lifecycle.md)** : Comprendre le cycle de vie des données.
*   **[Audit de Sécurité](docs/security/audit.md)** : Analyse des risques et correctifs appliqués.

---

## 🧪 Commandes

```bash
npm run dev      # Développement
npm run build    # Production
npm run preview  # Aperçu build
npm run lint     # Vérification code
npm run test     # Tests unitaires
```

---

## 📄 Licence

Développé pour un usage éducatif.

---

**Développé avec ❤️ pour l'éducation**
