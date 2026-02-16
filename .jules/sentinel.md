## 2024-05-24 - Firestore User Update Privilege Escalation
**Vulnerability:** The `users` collection allowed any user to update their own document via `isOwner(userId)`, but did not restrict *which* fields could be updated. This allowed a malicious user (e.g., a student) to update their own `role` field to `director` or `superadmin`, escalating their privileges.
**Learning:** Firestore `allow update` rules must explicitly validate `request.resource.data` to prevent unauthorized field modifications, especially for sensitive fields like `role` or `permissions`. Relying on client-side code to not send these fields is insufficient.
**Prevention:** Use `request.resource.data.diff(resource.data).affectedKeys().hasOnly([...])` to whitelist allowed fields for user-initiated updates. Always assume the client is compromised.
## 2025-02-18 - Privilege Escalation in Firestore
**Vulnerability:** User documents allowed unrestricted updates by the owner (`allow update: if isOwner(userId)`). This allowed users to modify critical fields like `role`, leading to privilege escalation (e.g., student becoming superadmin).
**Learning:** Checking ownership is not enough for `update` operations on sensitive documents. Always validate *what* is being updated.
**Prevention:** Use `request.resource.data.diff(resource.data).affectedKeys().hasOnly(['safe_field1', 'safe_field2'])` to whitelist modifiable fields.
