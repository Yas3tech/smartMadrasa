# Threat Model (Tier REGULATED)

Date: 2026-03-05  
System: SmartMadrasa  
Scope: React frontend + Firebase Auth/Firestore/Storage + Cloud Functions

## 1. Adversaries
- External attacker (internet) targeting auth, data exfiltration, account takeover.
- Authenticated malicious user (student/parent/teacher) attempting horizontal or vertical escalation.
- Insider with excessive IAM privileges.
- Compromised dependency or CI secret leakage.

## 2. Critical Assets
- Student PII, grades, attendance, teacher comments, school messages.
- Authentication tokens and role claims.
- Firestore/Storage rules and Firebase deployment configuration.
- Backup snapshots and recovery credentials.

## 3. Trust Boundaries
- Browser client (untrusted) -> Firebase SDK -> Firestore/Storage rules (trusted enforcement).
- Cloud Functions admin context (high privilege boundary).
- GitHub Actions secrets boundary.
- Firebase project boundary (dev/staging/prod isolated projects).

## 4. High-Risk Scenarios
- Student accesses another student records via direct SDK calls.
- Teacher accesses users outside assigned classes.
- Role escalation by modifying own user document.
- Upload abuse (malicious files, oversized content).
- Data loss due to accidental deletion or missing backups.

## 5. Controls Implemented
- Firestore/Storage deny-by-default + role/class scoping.
- Role validation with custom claims + Firestore role cross-check.
- Restricted writable fields on `users/{uid}`.
- Upload size/type constraints and safe URL handling.
- CI quality/security gates before deployment.

## 6. Residual Risks / Manual Validation Required
- IAM least-privilege review in GCP console.
- TLS/CDN header enforcement verification on deployed endpoints.
- Disaster recovery drill (restore test).
- Penetration test for abuse paths and business logic.

## 7. Security Sign-off Criteria
- CI green on lint/type-check/tests/rules/audit/build.
- No HIGH/CRITICAL vulnerabilities unresolved.
- IAM review approved.
- Backup/restore test report approved.
