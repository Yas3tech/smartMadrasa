/**
 * scripts/verify_setup_rules.cjs
 * Mocks the Firestore Security Rules logic for setup atomic creation.
 */

function checkSetupRule(testCase) {
  const { isSetupOpenInit, isSetupClosingBatch, role } = testCase;

  // Mocking exists and existsAfter
  const isSetupOpen = () => isSetupOpenInit;
  const isSetupClosing = () => isSetupClosingBatch;

  const isDirector = () => false;
  const isSuperAdmin = () => false;

  const allowed = isDirector() || isSuperAdmin() || (isSetupOpen() && isSetupClosing() && role === 'superadmin');

  return allowed;
}

console.log('🛡️  Running Security Rule Verification for Setup...\n');

const cases = [
  {
    name: 'Setup open, closed in batch, creating superadmin (allowed)',
    isSetupOpenInit: true,
    isSetupClosingBatch: true,
    role: 'superadmin',
    expected: true
  },
  {
    name: 'Setup open, NOT closed in batch, creating superadmin (DENIED)',
    isSetupOpenInit: true,
    isSetupClosingBatch: false,
    role: 'superadmin',
    expected: false
  },
  {
    name: 'Setup already closed, closed in batch, creating superadmin (DENIED)',
    isSetupOpenInit: false,
    isSetupClosingBatch: true,
    role: 'superadmin',
    expected: false
  }
];

let passed = 0;
let failed = 0;

cases.forEach(c => {
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
