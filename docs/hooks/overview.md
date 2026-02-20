# Hooks Personnalisés

Les hooks personnalisés (`src/hooks/`) encapsulent la logique métier complexe et la préparation des données pour les composants UI.
Ils consomment généralement `DataContext` et `AuthContext` pour transformer les données brutes en informations affichables.

## 📊 `useDashboard`

Ce hook est le moteur du Tableau de Bord principal. Il agrège les données pour afficher les statistiques et graphiques.

**Responsabilités :**

1.  **Calculs Statistiques** : Moyennes générales, taux de présence, nombre d'élèves.
2.  **Préparation des Graphiques** : Formate les données pour la bibliothèque `recharts` (ex: `weeklyAttendanceData`).
3.  **Gestion Parent/Enfant** : Si l'utilisateur est un parent, gère la sélection de l'enfant actif pour filtrer les données affichées.

**Optimisation :**
Utilise intensivement `useMemo` pour ne pas recalculer les statistiques lourdes à chaque render, sauf si les données sous-jacentes changent.

---

## 👨‍🏫 `useTeacherGrades`

Gère l'interface complexe de gestion des notes pour les enseignants.

**Fonctionnalités Clés :**

- **Filtrage en Cascade** : Sélection Classe -> Sélection Matière -> Liste Élèves.
- **Mode "Bulk"** : Gère l'état pour la saisie rapide de notes pour toute une classe.
- **Recherche Optimisée** : Crée une `Map<id, Student>` pour un accès O(1) lors du rendu des grandes listes.

---

## 📚 `useHomework`

Centralise toute la logique de gestion des devoirs (Cahier de textes).

**Fonctionnalités Clés :**

- **CRUD Devoirs** : Création, édition, suppression (pour les profs).
- **Soumission Élève** : Gère l'upload de fichiers (avec progression), la mise à jour et la suppression de devoirs rendus.
- **Statut Dynamique** : Calcule le statut (`pending`, `submitted`, `overdue`, `graded`) en fonction de la date et des soumissions existantes.

**Gestion des Fichiers :**
Intègre la logique d'upload vers Firebase Storage via `services/storage.ts` et suit la progression pour l'afficher dans l'UI.

---

## 🛠️ Autres Hooks Notables

| Hook            | Description                                                                  |
| --------------- | ---------------------------------------------------------------------------- |
| `useGradeStats` | Calcule la moyenne d'un élève spécifique (utilisé dans les bulletins).       |
| `useSchedule`   | Prépare les événements pour l'affichage calendrier (FullCalendar ou Custom). |
| `useMessages`   | Gère la logique de la messagerie (filtres, pagination, envoi).               |
