# Backup and Recovery Runbook

Date: 2026-03-05  
System: SmartMadrasa

## Objectives

- RPO target: 24h
- RTO target: 4h

## Data to Back Up

- Firestore (all collections)
- Firebase Storage (`profiles/`, `homework/`, `documents/`, `events/`, `users/`)
- Firebase Auth user export
- Firestore rules, Storage rules, indexes, and function source code

## Backup Schedule

- Daily automated Firestore export to locked bucket.
- Daily Storage snapshot (or object versioning + lifecycle policy).
- Weekly Auth export.
- Monthly immutable backup archive.

## Recovery Procedure

1. Freeze writes (maintenance mode).
2. Restore Firestore from latest valid export.
3. Restore Storage objects for impacted paths.
4. Reconcile Auth users and custom claims.
5. Validate data integrity:
   - user-role mappings
   - class/student/parent links
   - grade and attendance consistency
6. Re-enable traffic and monitor error rates.

## Verification Checklist

- Restore test executed quarterly in staging.
- Random sample checks: 50 student records + related grades/messages/files.
- Audit log retained for each restore exercise.

## Access Control

- Backup bucket accessible only by designated service accounts.
- No human permanent owner role; break-glass access only.
