# Production Deployment Checklist

## Pre-Deployment
- [ ] `.firebaserc` aliases mapped to real projects (`dev`, `staging`, `prod`).
- [ ] GitHub environment secrets set for staging/prod.
  - Voir `docs/security/github_secrets.md`
- [ ] Threat model reviewed and approved.
- [ ] IAM review completed (least privilege).
- [ ] Backup/restore last drill < 90 days.

## Quality Gates
- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm type-check`
- [ ] `pnpm lint`
- [ ] `pnpm test:run`
- [ ] `pnpm verify-rules:all`
- [ ] `pnpm audit --audit-level high`
- [ ] `pnpm validate:env:prod`
- [ ] `pnpm build`

## Firebase Rules and Config
- [ ] Deploy rules/indexes first in staging.
- [ ] Validate unauthorized SDK direct access is denied.
- [ ] Validate role-based access flows per role.

## Post-Deployment
- [ ] Smoke tests login/grades/messages/homework.
- [ ] Check Cloud Functions logs for errors.
- [ ] Verify monitoring endpoint receives client errors.
- [ ] Verify CSP/HSTS/headers on deployed host.
