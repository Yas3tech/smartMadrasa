/**
 * scripts/verify_setup_rules.js
 * Mocks the Firestore Security Rules logic for atomic superadmin creation via setup.
 */

function checkCreateRule(testCase) {
  const { actorRole, actorId, newData, writes } = testCase;

  // Mock initial DB state (empty for setup)
  const isSetupOpen = true;

  const isDirector = () => actorRole === 'director';
  const isSuperAdmin = () => actorRole === 'superadmin';

  // Mock existsAfter logic
  const checkExistsAfter = (path) => {
     // Check if the document is being written in this batch
     if (writes && writes.some(w => w.path === path)) {
        return true;
     }
     return false; // Assuming it doesn't exist initially as per isSetupOpen
  };

  // The actual rule logic being tested:
  // allow create: if isDirector() || isSuperAdmin() || (isSetupOpen() && request.resource.data.role == 'superadmin' && existsAfter(/databases/$(database)/documents/_setup/config));

  const allowed = isDirector() || isSuperAdmin() ||
                  (isSetupOpen && newData.role === 'superadmin' && checkExistsAfter('/databases/$(database)/documents/_setup/config'));

  return { allowed };
}

console.log('🛡️  Running Security Rule Verification for Setup Atomic Creation...\n');

const cases = [
  {
    name: 'Unauthenticated user creates superadmin with atomic batch (allowed)',
    actorRole: null,
    actorId: 'newUser',
    newData: { role: 'superadmin' },
    writes: [
      { path: '/databases/$(database)/documents/users/newUser' },
      { path: '/databases/$(database)/documents/_setup/config' }
    ],
    expected: true,
  },
  {
    name: 'Unauthenticated user creates superadmin without atomic lock (DENIED)',
    actorRole: null,
    actorId: 'newUser2',
    newData: { role: 'superadmin' },
    writes: [
      { path: '/databases/$(database)/documents/users/newUser2' }
    ],
    expected: false,
  },
];

let passed = 0;
let failed = 0;

cases.forEach((c) => {
  const { allowed } = checkCreateRule(c);

  if (allowed === c.expected) {
    passed++;
    console.log(`✅ ${c.name}: PASSED`);
  } else {
    failed++;
    console.error(`❌ ${c.name}: FAILED (Expected ${c.expected}, got ${allowed})`);
  }
});

console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);

if (failed > 0) process.exit(1);
