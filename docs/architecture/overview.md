# Vue d'ensemble de l'Architecture

Ce document décrit l'architecture technique de haut niveau du projet SmartSchool.

## 🏗️ Architecture Globale

Le projet est une **Single Page Application (SPA)** construite avec **React** et **TypeScript**, utilisant **Firebase** comme backend-as-a-service (BaaS).

L'architecture suit une approche **modulaire basée sur les composants**, avec une gestion d'état centralisée via l'API Context de React et une couche de service distincte pour les interactions avec la base de données.

### Diagramme d'Architecture (Flux de Données)

Ce diagramme illustre les interactions entre l'interface utilisateur (UI), la gestion d'état (State), les services et le backend (Firebase).

```text
+-----------------------------------------------------------------------------------+
|                                 CLIENT (Browser)                                  |
|                                                                                   |
|  +---------------------+        +---------------------+      +-----------------+  |
|  |     UI LAYER        | <----- |     STATE LAYER     | <--- |  SERVICE LAYER  |  |
|  | (Components/Pages)  |        | (React Context API) |      | (API Wrappers)  |  |
|  +----------+----------+        +----------+----------+      +--------+--------+  |
|             |                              |                          |           |
|             |  User Action (Click)         |                          |           |
|             +----------------------------> |  addGrade()              |           |
|                                            +------------------------> |           |
|                                            |                          | create()  |
|             |  Data Update (Props)         |  State Change            |           |
|             | <--------------------------- + <----------------------- |           |
|             |                              |                          |           |
+-------------+------------------------------+--------------------------+-----------+
              |                              |                          |
              |                              |                          v
+-------------+------------------------------+--------------------------+-----------+
|                                 BACKEND (Cloud)                                   |
|                                                                                   |
|          +--------------------+                  +-----------------------+        |
|          |   AUTHENTICATION   | <--------------> |       FIRESTORE       |        |
|          |  (Identity/Login)  |                  | (NoSQL Database/Rules)|        |
|          +--------------------+                  +-----------+-----------+        |
|                                                              |                    |
|                                                              | Real-time Sync     |
|                                                              v (WebSocket)        |
+-----------------------------------------------------------------------------------+
```

## 🛠️ Stack Technique

| Technologie | Version | Rôle |
|-------------|---------|------|
| **React** | 19.x | Bibliothèque UI principale |
| **TypeScript** | 5.x | Typage statique et sécurité du code |
| **Vite** | 7.x | Build tool et serveur de développement (HMR) |
| **Firebase** | 12.x | Backend (Auth, DB, Storage) |
| **Tailwind CSS** | 3.x | Framework CSS utilitaire |
| **React Router** | 7.x | Routage côté client |
| **Vitest** | 4.x | Framework de test unitaire |
| **i18next** | 25.x | Internationalisation (FR/NL/AR) |

## 📂 Structure des Dossiers

L'organisation du code suit une séparation claire des responsabilités :

```
src/
├── components/     # Composants React réutilisables
│   ├── Auth/       # Composants liés à l'authentification (ex: ProtectedRoute)
│   ├── UI/         # Composants d'interface génériques (Card, Button, Loader)
│   ├── Layout/     # Structure de la page (Sidebar, Header)
│   └── ...         # Composants métier spécifiques (Grades, Schedule, etc.)
├── config/         # Configuration des services externes (Firebase)
├── context/        # États globaux (AuthContext, DataContext)
├── hooks/          # Hooks personnalisés (logique métier réutilisable)
├── locales/        # Fichiers de traduction (JSON)
├── pages/          # Vues principales de l'application (Router targets)
├── services/       # Couche d'accès aux données (API Firebase)
├── styles/         # Fichiers CSS globaux et thème
├── types/          # Définitions TypeScript (Interfaces, Types)
└── utils/          # Fonctions utilitaires pures (Date, PDF, Calculs)
```

## 🧩 Patterns de Conception

### 1. Context API comme State Manager
L'application n'utilise pas Redux ou Zustand. L'état global est géré par deux contextes principaux :
*   **AuthContext** : Gère l'utilisateur connecté et l'état de chargement de l'auth.
*   **DataContext** : Agit comme un "Hub de données". Il s'abonne aux collections Firestore nécessaires et distribue les données aux composants. Cela évite le prop-drilling et centralise la logique de synchronisation.

### 2. Service Layer Pattern
Les composants UI n'appellent jamais directement `firestore`. Toutes les opérations de base de données sont encapsulées dans le dossier `src/services/`.
*   **Avantage** : Séparation des préoccupations. Si la structure de la DB change, seul le service doit être mis à jour, pas l'UI.
*   **Exemple** : `services/users.ts` contient `createUser`, `getUserById`, `updateUser`.

### 3. Container/Presentational Pattern (Partiel)
Bien que non strict, on observe une séparation :
*   **Pages (`src/pages/`)** : Agissent souvent comme des conteneurs qui récupèrent les données via les hooks et les passent aux composants.
*   **Composants (`src/components/`)** : Se concentrent sur le rendu visuel.

### 4. Lazy Loading
Les routes principales sont chargées dynamiquement via `React.lazy()` et `Suspense` dans `App.tsx` pour optimiser le temps de chargement initial (Code Splitting).

## ⚠️ Dette Technique & Points d'Attention

*   **Gestion d'état** : Avec la croissance de l'application, `DataContext` pourrait devenir un goulot d'étranglement de performance (re-renders inutiles) car il contient beaucoup de données.
*   **Sécurité** : La validation des données repose fortement sur le client et les règles Firestore. Il n'y a pas de couche API intermédiaire (Cloud Functions) pour la validation métier complexe.
