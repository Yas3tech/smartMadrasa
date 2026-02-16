# Sentinel Journal 🛡️

## 2024-02-12 - User Privilege Escalation

**Vulnerability:** Users could escalate their privileges by modifying their own `role` field in Firestore (e.g., from 'student' to 'director') via the client-side API, because the `update` rule only checked `isOwner(userId)` without restricting which fields could be updated.
**Learning:** Firestore's `allow update` applies to the entire document. Granular field-level permissions must be explicitly enforced using `request.resource.data.diff(resource.data).affectedKeys()`.
**Prevention:** Always use an allowlist for user-editable fields in Firestore rules. Never rely on UI validation alone.
## 2024-05-23 - Critical Privilege Escalation in User Profiles
**Vulnerability:** The Firestore rule `allow update: if isOwner(userId)` permitted users to modify any field in their own document, including sensitive fields like `role` and `classId`. This allowed arbitrary privilege escalation (e.g., a student becoming a superadmin).
**Learning:** Checking ownership (`isOwner`) is insufficient for authorizing updates on documents containing mixed-sensitivity data. Sensitive fields must be protected even from the document owner.
**Prevention:** Use `request.resource.data.diff(resource.data).affectedKeys().hasOnly([...])` to strictly whitelist allowed fields for user-initiated updates.
## 2024-05-24 - Firestore User Update Privilege Escalation
**Vulnerability:** The `users` collection allowed any user to update their own document via `isOwner(userId)`, but did not restrict *which* fields could be updated. This allowed a malicious user (e.g., a student) to update their own `role` field to `director` or `superadmin`, escalating their privileges.
**Learning:** Firestore `allow update` rules must explicitly validate `request.resource.data` to prevent unauthorized field modifications, especially for sensitive fields like `role` or `permissions`. Relying on client-side code to not send these fields is insufficient.
**Prevention:** Use `request.resource.data.diff(resource.data).affectedKeys().hasOnly([...])` to whitelist allowed fields for user-initiated updates. Always assume the client is compromised.
## 2025-02-18 - Privilege Escalation in Firestore
**Vulnerability:** User documents allowed unrestricted updates by the owner (`allow update: if isOwner(userId)`). This allowed users to modify critical fields like `role`, leading to privilege escalation (e.g., student becoming superadmin).
**Learning:** Checking ownership is not enough for `update` operations on sensitive documents. Always validate *what* is being updated.
**Prevention:** Use `request.resource.data.diff(resource.data).affectedKeys().hasOnly(['safe_field1', 'safe_field2'])` to whitelist modifiable fields.
