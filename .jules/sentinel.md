## 2025-02-18 - Privilege Escalation in Firestore
**Vulnerability:** User documents allowed unrestricted updates by the owner (`allow update: if isOwner(userId)`). This allowed users to modify critical fields like `role`, leading to privilege escalation (e.g., student becoming superadmin).
**Learning:** Checking ownership is not enough for `update` operations on sensitive documents. Always validate *what* is being updated.
**Prevention:** Use `request.resource.data.diff(resource.data).affectedKeys().hasOnly(['safe_field1', 'safe_field2'])` to whitelist modifiable fields.
