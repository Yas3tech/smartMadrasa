/**
 * scripts/verify_setup_rules.js
 * Mocks the Firestore Security Rules logic for setup to verify the transaction atomicity.
 */

function checkSetupRule(testCase) {
  const { isSetupDocCreated } = testCase;

  // Mocks
  const database = 'default';

  // Helper functions from rules
  const isSetupOpen = () => true; // Assume setup is initially open for these tests

  // Mock existsAfter
  const existsAfter = (path) => {
     if (path === `/databases/${database}/documents/_setup/config`) {
         return isSetupDocCreated;
     }
     return false;
  };

  const isDirector = () => false;
  const isSuperAdmin = () => false;

  const request = { resource: { data: { role: 'superadmin' } } };

  // The actual rule logic being tested:
  // allow create: if isDirector() || isSuperAdmin() || (isSetupOpen() && existsAfter(/databases/$(database)/documents/_setup/config) && request.resource.data.role == 'superadmin');

  const allowed = isDirector() || isSuperAdmin() || (isSetupOpen() && existsAfter(`/databases/${database}/documents/_setup/config`) && request.resource.data.role == 'superadmin');

  return { allowed };
}

console.log('🛡️  Running Security Rule Verification for Setup Transactions...\n');

const cases = [
  {
    name: 'Create superadmin WITH batched _setup/config (allowed)',
    isSetupDocCreated: true,
    expected: true,
  },
  {
    name: 'Create superadmin WITHOUT batched _setup/config (DENIED)',
    isSetupDocCreated: false,
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
