# Flux Critiques (Workflows)

Ce document décrit les processus les plus importants de l'application.

## 1. 🔐 Authentification & Initialisation (Login Flow)

Ce diagramme détaille le processus de connexion, de la saisie des identifiants jusqu'au chargement complet du tableau de bord. Il met en évidence la distinction entre l'authentification (Firebase Auth) et la récupération du profil métier (Firestore).

```text
+---------------------+    +---------------------+    +---------------------+    +---------------------+
|      USER UI        |    |     AUTH CONTEXT    |    |     DATA CONTEXT    |    |      FIREBASE       |
+----------+----------+    +----------+----------+    +----------+----------+    +----------+----------+
           |                          |                          |                          |
           | 1. Submit Credentials    |                          |                          |
           +------------------------> |                          |                          |
           |                          | 2. signInWithEmail()     |                          |
           |                          +---------------------------------------------------> |
           |                          |                          |                          | 3. Auth Success
           |                          | <-------------------------------------------------- + (uid, token)
           |                          |                          |                          |
           |                          | 4. Fetch User Profile (uid)                         |
           |                          +---------------------------------------------------> |
           |                          |                          |                          | 5. Return Role & Name
           |                          | <-------------------------------------------------- +
           |                          |                          |                          |
           | 6. Set User State        |                          |                          |
           | (role='teacher')         |                          |                          |
           +------------------------> | 7. Mount DataProvider    |                          |
                                      +------------------------> |                          |
                                                                 | 8. Subscribe(role)       |
                                                                 +------------------------> |
                                                                 |                          | 9. Realtime Data Stream
                                                                 | <----------------------- + (snapshot)
           |                          |                          |                          |
           | 10. Render Dashboard     |                          |                          |
           | <-------------------------------------------------- +                          |
           |                          |                          |                          |
+----------v----------+    +----------v----------+    +----------v----------+    +----------v----------+
```

## 2. 📝 Saisie de Notes (Teacher Workflow)

Ce flux illustre comment une note saisie par un professeur est traitée, validée, et propagée en temps réel.

```text
+---------------------+    +---------------------+    +---------------------+    +---------------------+
|    TEACHER UI       |    |     DATA CONTEXT    |    |    FIRESTORE DB     |    |     STUDENT UI      |
+----------+----------+    +----------+----------+    +----------+----------+    +----------+----------+
           |                          |                          |                          |
           | 1. Enter Grade (15/20)   |                          |                          |
           +------------------------> |                          |                          |
           |                          | 2. Validate Data         |                          |
           |                          | (Check Date/Period)      |                          |
           |                          |                          |                          |
           |                          | 3. addDoc('grades')      |                          |
           |                          +------------------------> |                          |
           |                          |                          | 4. Write Success         |
           |                          | <----------------------- +                          |
           |                          |                          |                          |
           | 5. Show Toast "Saved"    |                          | 6. Push Update (WebSocket)
           | <----------------------- +                          +------------------------------------> |
           |                          |                          |                          |           |
           |                          |                          |                          | 7. Update Grade List
           |                          |                          |                          |           |
+----------v----------+    +----------v----------+    +----------v----------+    +----------v----------+
```

## 3. 📂 Soumission de Devoir (Student Workflow)

Processus complet d'upload de fichier, suivi de la mise à jour de la base de données.

```text
+---------------------+    +---------------------+    +---------------------+    +---------------------+
|     STUDENT UI      |    |   STORAGE SERVICE   |    |   FIREBASE STORAGE  |    |    FIRESTORE DB     |
+----------+----------+    +----------+----------+    +----------+----------+    +----------+----------+
           |                          |                          |                          |
           | 1. Select File (PDF)     |                          |                          |
           +------------------------> |                          |                          |
           |                          | 2. uploadBytesResumable  |                          |
           |                          +------------------------> |                          |
           |                          |                          |                          |
           | 3. Update Progress Bar   | <----------------------- + (Progress Event)     |
           | <----------------------- |                          |                          |
           |                          |                          | 4. Upload Complete       |
           |                          | 5. getDownloadURL()      | <----------------------- |
           |                          +------------------------> |                          |
           |                          |                          |                          |
           |                          | 6. Return URL            |                          |
           |                          | (https://firebasestorage)|                          |
           |                          | <----------------------- +                          |
           |                          |                          |                          |
           | 7. Submit Homework       |                          |                          |
           | (URL, Timestamp)         |                          |                          |
           +--------------------------------------------------------------------------> |
           |                          |                          |                          |
           | 8. Show "Submitted"      |                          |                          |
           | <------------------------------------------------------------------------- +
+----------v----------+    +----------v----------+    +----------v----------+    +----------v----------+
```
