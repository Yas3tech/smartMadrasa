## 2024-03-24 - Firestore Privilege Escalation

**Vulnerability:** Found a critical privilege escalation vulnerability where users could update their own `role` field in the `users` collection because the `update` rule only checked for ownership (`isOwner(userId)`) without restricting modified fields.
**Learning:** Firestore `allow update` rules must always validate _what_ is being updated, not just _who_ is updating. Relying solely on `isOwner` for document updates is dangerous if the document contains sensitive fields like roles or permissions.
**Prevention:** Use `request.resource.data.diff(resource.data).affectedKeys()` to whitelist or blacklist fields in update rules. Always separate sensitive data (like roles) from user-writable profiles if possible, or strictly enforce field-level security.

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

**Vulnerability:** The `users` collection allowed any user to update their own document via `isOwner(userId)`, but did not restrict _which_ fields could be updated. This allowed a malicious user (e.g., a student) to update their own `role` field to `director` or `superadmin`, escalating their privileges.
**Learning:** Firestore `allow update` rules must explicitly validate `request.resource.data` to prevent unauthorized field modifications, especially for sensitive fields like `role` or `permissions`. Relying on client-side code to not send these fields is insufficient.
**Prevention:** Use `request.resource.data.diff(resource.data).affectedKeys().hasOnly([...])` to whitelist allowed fields for user-initiated updates. Always assume the client is compromised.

## 2025-02-18 - Privilege Escalation in Firestore

**Vulnerability:** User documents allowed unrestricted updates by the owner (`allow update: if isOwner(userId)`). This allowed users to modify critical fields like `role`, leading to privilege escalation (e.g., student becoming superadmin).
**Learning:** Checking ownership is not enough for `update` operations on sensitive documents. Always validate _what_ is being updated.
**Prevention:** Use `request.resource.data.diff(resource.data).affectedKeys().hasOnly(['safe_field1', 'safe_field2'])` to whitelist modifiable fields.

## 2025-02-21 - Decoupled Security Verification

**Vulnerability:** The `firestore.rules` file contained critical syntax errors (duplicate match blocks) rendering it invalid, yet the `npm run verify-rules` script passed successfully because it mocked the logic in JS rather than testing the actual rules file.
**Learning:** Mock-based verification scripts can give a false sense of security if they don't validate the actual configuration file's integrity.
**Prevention:** Ensure verification pipelines include a step to parse/compile the actual `firestore.rules` file (e.g., using firebase-tools or a parser) in addition to logic tests.

## 2025-02-21 - Message Impersonation and Update Logic

**Vulnerability:** The `messages` collection allowed any user to update a message if `senderId` matched their UID (`isOwner`). This allowed a malicious user to change `senderId` to impersonate another user (e.g., Director) or alter message content after sending. Conversely, legitimate receivers could not mark messages as read because they were not the owner.
**Learning:** Ownership checks (`isOwner`) for `update` operations on shared resources (like messages) are insufficient and often incorrect. Permissions must be granular based on role (Sender vs Receiver) and field (Content vs Read Status).
**Prevention:** Implement separate logic for Sender updates (`isMessageSenderUpdate`) and Receiver updates (`isMessageReceiverUpdate`) using `diff().affectedKeys().hasOnly([...])` to enforce field-level permissions and immutability of critical fields like `senderId`.

## 2025-02-21 - XSS via Unsafe Attachment Protocols

**Vulnerability:** The application rendered user-supplied attachment URLs directly in `href` attributes. While React 19 blocks `javascript:` URLs by default, it allows other dangerous schemes like `data:` (e.g., `data:text/html`), enabling potential XSS or phishing attacks.
**Learning:** Framework protections (like React's `javascript:` blocking) are often incomplete or version-dependent. Explicit sanitization using an allowlist of safe protocols (http, https) is necessary for user-generated links.
**Prevention:** Implement a strict URL sanitization utility (`isSafeUrl`) that whitelists allowed protocols and rejects everything else before rendering links.
