# Audit de Sécurité

Ce document présente une analyse de la posture de sécurité de l'application SmartSchool.

## 🛡️ Résumé

L'application suit de bonnes pratiques générales (RBAC, Firestore Rules, Authentication).
Suite à l'audit initial, plusieurs vulnérabilités critiques ont été **corrigées**.

## ✅ Points Forts

1.  **RBAC Strict (Role-Based Access Control)** :
    *   L'accès aux données est segmenté par rôle (`student`, `teacher`, `director`).
    *   Les règles Firestore (`firestore.rules`) empêchent un élève de modifier ses notes.
2.  **Protection des Profils** :
    *   La fonction `isOwnerSafeUpdate` dans les règles Firestore limite strictement les champs modifiables par l'utilisateur (nom, avatar), empêchant l'escalade de privilèges (modification du `role`).
3.  **Mots de Passe** :
    *   Les nouveaux utilisateurs sont créés avec un mot de passe aléatoire robuste (`generateSecurePassword` dans `users.ts`).
4.  **Validation des Données (Nouveau)** :
    *   Les notes sont désormais validées côté serveur (`0 <= score <= maxScore`).

## ⚠️ Vulnérabilités & Risques (Mise à Jour)

### 1. Validation des Données Manquante
*   **Statut : CORRIGÉ** ✅
*   Les règles `firestore.rules` incluent maintenant la fonction `isValidGrade()` qui rejette toute écriture de note invalide.

### 2. Lecture Excessive des Utilisateurs
*   **Statut : CORRIGÉ** ✅
*   Les règles de lecture sur `users/{userId}` ont été durcies. Un utilisateur ne peut voir que :
    *   Son propre profil.
    *   Les membres du personnel (Teachers, Directors).
    *   Ses camarades de classe (si c'est un élève).

### 3. Gestion des Secrets (.env)
*   **Statut : CORRIGÉ** ✅
*   Le fichier `.env.example` a été nettoyé de toute clé réelle.

### 4. Performance & DoS
*   **Statut : EN COURS** ⚠️
*   `DataContext` charge encore beaucoup de données au démarrage.
*   **Correction Recommandée** : Implémenter la pagination et le chargement à la demande (Lazy Loading).

## 📋 Recommandations

### Court Terme
1.  **Auditer les paquets npm** : Mettre à jour `jspdf` (vulnérabilité connue).

### Moyen Terme
1.  **Backend (Cloud Functions)** : Déplacer la logique critique (création d'utilisateur, calcul de moyenne) vers un backend sécurisé.
2.  **Rate Limiting** : Activer App Check pour prévenir les abus d'API.
