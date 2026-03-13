# Securite Firestore/Storage (etat actuel)

Ce document decrit les controles backend effectifs.  
Source de verite:

- `firestore.rules`
- `storage.rules`

## Principes actifs

- Deny-by-default pour Firestore et Storage.
- RBAC sur roles `student`, `parent`, `teacher`, `director`, `superadmin`.
- Validation role via custom claims + role Firestore pour limiter les claims obsoletes.
- Separation stricte frontend/backend: les autorisations sont imposees par les rules.

## Firestore - points cles

- `users/{userId}`:
  - lecture: owner, direction/admin, enseignants limites, eleves de meme classe.
  - update owner: uniquement champs whitelistes (pas de role/classId).
- `grades` / `courseGrades`:
  - lecture ciblee (owner/parent/teacher de classe/direction).
  - ecriture restreinte + validation score `0 <= score <= maxScore`.
- `attendance`:
  - enseignant limite a ses classes.
- `events`:
  - lecture par classe/role, plus de read global authentifie.
- Legacy compat:
  - `users/{uid}/grades/{id}`
  - `users/{uid}/attendance/{id}`

## Storage - points cles

- Regle globale deny par defaut.
- `profiles/{userId}`: write owner + image only.
- `homework/{homeworkId}/{studentId}/{fileName}`:
  - write owner + taille/MIME limites.
  - read/delete owner + direction/admin.
- `users/{userId}/**`:
  - read/delete owner + direction/admin (effacement RGPD).

## Tests et validation

- Scripts logiques inclus:
  - `scripts/verify_rules_mock.js`
  - `scripts/verify_grade_rules.js`
  - `scripts/verify_homework_rules.js`
  - `scripts/verify_message_rules.js`
  - `scripts/verify_submission_rules.js`
- Commande:
  - `pnpm verify-rules:all`

## Limites

- Ce document ne remplace pas des tests via emulateur Firebase ni un pentest.
