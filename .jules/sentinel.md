# Sentinel Journal 🛡️

## 2024-02-12 - User Privilege Escalation

**Vulnerability:** Users could escalate their privileges by modifying their own `role` field in Firestore (e.g., from 'student' to 'director') via the client-side API, because the `update` rule only checked `isOwner(userId)` without restricting which fields could be updated.
**Learning:** Firestore's `allow update` applies to the entire document. Granular field-level permissions must be explicitly enforced using `request.resource.data.diff(resource.data).affectedKeys()`.
**Prevention:** Always use an allowlist for user-editable fields in Firestore rules. Never rely on UI validation alone.
