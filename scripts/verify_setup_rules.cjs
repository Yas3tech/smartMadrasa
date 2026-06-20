/**
 * scripts/verify_setup_rules.cjs
 * Mocks the Firestore Security Rules logic for setup rule verification.
 */

function checkCreateSuperAdminRule(testCase) {
  const { setupConfigExists, setupConfigInBatch, newRole } = testCase;

  // Mock isSetupOpen()
  const isSetupOpen = !setupConfigExists;

  // Mock existsAfter(/databases/$(database)/documents/_setup/config)
  // existsAfter returns true if the document exists in the DB OR if it is being written in the current batch
  const existsAfterSetupConfig = setupConfigExists || setupConfigInBatch;

  // Mock isDirector or isSuperAdmin
  const isDirector = false;
  const isSuperAdmin = false;

  // The rule being tested:
  const allowed = isDirector || isSuperAdmin || (
    isSetupOpen && newRole === 'superadmin' && existsAfterSetupConfig
  );

  return allowed;
}

console.log('🛡️  Running Security Rule Verification for First Run Setup...\n');

const cases = [
  {
    name: 'Create superadmin when setup is open AND config is in batch (allowed)',
    setupConfigExists: false,
    setupConfigInBatch: true,
    newRole: 'superadmin',
    expected: true,
  },
  {
    name: 'Create superadmin when setup is open BUT config is NOT in batch (DENIED)',
    setupConfigExists: false,
    setupConfigInBatch: false,
    newRole: 'superadmin',
    expected: false,
  },
  {
    name: 'Create superadmin when setup is CLOSED (config exists) (DENIED)',
    setupConfigExists: true,
    setupConfigInBatch: false,
    newRole: 'superadmin',
    expected: false,
  },
  {
    name: 'Create standard user when setup is open AND config is in batch (DENIED)',
    setupConfigExists: false,
    setupConfigInBatch: true,
    newRole: 'student',
    expected: false,
  }
];

let passed = 0;
let failed = 0;

cases.forEach((c) => {
  const allowed = checkCreateSuperAdminRule(c);

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
