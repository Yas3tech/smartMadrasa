## 2024-05-23 - Critical Privilege Escalation in User Profiles
**Vulnerability:** The Firestore rule `allow update: if isOwner(userId)` permitted users to modify any field in their own document, including sensitive fields like `role` and `classId`. This allowed arbitrary privilege escalation (e.g., a student becoming a superadmin).
**Learning:** Checking ownership (`isOwner`) is insufficient for authorizing updates on documents containing mixed-sensitivity data. Sensitive fields must be protected even from the document owner.
**Prevention:** Use `request.resource.data.diff(resource.data).affectedKeys().hasOnly([...])` to strictly whitelist allowed fields for user-initiated updates.
