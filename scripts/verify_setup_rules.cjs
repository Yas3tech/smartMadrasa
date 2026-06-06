/**
 * scripts/verify_setup_rules.cjs
 * Mocks the Firestore Security Rules logic for setup to verify the existsAfter mechanism.
 */

function checkSetupRule(testCase) {
  const { isSetupOpen, requestedRole, lockDocExistsAfter, actorRole } = testCase;

  // Mock functions
  const isDirector = () => actorRole === 'director';
  const isSuperAdmin = () => actorRole === 'superadmin';

  // allow create: if isDirector() || isSuperAdmin() || (isSetupOpen() && request.resource.data.role == 'superadmin' && existsAfter(/databases/$(database)/documents/_setup/config));
  const allowed = isDirector() || isSuperAdmin() || (isSetupOpen && requestedRole === 'superadmin' && lockDocExistsAfter);

  return { allowed };
}

console.log('🛡️  Running Security Rule Verification for Setup...\n');

const cases = [
  {
    name: 'Unauth setup WITH lock doc creation (allowed)',
    actorRole: 'none',
    isSetupOpen: true,
    requestedRole: 'superadmin',
    lockDocExistsAfter: true,
    expected: true,
  },
  {
    name: 'Unauth setup WITHOUT lock doc creation (DENIED)',
    actorRole: 'none',
    isSetupOpen: true,
    requestedRole: 'superadmin',
    lockDocExistsAfter: false,
    expected: false,
  },
  {
    name: 'Setup closed (DENIED)',
    actorRole: 'none',
    isSetupOpen: false,
    requestedRole: 'superadmin',
    lockDocExistsAfter: true,
    expected: false,
  },
  {
    name: 'Unauth setup requesting director role (DENIED)',
    actorRole: 'none',
    isSetupOpen: true,
    requestedRole: 'director',
    lockDocExistsAfter: true,
    expected: false,
  },
];

let passed = 0;
let failed = 0;

cases.forEach((c) => {
  const { allowed } = checkSetupRule(c);

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
