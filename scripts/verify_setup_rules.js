/**
 * scripts/verify_setup_rules.js
 */

function checkCreateSuperAdminRule(testCase) {
  const { isSetupOpen, role, setupConfigExistsAfter } = testCase;

  const isDirector = false;
  const isSuperAdmin = false;
  const isSetupOpenVal = isSetupOpen;
  const requestDataRole = role;
  const existsAfterVal = setupConfigExistsAfter;

  const allowed = isDirector || isSuperAdmin || (isSetupOpenVal && requestDataRole === 'superadmin' && existsAfterVal);

  return allowed;
}

console.log('🛡️  Running Security Rule Verification for Setup Atomicity...\n');

const cases = [
  {
    name: 'SuperAdmin created atomically (setup open, lock created)',
    isSetupOpen: true,
    role: 'superadmin',
    setupConfigExistsAfter: true,
    expected: true,
  },
  {
    name: 'SuperAdmin created without lock document (DENIED)',
    isSetupOpen: true,
    role: 'superadmin',
    setupConfigExistsAfter: false,
    expected: false,
  },
  {
    name: 'SuperAdmin created when setup is closed (DENIED)',
    isSetupOpen: false,
    role: 'superadmin',
    setupConfigExistsAfter: true,
    expected: false,
  },
  {
    name: 'Creating non-superadmin via setup route (DENIED)',
    isSetupOpen: true,
    role: 'student',
    setupConfigExistsAfter: true,
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
