const assert = require('assert');

function checkSetupRule(testCase) {
  const { isSetupOpen, writesLock, role } = testCase;

  // The rule logic:
  // allow create: if isDirector() || isSuperAdmin() || (isSetupOpen() && locksSetup() && request.resource.data.role == 'superadmin');

  const isDirector = () => false; // We test unauthenticated scenario
  const isSuperAdmin = () => false; // We test unauthenticated scenario

  const locksSetup = () => writesLock;

  const allowed = isDirector() || isSuperAdmin() || (isSetupOpen && locksSetup() && role === 'superadmin');

  return allowed;
}

const cases = [
  {
    name: 'Setup open, writes lock, role superadmin (ALLOWED)',
    isSetupOpen: true,
    writesLock: true,
    role: 'superadmin',
    expected: true
  },
  {
    name: 'Setup open, DOES NOT write lock, role superadmin (DENIED)',
    isSetupOpen: true,
    writesLock: false,
    role: 'superadmin',
    expected: false
  },
  {
    name: 'Setup closed, writes lock, role superadmin (DENIED)',
    isSetupOpen: false,
    writesLock: true,
    role: 'superadmin',
    expected: false
  },
  {
    name: 'Setup open, writes lock, role student (DENIED)',
    isSetupOpen: true,
    writesLock: true,
    role: 'student',
    expected: false
  }
];

let failed = 0;
console.log('🛡️  Running Security Rule Verification for Setup Route...\n');

cases.forEach(c => {
  const allowed = checkSetupRule(c);
  if (allowed === c.expected) {
    console.log(`✅ ${c.name}: PASSED`);
  } else {
    failed++;
    console.error(`❌ ${c.name}: FAILED (Expected ${c.expected}, got ${allowed})`);
  }
});

if (failed > 0) process.exit(1);
