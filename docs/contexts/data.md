# DataContext (Hub de Données)

Le `DataContext` est le **coeur nerveux** de l'application. Il centralise toutes les subscriptions Firestore et fournit l'état global à l'ensemble de l'interface utilisateur.

## 🎯 Architecture : Le Pattern "Data Hub"

Contrairement à une approche où chaque composant ferait ses propres appels API, SmartSchool utilise un **Hub Unique** qui synchronise les données nécessaires au démarrage.

### Avantages
*   **Source de Vérité Unique** : Pas de risque d'avoir deux versions différentes d'une même donnée.
*   **Réactivité Temps Réel** : Les données sont mises à jour automatiquement via les listeners Firestore (`onSnapshot`).
*   **Pas de Prop Drilling** : N'importe quel composant peut accéder à `useData()`.

### Inconvénients (Dette Technique)
*   **Performance** : Le contexte contient *beaucoup* de données (`users`, `classes`, `grades`, etc.). Chaque mise à jour provoque potentiellement un re-render de tous les consommateurs, même s'ils n'utilisent pas la donnée modifiée.
*   **Complexité** : Le fichier `DataContext.tsx` est massif et mélange la logique de récupération et la logique métier.

## 🔄 Stratégie de Souscription (Optimisation)

Le contexte est intelligent et ne charge pas toutes la base de données. Il adapte les requêtes en fonction du rôle de l'utilisateur connecté (`user.role`).

| Rôle | Données Chargées |
|------|-------------------|
| **Student** | Ses camarades de classe, ses professeurs, ses notes, ses devoirs, son emploi du temps. |
| **Parent** | Les données de ses enfants uniquement (`grades`, `attendance`, `homework`). |
| **Teacher** | Les élèves de ses classes assignées, les notes qu'il a données, son emploi du temps. |
| **Director** | Toutes les données de l'établissement. |

## 🛠️ API Exposée (`useData`)

Le hook `useData` retourne un objet contenant :

### 1. États (Lecture Seule)
*   `users: User[]`
*   `classes: ClassGroup[]`
*   `grades: Grade[]`
*   `events: Event[]`
*   ... et toutes les autres collections.

### 2. Actions (Mutations)
Le contexte expose des méthodes pour modifier les données. Ces méthodes appellent les services correspondants (`src/services/`).

*   `addUser(user)`
*   `addGrade(grade)`
*   `markAttendance(record)`
*   `sendMessage(message)`
*   ...

## ⚠️ Logique Critique : Gestion des Notes

La méthode `addGrade` contient une logique métier importante :
1.  Elle tente de trouver la **Période Académique** correspondante à la date de la note.
2.  Si aucune période n'est trouvée, elle lève une erreur bloquante.
3.  Elle convertit l'objet `Grade` (ancien modèle) vers le nouveau modèle `CourseGrade` avant de l'envoyer à Firestore.

```typescript
// Exemple simplifié de la logique interne
const addGrade = async (grade) => {
  const period = findPeriodForDate(grade.date);
  if (!period) throw new Error("Pas de période active");

  const newGrade = convertToCourseGrade(grade, period.id);
  await fbCreateCourseGrade(newGrade);
}
```
