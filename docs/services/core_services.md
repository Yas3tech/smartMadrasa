# Services Principaux : Analyse Détaillée

## 👤 `users.ts`

### `createUser`
Crée un nouvel utilisateur. Cette fonction est complexe car elle doit gérer l'authentification (Firebase Auth) ET le profil (Firestore).

**Processus :**
1.  **Auth** : Tente de créer l'utilisateur dans Firebase Auth avec l'email fourni.
    *   *Particularité* : Utilise une **application secondaire** (`initializeSecondaryApp`) pour éviter de déconnecter l'admin actuel.
    *   Génère un mot de passe aléatoire sécurisé.
2.  **Firestore** : Crée le document dans la collection `users`.
    *   L'ID du document est identique à l'UID Firebase Auth.
    *   Ajoute le flag `mustChangePassword: true`.
3.  **Email** : Envoie (tentative) un email de réinitialisation de mot de passe (ou le mot de passe généré, selon config).

**Erreurs Possibles :**
*   `auth/email-already-in-use` : L'email existe déjà. La fonction tente alors de récupérer l'utilisateur existant ou échoue.

### `subscribeToUsers`
Écoute les modifications de la collection `users` en temps réel.

**Paramètres :**
*   `callback`: Fonction appelée avec la liste des utilisateurs mise à jour.
*   `queries`: Tableau de filtres optionnels (`role`, `classId`).

**Logique de Fusion :**
Firestore ne permet pas les requêtes complexes avec plusieurs filtres `in` ou `OR`.
Pour contourner cela, `subscribeToUsers` exécute **plusieurs listeners en parallèle** (un par filtre) et fusionne les résultats côté client (`Map<id, User>`).

```mermaid
graph TD
    Client -->|Subscribe| UsersSvc
    UsersSvc -->|Query 1 (Teachers)| Firestore
    UsersSvc -->|Query 2 (Students Class A)| Firestore
    Firestore -->|Update 1| UsersSvc
    Firestore -->|Update 2| UsersSvc
    UsersSvc -->|Merge & Deduplicate| Client
```

---

## 🏫 `classes.ts`

### `subscribeToClasses`
Permet de s'abonner uniquement aux classes pertinentes pour l'utilisateur.

**Optimisation :**
Utilise l'opérateur `in` sur le champ spécial `documentId()` pour filtrer par ID.
Ceci évite de charger toute la collection `classes` inutilement.

```typescript
// Exemple de requête optimisée
query(collection(db, 'classes'), where(documentId(), 'in', classIds));
```

---

## 📝 `courseGrades.ts` (Nouveau Système de Notes)

Ce service remplace progressivement `grades.ts`.

### `subscribeToCourseGradesByStudentIds`
Récupère les notes pour une liste d'étudiants (ex: pour un parent avec plusieurs enfants).

**Limitation Firestore & Contournement :**
Firestore ne permet pas de trier (`orderBy`) sur un champ différent de celui utilisé dans un filtre d'égalité (`in`).
La fonction récupère donc les données **non triées** et effectue le tri par date (`sort`) côté client avant d'appeler le callback.
