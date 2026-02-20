/**
 * scripts/verify_rules_mock.js
 * Mocks the Firestore Security Rules logic for user updates to verify the whitelist mechanism.
 */

class MapDiff {
  constructor(oldData, newData) {
    this.oldData = oldData || {};
    this.newData = newData || {};
  }

  affectedKeys() {
    const keys = new Set();

    // Check for changed or added keys
    for (const key in this.newData) {
      // Simple equality check (works for primitives in this mock)
      if (this.newData[key] !== this.oldData[key]) {
        keys.add(key);
      }
    }

    // Check for removed keys
    for (const key in this.oldData) {
      if (!(key in this.newData)) {
        keys.add(key);
      }
    }

    return {
      hasOnly: (allowedKeys) => {
        for (const key of keys) {
          if (!allowedKeys.includes(key)) {
            return false;
          }
        }
        return true;
      },
      debug: () => Array.from(keys),
    };
  }
}

function checkUpdateRule(testCase) {
  const { actorRole, actorId, targetId, oldData, newData } = testCase;

  // Mocks
  const request = {
    auth: { uid: actorId },
    resource: { data: newData },
  };
  const resource = { data: oldData };

  // Helper functions from rules
  const isAuthenticated = () => request.auth != null;
  const isOwner = (userId) => isAuthenticated() && request.auth.uid === userId;

  // Mock role check (in real rules this fetches from DB)
  const isDirector = () => actorRole === 'director';
  const isSuperAdmin = () => actorRole === 'superadmin';

  // The actual rule logic being tested:
  // allow update: if isDirector() || isSuperAdmin() || (
  //   isOwner(userId) &&
  //   request.resource.data.diff(resource.data).affectedKeys().hasOnly(
  //     ['name', 'email', 'phone', 'avatar', 'birthDate', 'mustChangePassword']
  //   )
  // );

  const diff = new MapDiff(resource.data, request.resource.data);
  const whitelist = ['name', 'email', 'phone', 'avatar', 'birthDate', 'mustChangePassword'];

  const allowed =
    isDirector() || isSuperAdmin() || (isOwner(targetId) && diff.affectedKeys().hasOnly(whitelist));

  return { allowed, diff };
}

console.log('🛡️  Running Security Rule Verification for User Updates...\n');

const cases = [
  {
    name: 'Student updates their own name (allowed)',
    actorRole: 'student',
    actorId: 'student1',
    targetId: 'student1',
    oldData: { name: 'Old Name', role: 'student', classId: 'classA' },
    newData: { name: 'New Name', role: 'student', classId: 'classA' },
    expected: true,
  },
  {
    name: 'Student updates their own role (DENIED)',
    actorRole: 'student',
    actorId: 'student1',
    targetId: 'student1',
    oldData: { name: 'Student', role: 'student' },
    newData: { name: 'Student', role: 'superadmin' },
    expected: false,
  },
  {
    name: 'Student updates their own classId (DENIED)',
    actorRole: 'student',
    actorId: 'student1',
    targetId: 'student1',
    oldData: { name: 'Student', role: 'student', classId: 'classA' },
    newData: { name: 'Student', role: 'student', classId: 'classB' },
    expected: false,
  },
  {
    name: 'Student updates whitelisted fields (email, phone) (allowed)',
    actorRole: 'student',
    actorId: 'student1',
    targetId: 'student1',
    oldData: { name: 'Student', role: 'student' },
    newData: { name: 'Student', role: 'student', email: 'new@test.com', phone: '123456' },
    expected: true,
  },
  {
    name: 'Director updates a student role (allowed)',
    actorRole: 'director',
    actorId: 'director1',
    targetId: 'student1',
    oldData: { name: 'Student', role: 'student' },
    newData: { name: 'Student', role: 'prefect' },
    expected: true,
  },
  {
    name: 'Student adds a new field "permissions" (DENIED)',
    actorRole: 'student',
    actorId: 'student1',
    targetId: 'student1',
    oldData: { name: 'Student', role: 'student' },
    newData: { name: 'Student', role: 'student', permissions: 'full' },
    expected: false,
  },
  {
    name: 'Student tries to change someone else profile (DENIED)',
    actorRole: 'student',
    actorId: 'student1',
    targetId: 'student2',
    oldData: { name: 'Student2', role: 'student' },
    newData: { name: 'Student2', role: 'student', phone: '123' },
    expected: false,
  },
];

let passed = 0;
let failed = 0;

cases.forEach((c) => {
  const { allowed, diff } = checkUpdateRule(c);

  if (allowed === c.expected) {
    passed++;
    console.log(`✅ ${c.name}: PASSED`);
  } else {
    failed++;
    console.error(`❌ ${c.name}: FAILED (Expected ${c.expected}, got ${allowed})`);
    console.log('   Affected Keys:', diff.affectedKeys().debug());
  }
});

console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);

if (failed > 0) process.exit(1);
