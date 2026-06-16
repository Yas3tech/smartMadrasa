function checkSetupCreation(testCase) {
  const { isSetupDocExistingInitially, role, includesSetupWriteInBatch } = testCase;

  // Mocking the rule logic:
  // allow create: if isDirector() || isSuperAdmin() || (
  //   isSetupOpen() &&
  //   request.resource.data.role == 'superadmin' &&
  //   existsAfter(/databases/$(database)/documents/_setup/config)
  // );

  // isSetupOpen()
  const isSetupOpen = !isSetupDocExistingInitially;

  // existsAfter()
  // Mock logic: existsAfter is true if the document exists initially OR if it's being written in the current batch
  const existsAfter = isSetupDocExistingInitially || includesSetupWriteInBatch;

  // The rule condition (assuming not director/admin for setup test)
  const allowed = isSetupOpen && role === 'superadmin' && existsAfter;

  return { allowed };
}

console.log('🛡️  Running Security Rule Verification for Setup Creation...\n');

const cases = [
  {
    name: 'Create superadmin when setup open, WITH batch write for config (ALLOWED)',
    isSetupDocExistingInitially: false,
    role: 'superadmin',
    includesSetupWriteInBatch: true,
    expected: true,
  },
  {
    name: 'Create superadmin when setup open, WITHOUT batch write for config (DENIED)',
    isSetupDocExistingInitially: false,
    role: 'superadmin',
    includesSetupWriteInBatch: false,
    expected: false,
  },
  {
    name: 'Create standard user during setup (DENIED)',
    isSetupDocExistingInitially: false,
    role: 'student',
    includesSetupWriteInBatch: true,
    expected: false,
  },
  {
    name: 'Create superadmin when setup is closed (DENIED)',
    isSetupDocExistingInitially: true,
    role: 'superadmin',
    includesSetupWriteInBatch: true,
    expected: false,
  },
];

let passed = 0;
let failed = 0;

cases.forEach((c) => {
  const { allowed } = checkSetupCreation(c);

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
