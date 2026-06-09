/**
 * scripts/verify_setup_rules.cjs
 * Mocks the Firestore Security Rules logic for setup initialization to verify atomic checks.
 */

function checkSetupRule(testCase) {
  const { actorRole, setupDocExists, requestData, writes } = testCase;

  const isSuperAdmin = () => actorRole === 'superadmin';
  const isDirector = () => actorRole === 'director';
  const isSetupOpen = () => !setupDocExists;
  const existsAfter = (path) => writes && writes.some(w => w.path === path);

  const allowed = isDirector() || isSuperAdmin() || (
    isSetupOpen() &&
    requestData.role === 'superadmin' &&
    existsAfter('_setup/config')
  );

  return allowed;
}

const cases = [
  {
    name: 'Unauthenticated user creates superadmin and config atomically (allowed)',
    actorRole: 'guest',
    setupDocExists: false,
    requestData: { role: 'superadmin' },
    writes: [{ path: '_setup/config' }],
    expected: true
  },
  {
    name: 'Unauthenticated user creates superadmin without config (DENIED)',
    actorRole: 'guest',
    setupDocExists: false,
    requestData: { role: 'superadmin' },
    writes: [],
    expected: false
  },
  {
    name: 'Unauthenticated user creates superadmin when DB is NOT empty (DENIED)',
    actorRole: 'guest',
    setupDocExists: true,
    requestData: { role: 'superadmin' },
    writes: [{ path: '_setup/config' }],
    expected: false
  }
];

let passed = 0;
let failed = 0;

console.log('🛡️  Running Security Rule Verification for Setup Rules...\n');

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
