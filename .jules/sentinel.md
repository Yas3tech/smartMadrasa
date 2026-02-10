## 2024-03-24 - Firestore Privilege Escalation

**Vulnerability:** Found a critical privilege escalation vulnerability where users could update their own `role` field in the `users` collection because the `update` rule only checked for ownership (`isOwner(userId)`) without restricting modified fields.
**Learning:** Firestore `allow update` rules must always validate _what_ is being updated, not just _who_ is updating. Relying solely on `isOwner` for document updates is dangerous if the document contains sensitive fields like roles or permissions.
**Prevention:** Use `request.resource.data.diff(resource.data).affectedKeys()` to whitelist or blacklist fields in update rules. Always separate sensitive data (like roles) from user-writable profiles if possible, or strictly enforce field-level security.
