/**
 * scripts/verify_setup_rules.js
 * Mocks the Firestore Security Rules logic for setup to verify the existsAfter mechanism.
 */

function checkSetupRule(testCase) {
  const { isSetupExistsBefore, isSetupCreatedInBatch, newUserData } = testCase;

  function exists(path) {
    if (path.includes('_setup/config')) {
      return isSetupExistsBefore;
    }
    return false;
  }

  function existsAfter(path) {
    if (path.includes('_setup/config')) {
      return isSetupExistsBefore || isSetupCreatedInBatch;
    }
    return false;
  }

  const isDirector = () => false;
  const isSuperAdmin = () => false;

  const request = {
    resource: { data: newUserData }
  };

  const allowed = isDirector() || isSuperAdmin() || (
    !exists('/databases/$(database)/documents/_setup/config') &&
    existsAfter('/databases/$(database)/documents/_setup/config') &&
    request.resource.data.role === 'superadmin'
  );

  return allowed;
}

console.log('🛡️  Running Security Rule Verification for Setup Race Condition...\n');

const cases = [
  {
    name: 'Setup open, superadmin user created with setup config (Batch)',
    isSetupExistsBefore: false,
    isSetupCreatedInBatch: true,
    newUserData: { role: 'superadmin' },
    expected: true,
  },
  {
    name: 'Setup open, superadmin user created WITHOUT setup config (Exploit attempt)',
    isSetupExistsBefore: false,
    isSetupCreatedInBatch: false,
    newUserData: { role: 'superadmin' },
    expected: false,
  },
  {
    name: 'Setup closed, superadmin user created (Exploit attempt)',
    isSetupExistsBefore: true,
    isSetupCreatedInBatch: false,
    newUserData: { role: 'superadmin' },
    expected: false,
  },
];

let passed = 0;
let failed = 0;

cases.forEach((c) => {
  const allowed = checkSetupRule(c);

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
