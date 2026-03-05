# IAM Baseline (Firebase/GCP)

Date: 2026-03-05  
Scope: smartmadrasa-dev / smartmadrasa-staging / smartmadrasa-prod

## Principles
- Least privilege by environment.
- Separate service accounts for CI deploy and runtime functions.
- No owner/editor roles for daily operations.

## Required Role Model
- CI deploy account:
  - Firebase Hosting Admin
  - Cloud Functions Developer
  - Service Account User (scoped)
  - Firebase Rules Admin
- Runtime function service account:
  - Minimal Firestore/Storage access for required operations only.
- Human operators:
  - Read-only by default.
  - Temporary elevation with ticket and expiry.

## Mandatory Settings
- MFA required for all privileged users.
- Disable unused service account keys.
- Prefer Workload Identity Federation over long-lived keys.
- Audit logs enabled for Admin Activity and Data Access.

## Quarterly Review Checklist
- Remove stale users/service accounts.
- Validate no wildcard broad roles remain.
- Rotate secrets and deployment tokens.
- Verify break-glass accounts and incident playbook.
