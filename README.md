# SmartMadrasa 📚

**Application de gestion scolaire multiplateforme pour écoles religieuses**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.7-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

---

## 📖 Description

SmartMadrasa est une application web complète de gestion scolaire, conçue spécifiquement pour les écoles religieuses. Elle permet aux directeurs, enseignants, parents et élèves de gérer tous les aspects de la vie scolaire : notes, présences, emplois du temps, messages, bulletins et bien plus.

### 🌍 Langues supportées
- 🇫🇷 Français
- 🇳🇱 Néerlandais
- 🇸🇦 Arabe (avec support RTL)

---

## 🛠️ Stack Technique

### Frontend
| Technologie | Version | Usage |
|-------------|---------|-------|
| **React** | 18.3 | Framework UI avec hooks |
| **TypeScript** | 5.6 | Typage statique |
| **Vite** | 6.0 | Build tool & dev server |
| **Tailwind CSS** | 3.4 | Styling utilitaire |
| **React Router** | 7.0 | Navigation SPA |
| **i18next** | 24.0 | Internationalisation |
| **Lucide React** | — | Icônes |
| **jsPDF** | — | Génération PDF |

### Backend (Firebase)
| Service | Usage |
|---------|-------|
| **Firebase Auth** | Authentification utilisateurs |
| **Cloud Firestore** | Base de données NoSQL temps réel |
| **Firebase Storage** | Stockage fichiers (ressources, pièces jointes) |

---

## 👥 Rôles Utilisateurs

### 🎓 Élève (Student)
- Consulter ses notes et moyennes
- Voir son emploi du temps
- Accéder aux devoirs assignés
- Soumettre des travaux en ligne
- Consulter son bulletin
- Recevoir des messages

### 👨‍👩‍👧 Parent
- Suivre les notes de ses enfants
- Consulter les présences/absences
- Communiquer avec les enseignants
- Recevoir les annonces
- Voir les bulletins

### 👨‍🏫 Enseignant (Teacher)
- Saisir les notes (individuelles ou en masse)
- Gérer les présences par cours
- Créer et assigner des devoirs
- Programmer des examens/évaluations
- Communiquer avec parents et élèves
- Valider les bulletins

### 🏫 Directeur (Director)
- Gérer les classes et emplois du temps
- Configurer les périodes académiques
- Superviser les bulletins
- Gérer les utilisateurs
- Accéder aux statistiques

### ⚙️ Super Admin
- Administration complète du système
- Gestion de la base de données
- Paramètres globaux
- Analytics avancés

---

## 📱 User Stories

### Élève
> *"En tant qu'élève, je veux voir mes notes récentes avec un indicateur visuel de ma performance pour comprendre rapidement où je me situe."*

> *"En tant qu'élève, je veux filtrer mes notes par matière pour me concentrer sur une discipline spécifique."*

### Parent
> *"En tant que parent, je veux recevoir des notifications quand mon enfant reçoit une nouvelle note pour suivre sa progression en temps réel."*

> *"En tant que parent de plusieurs enfants, je veux pouvoir basculer facilement entre les profils de mes enfants."*

### Enseignant
> *"En tant qu'enseignant, je veux saisir les notes de toute ma classe en une seule fois pour gagner du temps."*

> *"En tant qu'enseignant, je veux marquer un élève absent lors d'une évaluation et le noter plus tard."*

### Directeur
> *"En tant que directeur, je veux importer des utilisateurs via Excel pour créer rapidement les comptes de rentrée."*

> *"En tant que directeur, je veux configurer les trimestres pour que le système de bulletins fonctionne correctement."*

---

## 🗄️ Structure Base de Données (Firestore)

### Collections Principales

```
firestore/
├── users/                  # Tous les utilisateurs (avec role)
├── classes/               # Classes/groupes
├── courses/               # Cours (horaires + enseignant)
├── grades/                # Notes individuelles
├── attendance/            # Présences
├── homework/              # Devoirs
├── submissions/           # Soumissions de devoirs
├── messages/              # Messages internes
├── events/                # Événements calendrier
├── academicPeriods/       # Trimestres/périodes
├── gradeCategories/       # Catégories de notes
├── courseGrades/          # Notes par cours (bulletins)
└── teacherComments/       # Commentaires bulletins
```

### Schéma des Types Principaux

#### User
```typescript
interface User {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'parent' | 'teacher' | 'director' | 'superadmin';
    avatar?: string;
    phone?: string;
    birthDate?: string;
}
```

#### Student (extends User)
```typescript
interface Student extends User {
    role: 'student';
    classId: string;        // Référence à la classe
    className?: string;     // Dénormalisé pour affichage
    parentId: string;       // Référence au parent
}
```

#### Grade
```typescript
interface Grade {
    id: string;
    studentId: string;
    subject: string;
    score: number;
    maxScore: number;
    type: 'exam' | 'homework' | 'participation' | 'evaluation';
    title?: string;
    date: string;
    feedback?: string;
    courseId?: string;
    classId?: string;
    teacherId?: string;
    status?: 'present' | 'absent';
}
```

#### Course
```typescript
interface Course {
    id: string;
    classId: string;
    teacherId: string;
    subject: string;
    dayOfWeek: number;      // 1 = Lundi, 7 = Dimanche
    startTime: string;      // "HH:mm"
    endTime: string;
    room?: string;
}
```

#### Attendance
```typescript
interface Attendance {
    id: string;
    date: string;
    studentId: string;
    status: 'present' | 'absent' | 'late';
    classId: string;
    courseId?: string;
    justification?: string;
    isJustified?: boolean;
}
```

---

## 🚀 Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Firebase

### Étapes

```bash
# 1. Cloner le repo
git clone https://github.com/Yas3tech/smartMadrasa.git
cd smartMadrasa

# 2. Installer les dépendances
npm install

# 3. Configurer Firebase
# Copier vos credentials dans src/config/firebase.ts

# 4. Lancer en développement
npm run dev

# 5. Build production
npm run build
```

### Variables d'environnement
Créer un fichier `.env.local` :
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## 📁 Structure du Projet

```
src/
├── components/          # Composants réutilisables
│   ├── Auth/           # Authentification
│   ├── Grades/         # Gestion des notes
│   ├── Layout/         # Mise en page (Sidebar, etc.)
│   ├── Schedule/       # Emploi du temps
│   ├── UI/             # Composants UI génériques
│   └── bulletin/       # Système de bulletins
├── context/            # Contextes React (Auth, Data)
├── hooks/              # Hooks personnalisés
├── pages/              # Pages par rôle
│   ├── admin/          # Pages admin
│   ├── auth/           # Login
│   ├── common/         # Pages communes
│   ├── director/       # Pages directeur
│   ├── student/        # Pages élève
│   └── teacher/        # Pages enseignant
├── services/           # Services Firebase (CRUD)
├── types/              # Définitions TypeScript
├── utils/              # Fonctions utilitaires
├── locales/            # Traductions (fr, nl, ar)
└── styles/             # CSS thème
```

📖 **Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) pour une documentation détaillée de chaque fichier.**

---

## 🎨 Thèmes

L'application supporte les thèmes clair et sombre via des variables CSS :
- Mode clair (par défaut)
- Mode sombre (toggle dans Settings)

---

## 📄 Fonctionnalités Principales

| Module | Description |
|--------|-------------|
| **Dashboard** | Vue d'ensemble avec statistiques selon le rôle |
| **Notes** | Saisie, consultation et export PDF |
| **Présences** | Marquage par cours avec justification |
| **Emploi du temps** | Vue jour/semaine avec modal de détails |
| **Devoirs** | Création, assignation et soumission en ligne |
| **Messages** | Messagerie interne entre utilisateurs |
| **Bulletins** | Génération PDF des bulletins par période |
| **Annonces** | Communication broadcast |
| **Ressources** | Partage de fichiers |
| **Calendrier** | Vue mensuelle des événements |

---

## 🧪 Scripts

```bash
npm run dev       # Serveur de développement
npm run build     # Build production
npm run preview   # Preview du build
npm run lint      # Linting ESLint
```

---

## 📞 Contact

Développé par **Yas3tech**

---

## 📜 License

MIT License - Voir [LICENSE](LICENSE) pour plus de détails.
