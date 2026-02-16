# Cycle de Vie des Données (Data Lifecycle)

Ce document illustre le cycle "circulaire" des données au sein de l'application SmartSchool.
Il explique comment une action utilisateur se propage jusqu'au backend et revient mettre à jour l'interface.

## 🔄 Le Flux Circulaire

L'application suit un modèle **unidirectionnel** strict pour les modifications (Actions), mais **réactif** pour la lecture (Subscriptions).

```text
       +-------------------------------------------------------------+
       |                                                             |
       |                   1. USER INTERACTION                       |
       |              (Click, Form Submit, Drag & Drop)              |
       |                                                             |
       +--------------+-------------------------------+--------------+
                      |                               |
                      v                               v
       +--------------+--------------+  +-------------+--------------+
       |                             |  |                            |
       |        ACTION (Hook)        |  |      STATE (Context)       |
       |    useHomework().submit()   |  |     DataContext.grades     |
       |                             |  |                            |
       +--------------+--------------+  +-------------^--------------+
                      |                               |
                      | 2. Call Service               | 5. Update State
                      v                               |    (setGrades)
       +--------------+--------------+                |
       |                             |                |
       |      SERVICE LAYER          |  +-------------+--------------+
       |    homework.ts / addDoc()   |  |                            |
       |                             |  |      EVENT LISTENER        |
       +--------------+--------------+  |       onSnapshot()         |
                      |                 |                            |
                      | 3. Network Req  +-------------^--------------+
                      v                               |
       +--------------+-------------------------------+--------------+
       |                                                             |
       |                      FIREBASE CLOUD                         |
       |              (Firestore Database / Rules)                   |
       |                                                             |
       |              4. Process & Notify Listeners                  |
       |                                                             |
       +-------------------------------------------------------------+
```

### Étapes du Cycle

1.  **Interaction** : L'utilisateur clique sur "Enregistrer" dans `GradeModal.tsx`.
2.  **Appel Service** : Le composant appelle `addGrade()` du `DataContext`, qui délègue à `services/grades.ts`.
3.  **Requête Réseau** : Le SDK Firebase envoie la requête `Write` au serveur.
4.  **Traitement Backend** : Firestore vérifie les règles de sécurité (`firestore.rules`). Si valide, la donnée est écrite.
5.  **Notification (Push)** : Firestore notifie tous les clients abonnés (y compris l'expéditeur) via le listener `onSnapshot`.
6.  **Mise à jour État** : Le `DataContext` reçoit les nouvelles données et met à jour son état React (`setGrades`).
7.  **Rendu UI** : React détecte le changement d'état et re-rend les composants concernés (ex: `GradeList`).

## 📡 Abonnement vs Requête Unique

SmartSchool privilégie les **Abonnements** (Subscriptions) aux requêtes uniques (One-time fetch).

### Modèle Subscription (Utilisé à 90%)

```text
+-----------+                   +-----------+                   +-----------+
| Component |                   | Context   |                   | Firestore |
+-----+-----+                   +-----+-----+                   +-----+-----+
      |                               |                               |
      | 1. Mount                      |                               |
      +-----------------------------> |                               |
      |                               | 2. onSnapshot(query)          |
      |                               +-----------------------------> |
      |                               |                               |
      |                               | 3. Initial Data               |
      |                               | <---------------------------- +
      | 4. Display Data               |                               |
      | <---------------------------- +                               |
      |                               |                               |
      |                               | 5. NEW DATA (External Event)  |
      |                               | <---------------------------- +
      | 6. Auto-Update UI             |                               |
      | <---------------------------- +                               |
```

### Modèle Requête Unique (Utilisé pour les actions spécifiques)

Utilisé pour vérifier l'existence d'un utilisateur ou récupérer un document précis avant édition.

```text
+-----------+                   +-----------+                   +-----------+
| Component |                   | Service   |                   | Firestore |
+-----+-----+                   +-----+-----+                   +-----+-----+
      |                               |                               |
      | 1. getUserById(id)            |                               |
      +-----------------------------> |                               |
      |                               | 2. getDoc(docRef)             |
      |                               +-----------------------------> |
      |                               |                               |
      |                               | 3. DocumentSnapshot           |
      |                               | <---------------------------- +
      | 4. User Object                |                               |
      | <---------------------------- +                               |
```
