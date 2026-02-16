# Documentation Technique - SmartSchool

Bienvenue dans la documentation technique complète du projet **SmartSchool**.
Cette documentation a pour but de fournir une compréhension approfondie de l'architecture, du code, des flux de données et des bonnes pratiques de développement.

## 📚 Table des Matières

### 1. 🏗️ Architecture & Structure
Comprendre les fondations techniques du projet.
*   [Vue d'ensemble de l'Architecture](architecture/overview.md) : Stack technique, organisation des dossiers, et patterns principaux.
*   [Structure des Dossiers](architecture/overview.md#📂-structure-des-dossiers) : Rôle de chaque répertoire.

### 2. 🗄️ Base de Données & Données
Modèle de données Firestore et gestion de la sécurité.
*   [Schéma de Données](database/schema.md) : Collections, Documents et Relations.
*   [Règles de Sécurité](database/security.md) : Analyse des règles Firestore (`firestore.rules`).

### 3. 🧠 Gestion d'État (Contexts)
Comment l'application gère les données globales et l'authentification.
*   [AuthContext](contexts/auth.md) : Gestion de la session utilisateur.
*   [DataContext](contexts/data.md) : Hub de données centralisé et abonnements temps réel.

### 4. ⚙️ Services & API
Couche d'interaction avec Firebase.
*   [Vue d'ensemble des Services](services/overview.md) : Patterns CRUD et gestion des erreurs.
*   [Services Principaux](services/core_services.md) : Analyse détaillée des fonctions critiques.

### 5. 🎣 Hooks Personnalisés
Logique métier réutilisable.
*   [Hooks Documentation](hooks/overview.md) : `useDashboard`, `useGradeStats`, etc.

### 6. 🔄 Flux Métier (Flows)
Séquences d'opérations critiques.
*   [Flux Critiques](flows/critical_paths.md) : Login, Saisie de Notes, Soumission de Devoirs.

### 7. 🔒 Sécurité & Audit
Analyse des vulnérabilités et recommandations.
*   [Audit de Sécurité](security/audit.md) : Points faibles et actions correctives.

---

## 🚀 Pour Commencer

### Prérequis
*   Node.js (v18+)
*   npm ou bun

### Installation
```bash
npm install
# ou
bun install
```

### Lancer le Développement
```bash
npm run dev
# ou
bun run dev
```

### Tests
```bash
npm run test
```

---

## 📝 État du Projet

*   **Statut** : En développement actif.
*   **Dette Technique** : Moyenne. Attention particulière requise sur la performance des Contexts et la sécurité côté client.
