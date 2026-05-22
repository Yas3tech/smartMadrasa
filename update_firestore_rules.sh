#!/bin/bash
cat << 'DIFF' > patch.diff
--- firestore.rules
+++ firestore.rules
@@ -126,8 +126,12 @@
       allow delete: if isDirector() || isSuperAdmin();

       // 🛡️ SECURITY: Prevent Privilege Escalation
-      // Allow superadmin creation ONLY if setup is open.
-      allow create: if isDirector() || isSuperAdmin() || (isSetupOpen() && request.resource.data.role == 'superadmin');
+      // Allow superadmin creation ONLY if setup is open AND the setup doc is created atomically.
+      allow create: if isDirector() || isSuperAdmin() || (
+        isSetupOpen() &&
+        request.resource.data.role == 'superadmin' &&
+        existsAfter(/databases/$(database)/documents/_setup/config)
+      );
       // Only allow users to update their own profile fields.
       // Critical: Prevent updating 'role', 'classId', 'childrenIds', etc.
       allow update: if isDirector() || isSuperAdmin() || isOwnerSafeUpdate(userId);
@@ -137,7 +141,12 @@
     // LOGIC-04: Removed public read access to prevent backend reconnaissance
     match /_setup/{docId} {
       allow read: if isDirector() || isSuperAdmin() || isSetupOpen();
-      allow create: if !exists(/databases/$(database)/documents/_setup/config);
+      allow create: if !exists(/databases/$(database)/documents/_setup/config) &&
+        isAuthenticated() &&
+        request.resource.data.completedBy == request.auth.uid &&
+        // Ensure the transaction also creates the superadmin user to prevent DoS by locking setup
+        existsAfter(/databases/$(database)/documents/users/$(request.auth.uid)) &&
+        getAfter(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin';
       allow delete: if isSuperAdmin();
     }
DIFF
patch -p0 < patch.diff
