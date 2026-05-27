/**
 * scripts/verify_setup_rules.js
 * Mocks the Firestore Security Rules logic for setup writes
 */

function checkSetupRule(testCase) {
  const { isSetupOpen, writes, authUid } = testCase;

  // Mocks
  const exists = (path) => {
    if (path === '_setup/config') return !isSetupOpen;
    return false;
  };

  const existsAfter = (path) => {
    return writes.some(w => w.path === path && w.type === 'create') || exists(path);
  };

  const getAfter = (path) => {
    const write = writes.find(w => w.path === path && w.type === 'create');
    if (write) return { data: write.data };
    return null;
  };

  let allowed = true;

  for (const write of writes) {
    if (write.path === `users/${authUid}`) {
      const request = {
        auth: { uid: authUid },
        resource: { data: write.data }
      };

      const ruleAllowed =
        (!exists('_setup/config') &&
         request.resource.data.role === 'superadmin' &&
         existsAfter('_setup/config'));

      if (!ruleAllowed) allowed = false;
    } else if (write.path === '_setup/config') {
       const request = {
         auth: { uid: authUid },
         resource: { data: write.data }
       };

       const ruleAllowed =
         !exists('_setup/config') &&
         existsAfter(`users/${authUid}`) &&
         getAfter(`users/${authUid}`).data.role === 'superadmin';

       if (!ruleAllowed) allowed = false;
    } else {
      allowed = false; // unknown write
    }
  }

  return allowed;
}

console.log('🛡️  Running Security Rule Verification for Setup...\n');

const cases = [
  {
    name: 'Atomic setup with batch (Allowed)',
    isSetupOpen: true,
    authUid: 'admin1',
    writes: [
      { path: 'users/admin1', type: 'create', data: { role: 'superadmin' } },
      { path: '_setup/config', type: 'create', data: { status: 'locked' } }
    ],
    expected: true
  },
  {
    name: 'Create user without locking setup (DENIED)',
    isSetupOpen: true,
    authUid: 'admin1',
    writes: [
      { path: 'users/admin1', type: 'create', data: { role: 'superadmin' } }
    ],
    expected: false
  },
  {
    name: 'Lock setup without creating admin user (DENIED)',
    isSetupOpen: true,
    authUid: 'admin1',
    writes: [
      { path: '_setup/config', type: 'create', data: { status: 'locked' } }
    ],
    expected: false
  },
  {
    name: 'Create normal user during setup (DENIED)',
    isSetupOpen: true,
    authUid: 'user1',
    writes: [
      { path: 'users/user1', type: 'create', data: { role: 'student' } },
      { path: '_setup/config', type: 'create', data: { status: 'locked' } }
    ],
    expected: false
  },
  {
    name: 'Attempt setup when already locked (DENIED)',
    isSetupOpen: false,
    authUid: 'admin2',
    writes: [
      { path: 'users/admin2', type: 'create', data: { role: 'superadmin' } },
      { path: '_setup/config', type: 'create', data: { status: 'locked' } }
    ],
    expected: false
  }
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
