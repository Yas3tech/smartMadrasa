# Flux Critiques (Workflows)

Ce document décrit les processus les plus importants de l'application.

## 1. 🔐 Authentification & Initialisation

Le chargement initial est complexe car il dépend de deux sources de vérité : Firebase Auth (identité) et Firestore (rôle/profil).

```mermaid
sequenceDiagram
    participant User
    participant App
    participant AuthContext
    participant DataContext
    participant Firestore

    User->>App: Ouvre l'URL
    App->>AuthContext: Init
    AuthContext->>AuthContext: Check Firebase Auth State

    alt Non Connecté
        AuthContext-->>App: user = null
        App->>User: Affiche Login Page
    else Connecté
        AuthContext->>Firestore: Get User Profile (Role)
        Firestore-->>AuthContext: User Data (Teacher)
        AuthContext-->>App: user = { ...TeacherData }

        App->>DataContext: Init
        DataContext->>Firestore: Subscribe(classes, students, grades...)
        Firestore-->>DataContext: Realtime Updates
        DataContext-->>App: Data Ready
        App->>User: Affiche Dashboard Enseignant
    end
```

## 2. 📝 Saisie de Notes (Teacher Workflow)

Ce flux montre comment une note saisie par un professeur arrive instantanément chez l'élève.

```mermaid
sequenceDiagram
    participant Teacher
    participant TeacherUI
    participant DataContext
    participant Firestore
    participant StudentUI
    participant Student

    Teacher->>TeacherUI: Saisit une note (15/20)
    TeacherUI->>DataContext: addGrade(gradeData)
    DataContext->>DataContext: Validate / Transform
    DataContext->>Firestore: addDoc('grades', gradeData)

    par Update Teacher UI
        Firestore-->>DataContext: onSnapshot (Grade Added)
        DataContext-->>TeacherUI: Affiche succès
    and Update Student UI
        Firestore-->>DataContext: onSnapshot (Grade Added)
        DataContext-->>StudentUI: Mise à jour note
        StudentUI->>Student: Notification visuelle
    end
```

## 3. 📂 Soumission de Devoir (Student Workflow)

Processus d'upload de fichier et mise à jour du statut.

```mermaid
sequenceDiagram
    participant Student
    participant HomeworkUI
    participant StorageSvc
    participant FirebaseStorage
    participant Firestore

    Student->>HomeworkUI: Sélectionne un fichier (PDF)
    HomeworkUI->>StorageSvc: uploadFileWithProgress()

    loop Upload Progress
        StorageSvc->>FirebaseStorage: Upload Chunk
        FirebaseStorage-->>HomeworkUI: Progress %
        HomeworkUI-->>Student: Update Progress Bar
    end

    FirebaseStorage-->>StorageSvc: Download URL
    StorageSvc-->>HomeworkUI: URL Ready

    HomeworkUI->>Firestore: updateDoc('homeworks', { status: 'submitted', fileUrl })
    Firestore-->>HomeworkUI: Success
```
