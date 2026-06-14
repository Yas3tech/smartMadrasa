/**
 * scripts/verify_setup_rules.cjs
 * Mocks the Firestore Security Rules logic for setup config and superadmin creation.
 */

function checkSuperAdminCreationRule(testCase) {
  const { actorRole, writes, roleBeingCreated } = testCase;

  const isDirector = () => actorRole === 'director';
  const isSuperAdmin = () => actorRole === 'superadmin';

  const configExistsInitially = testCase.setupConfigExistsInitially;
  const exists = () => configExistsInitially;
  const existsAfter = () => configExistsInitially || writes.some(w => w.path === '_setup/config');

  const allowed = isDirector() || isSuperAdmin() || (
    !exists() &&
    existsAfter() &&
    roleBeingCreated === 'superadmin'
  );

  return { allowed };
}

console.log('🛡️  Running Security Rule Verification for Setup Rules...\n');

const cases = [
  {
    name: 'Unauthenticated user creates superadmin and locks setup in same batch (allowed)',
    actorRole: 'unauthenticated',
    setupConfigExistsInitially: false,
    roleBeingCreated: 'superadmin',
    writes: [
      { path: 'users/newAdmin', data: { role: 'superadmin' } },
      { path: '_setup/config', data: { status: 'locked' } }
    ],
    expected: true
  },
  {
    name: 'Unauthenticated user creates superadmin WITHOUT locking setup (DENIED)',
    actorRole: 'unauthenticated',
    setupConfigExistsInitially: false,
    roleBeingCreated: 'superadmin',
    writes: [
      { path: 'users/newAdmin', data: { role: 'superadmin' } }
    ],
    expected: false
  },
  {
    name: 'Unauthenticated user creates student account during setup (DENIED)',
    actorRole: 'unauthenticated',
    setupConfigExistsInitially: false,
    roleBeingCreated: 'student',
    writes: [
      { path: 'users/newStudent', data: { role: 'student' } },
      { path: '_setup/config', data: { status: 'locked' } }
    ],
    expected: false
  },
  {
    name: 'Unauthenticated user tries to create superadmin AFTER setup is locked (DENIED)',
    actorRole: 'unauthenticated',
    setupConfigExistsInitially: true,
    roleBeingCreated: 'superadmin',
    writes: [
      { path: 'users/newAdmin', data: { role: 'superadmin' } },
      { path: '_setup/config', data: { status: 'locked' } }
    ],
    expected: false
  },
  {
    name: 'Existing SuperAdmin creates another superadmin (allowed)',
    actorRole: 'superadmin',
    setupConfigExistsInitially: true,
    roleBeingCreated: 'superadmin',
    writes: [
      { path: 'users/newAdmin', data: { role: 'superadmin' } }
    ],
    expected: true
  }
];

let passed = 0;
let failed = 0;

cases.forEach((c) => {
  const { allowed } = checkSuperAdminCreationRule(c);

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
