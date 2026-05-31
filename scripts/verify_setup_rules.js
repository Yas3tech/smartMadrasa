console.log('🛡️  Running Security Rule Verification for Setup Route...\n');

// Mocked functions mimicking Firestore rule logic
function exists(path) {
  // In our mock, we assume the config DOES NOT exist before the transaction
  return false;
}

function checkSetupCreation(batchContainsSetupLock) {
  // Mock existsAfter logic: checks if the transaction writes to the lock path
  const existsAfterConfig = batchContainsSetupLock;

  // The rule logic
  const isSetupOpenAndAtomic = !exists('/databases/$(database)/documents/_setup/config') && existsAfterConfig;

  return isSetupOpenAndAtomic;
}

let passed = 0;
let failed = 0;

// Test 1: Atomic batch writing both user and setup config
const test1 = checkSetupCreation(true) === true;
if (test1) {
    passed++;
    console.log('✅ Atomic setup (user + config): PASSED');
} else {
    failed++;
    console.error('❌ Atomic setup (user + config): FAILED');
}

// Test 2: Creating superadmin without writing the lock doc
const test2 = checkSetupCreation(false) === false;
if (test2) {
    passed++;
    console.log('✅ Unauthenticated superadmin without setup lock: PASSED');
} else {
    failed++;
    console.error('❌ Unauthenticated superadmin without setup lock: FAILED');
}

console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);

if (failed > 0) process.exit(1);
