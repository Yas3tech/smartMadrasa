/**
 * scripts/verify_setup_rules.js
 */

function checkSetupRule(testCase) {
  const { method, oldData, newData, writes } = testCase;

  // Mock `existsAfter` and `getAfter` based on writes array
  const existsAfter = (path) => {
    return writes.some(w => w.path === path);
  };

  const exists = (path) => {
    return oldData[path] !== undefined;
  };

  const getAfter = (path) => {
    const write = writes.find(w => w.path === path);
    return { data: write ? write.data : null };
  };

  const isSetupOpen = () => !exists('_setup/config');

  if (method === 'create_user') {
    return (
      (!exists('_setup/config') && newData.role === 'superadmin' && existsAfter('_setup/config'))
    );
  }

  if (method === 'create_setup') {
    return !exists('_setup/config') && existsAfter(`users/${newData.completedBy}`) && getAfter(`users/${newData.completedBy}`).data.role === 'superadmin';
  }

  return false;
}

const cases = [
  {
    name: 'Atomic setup creation',
    method: 'create_user',
    oldData: {},
    newData: { role: 'superadmin' },
    writes: [
      { path: 'users/user1', data: { role: 'superadmin' } },
      { path: '_setup/config', data: { completedBy: 'user1' } }
    ],
    shouldBeAllowed: true,
  },
  {
    name: 'Create user without setup doc',
    method: 'create_user',
    oldData: {},
    newData: { role: 'superadmin' },
    writes: [
      { path: 'users/user1', data: { role: 'superadmin' } }
    ],
    shouldBeAllowed: false,
  }
];

let failed = 0;

cases.forEach(c => {
  const allowed = checkSetupRule(c);
  if (allowed === c.shouldBeAllowed) {
    console.log(`✅ ${c.name}: PASSED`);
  } else {
    failed++;
    console.error(`❌ ${c.name}: FAILED (Expected ${c.shouldBeAllowed}, got ${allowed})`);
  }
});

if (failed > 0) process.exit(1);
