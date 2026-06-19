/**
 * scripts/verify_setup_rules.cjs
 * Mocks the Firestore Security Rules logic for First Run Setup to verify the atomic creation fix.
 */

function checkSetupRule(testCase, useFix = false) {
  const { isSetupDocumentExisting, isSetupDocumentBeingCreated, method, role } = testCase;

  // Helper functions matching firestore.rules
  const isSetupOpen = () => !isSetupDocumentExisting;

  // --- VULNERABLE LOGIC (Current) ---
  if (!useFix) {
    if (method === 'create') {
      return isSetupOpen() && role === 'superadmin';
    }
    return false;
  }

  // --- SECURE LOGIC (Fix) ---
  if (method === 'create') {
    return (
      isSetupOpen() &&
      role === 'superadmin' &&
      isSetupDocumentBeingCreated // Mocks existsAfter(/databases/$(database)/documents/_setup/config)
    );
  }

  return false;
}

console.log('🛡️  Running Security Rule Verification for First Run Setup...\n');

const cases = [
  {
    name: 'Create superadmin when setup is open (without atomic config creation) - VULNERABILITY',
    isSetupDocumentExisting: false,
    isSetupDocumentBeingCreated: false,
    method: 'create',
    role: 'superadmin',
    shouldBeAllowedVulnerable: true, // Vulnerable logic allows this
    shouldBeAllowedFixed: false,     // Fixed logic must deny this
  },
  {
    name: 'Create superadmin when setup is open (WITH atomic config creation)',
    isSetupDocumentExisting: false,
    isSetupDocumentBeingCreated: true,
    method: 'create',
    role: 'superadmin',
    shouldBeAllowedVulnerable: true,
    shouldBeAllowedFixed: true,
  },
  {
    name: 'Create superadmin when setup is closed',
    isSetupDocumentExisting: true,
    isSetupDocumentBeingCreated: false,
    method: 'create',
    role: 'superadmin',
    shouldBeAllowedVulnerable: false,
    shouldBeAllowedFixed: false,
  },
];

console.log('--- Phase 1: Verify Vulnerability (Current Rules) ---');
let vulnerabilityConfirmed = false;
cases.forEach((c) => {
  const allowed = checkSetupRule(c, false);
  const isVulnerable = allowed === true && c.shouldBeAllowedFixed === false;

  if (isVulnerable) {
    console.log(`⚠️  ${c.name}: ALLOWED (Vulnerability Confirmed)`);
    vulnerabilityConfirmed = true;
  } else if (allowed === c.shouldBeAllowedVulnerable) {
    console.log(`✅ ${c.name}: Correctly handled as ${allowed}`);
  } else {
    console.log(`ℹ️  ${c.name}: Result ${allowed}`);
  }
});

if (vulnerabilityConfirmed) {
  console.log(
    '\n🚨 VULNERABILITY CONFIRMED: Superadmin creation is allowed without atomic lock document creation.\n'
  );
}

console.log('--- Phase 2: Verify Fix (Proposed Rules) ---');
let passed = 0;
let failed = 0;

cases.forEach((c) => {
  const allowed = checkSetupRule(c, true);

  if (allowed === c.shouldBeAllowedFixed) {
    passed++;
    console.log(`✅ ${c.name}: PASSED`);
  } else {
    failed++;
    console.error(`❌ ${c.name}: FAILED (Expected ${c.shouldBeAllowedFixed}, got ${allowed})`);
  }
});

console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);

if (failed > 0) process.exit(1);
