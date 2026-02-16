# Audit de Sécurité

Ce document présente une analyse de la posture de sécurité de l'application SmartSchool.

## 🛡️ Résumé

L'application suit de bonnes pratiques générales (RBAC, Firestore Rules, Authentication) mais présente des vulnérabilités liées à la confiance excessive accordée au client (Frontend).

## ✅ Points Forts

1.  **RBAC Strict (Role-Based Access Control)** :
    *   L'accès aux données est segmenté par rôle (`student`, `teacher`, `director`).
    *   Les règles Firestore (`firestore.rules`) empêchent un élève de modifier ses notes.
2.  **Protection des Profils** :
    *   La fonction `isOwnerSafeUpdate` dans les règles Firestore limite strictement les champs modifiables par l'utilisateur (nom, avatar), empêchant l'escalade de privilèges (modification du `role`).
3.  **Mots de Passe** :
    *   Les nouveaux utilisateurs sont créés avec un mot de passe aléatoire robuste (`generateSecurePassword` dans `users.ts`).

## ⚠️ Vulnérabilités & Risques

### 1. Validation des Données Manquante (Critique)
Les règles de sécurité vérifient **QUI** fait l'action, mais pas **CE QUE** contient l'action.
*   **Risque** : Un enseignant malveillant (ou un compte compromis) peut envoyer une note de `9999/20` ou une date dans le futur lointain.
*   **Correction** : Ajouter des validateurs de schéma dans `firestore.rules`.
    ```javascript
    allow create: if isTeacher()
      && request.resource.data.score >= 0
      && request.resource.data.score <= request.resource.data.maxScore;
    ```

### 2. Lecture Excessive des Utilisateurs
*   **Observation** : Tout utilisateur authentifié peut lire la collection `users` entière.
    ```javascript
    match /users/{userId} {
      allow read: if isAuthenticated();
    }
    ```
*   **Risque** : Un élève peut scrapper la liste complète des emails et noms de toute l'école.
*   **Correction** : Restreindre la lecture aux utilisateurs partageant la même classe ou aux professeurs.

### 3. Gestion des Secrets (.env)
*   **Observation** : Le fichier `.env.example` contient des clés d'API réelles et utilise une syntaxe JavaScript invalide pour un fichier d'environnement.
*   **Risque** : Exposition de configuration sensible.
*   **Correction** : Nettoyer `.env.example` et utiliser le format standard `VITE_KEY=VALUE`.

### 4. Performance & DoS
*   **Observation** : `DataContext` charge beaucoup de données au démarrage.
*   **Risque** : Avec 1000+ élèves, la connexion d'un Directeur pourrait télécharger plusieurs Mo de données, ralentissant l'application et augmentant les coûts Firestore.
*   **Correction** : Implémenter la pagination et le chargement à la demande (Lazy Loading) pour les listes d'utilisateurs et d'historique.

## 📋 Recommandations

### Court Terme
1.  **Corriger `.env.example`** pour ne contenir que des clés vides.
2.  **Renforcer `firestore.rules`** avec des validations de type et de plage (schema validation).
3.  **Auditer les paquets npm** : Mettre à jour `jspdf` (vulnérabilité connue).

### Moyen Terme
1.  **Backend (Cloud Functions)** : Déplacer la logique critique (création d'utilisateur, calcul de moyenne) vers un backend sécurisé.
2.  **Rate Limiting** : Activer App Check pour prévenir les abus d'API.
