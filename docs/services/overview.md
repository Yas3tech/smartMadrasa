# Couche de Services (API)

La couche de services (`src/services/`) sert d'interface entre l'application React et Firebase Firestore.
Elle isole toute la logique de base de données, permettant aux composants UI de rester agnostiques de l'implémentation backend.

## 🏗️ Patterns Architecturaux

### 1. Fonctions Standalone
Contrairement à une approche orientée objet (classes), les services sont composés de fonctions exportées individuellement (ex: `getUsers`, `createUser`).
*   **Pourquoi ?** Meilleur tree-shaking, simplicité de test, et adéquation avec l'API fonctionnelle de Firebase v9+.

### 2. Observable Pattern (Subscriptions)
La majorité des services exposent une fonction `subscribeTo...` qui utilise `onSnapshot` de Firestore.
*   **Rôle** : Écouter les changements en temps réel.
*   **Retour** : Une fonction de nettoyage (`unsubscribe`) à appeler lors du démontage du composant.

```typescript
// Exemple type
export const subscribeToItems = (callback) => {
  return onSnapshot(collection(db, 'items'), (snap) => {
    const items = snap.docs.map(d => d.data());
    callback(items);
  });
};
```

### 3. Gestion des Dates
Firestore stocke les dates sous forme de `Timestamp`. Les services sont responsables de la conversion :
*   **Lecture** : `Timestamp` -> `string` (ISO) ou `Date` JS.
*   **Écriture** : `Date` JS -> `Timestamp`.

## 📂 Organisation des Services

| Service | Collection Firestore | Description |
|---------|----------------------|-------------|
| `users.ts` | `users` | Gestion des profils et Auth |
| `classes.ts` | `classes` | Gestion des classes |
| `courseGrades.ts` | `courseGrades` | Notes (Nouveau système) |
| `grades.ts` | `users/{id}/grades` | Notes (Ancien système / Legacy) |
| `attendance.ts` | `attendance` | Absences et retards |
| `messages.ts` | `messages` | Messagerie interne |

## ⚠️ Dette Technique & Incohérences

### Dualité du système de notes
Actuellement, deux systèmes coexistent :
1.  **Legacy (`grades.ts`)** : Utilise des sous-collections `users/{studentId}/grades`. Difficile à requêter globalement.
2.  **Moderne (`courseGrades.ts`)** : Utilise une collection racine `courseGrades` avec des champs de référence (`studentId`, `courseId`). Plus flexible et performant pour les requêtes complexes.

**Recommandation** : Migrer progressivement toute la logique vers `courseGrades.ts` et déprécier `grades.ts`.
