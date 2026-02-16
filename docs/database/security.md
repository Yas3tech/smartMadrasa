# Sécurité & Règles Firestore

Ce document analyse les règles de sécurité (`firestore.rules`) qui régissent l'accès aux données.
L'application utilise un modèle **RBAC (Role-Based Access Control)** strict.

## 🛡️ Principes Généraux

1.  **Authentification Requise** : Par défaut, aucune donnée n'est accessible publiquement (`request.auth != null`).
2.  **Séparation des Rôles** : Les permissions sont accordées en fonction du champ `role` dans le document `users` de l'utilisateur connecté.
3.  **Propriété des Données** : Un utilisateur ne peut modifier que ses propres données (sauf pour les Directeurs/Admins).

## 🔑 Rôles & Permissions

### `student` (Élève)
*   **Lecture** :
    *   Son propre profil (`users/{uid}`).
    *   Ses propres notes (`grades` où `studentId == uid`).
    *   Ses propres absences (`attendance`).
    *   Les devoirs de sa classe (`homework`).
    *   Son emploi du temps (`courses`).
*   **Écriture** :
    *   Aucune écriture sur les données académiques.
    *   Peut envoyer des messages (`messages`) à ses professeurs ou camarades (limité par logique UI, règles backend à renforcer).

### `parent` (Parent)
*   **Lecture** :
    *   Mêmes droits que l'élève, mais pour **tous ses enfants** (`childrenIds`).
    *   Exemple : `resource.data.studentId in getUserData().childrenIds`.
*   **Écriture** :
    *   Aucune écriture académique.
    *   Peut envoyer des messages aux professeurs/direction.

### `teacher` (Professeur)
*   **Lecture** :
    *   Toutes les données de ses classes assignées.
    *   Notes, absences, devoirs, événements.
*   **Écriture** :
    *   Créer/Modifier des notes (`grades`).
    *   Marquer des absences (`attendance`).
    *   Donner des devoirs (`homework`).
    *   Ajouter des événements (`events`).

### `director` / `superadmin`
*   **Accès Complet** : Lecture et écriture sur quasiment toutes les collections (`users`, `classes`, `courses`, etc.).
*   Peuvent gérer la configuration globale (années scolaires, périodes).

## 🔍 Analyse des Règles Critiques

### Protection des Utilisateurs (`users`)
```javascript
match /users/{userId} {
  allow read: if isAuthenticated();
  allow update: if isDirector() || isSuperAdmin() || isOwnerSafeUpdate(userId);
}
```
*   **Lecture** : Tout utilisateur connecté peut lire les profils de base (nécessaire pour la recherche/annuaire).
*   **Mise à jour Sécurisée** : La fonction `isOwnerSafeUpdate` empêche l'escalade de privilèges. Un utilisateur ne peut modifier que : `name`, `email`, `phone`, `avatar`, `birthDate`. Il ne peut **pas** changer son `role` ou sa `classId`.

### Protection des Notes (`grades`)
```javascript
match /grades/{gradeId} {
  allow read: if isAuthenticated() && (
    resource.data.studentId == request.auth.uid ||
    (isParent() && resource.data.studentId in getUserData().childrenIds) ||
    isTeacher() ||
    isDirector()
  );
  allow write: if isTeacher() || isDirector();
}
```
*   Assure la confidentialité des résultats scolaires. Un élève ne peut voir que ses propres notes.

## ⚠️ Points d'Attention & Risques Identifiés

1.  **Messages en Broadcast** :
    *   Actuellement, un utilisateur peut lire un message si `receiverId == 'all'`.
    *   La création de messages broadcast est restreinte aux Directeurs/Admins, ce qui est correct.

2.  **Validation des Données** :
    *   Les règles vérifient les *permissions* mais peu la *validité des données* (ex: un professeur peut techniquement mettre une note de 25/20 si le client l'autorise).
    *   **Amélioration** : Ajouter des validateurs de schéma (ex: `request.resource.data.score >= 0 && request.resource.data.score <= resource.data.maxScore`).

3.  **Lecture Large** :
    *   `match /users/{userId} { allow read: if isAuthenticated(); }` permet à n'importe quel élève de lister tous les utilisateurs de l'école.
    *   **Amélioration** : Restreindre la lecture aux membres de sa classe ou à ses professeurs uniquement.
