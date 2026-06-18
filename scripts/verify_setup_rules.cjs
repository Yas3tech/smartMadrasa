// Mock test for CRIT-01: Atomic Setup Verification

class MapDiff {
  constructor(oldData, newData) {
    this.oldData = oldData || {};
    this.newData = newData || {};
  }
}

function checkSetupRule(testCase) {
  const { isSetupOpenInit, isBatch, setupDocData, userDocData, authUid } = testCase;

  // Mock database state
  const mockDb = {
    '_setup/config': isSetupOpenInit ? null : { status: 'locked' },
    [`users/${authUid}`]: null
  };

  // Mock after-batch database state
  const mockDbAfter = { ...mockDb };
  if (isBatch && setupDocData) mockDbAfter['_setup/config'] = setupDocData;
  if (isBatch && userDocData) mockDbAfter[`users/${authUid}`] = userDocData;

  // Mock functions
  const exists = (path) => mockDb[path] !== null;
  const existsAfter = (path) => mockDbAfter[path] !== null;
  const getAfter = (path) => ({ data: mockDbAfter[path] });

  const isSetupOpen = () => !exists('_setup/config');

  // Rules logic
  const isDirector = () => false;
  const isSuperAdmin = () => false;

  // User rule evaluation
  let userAllowed = false;
  if (userDocData) {
    const request = { resource: { data: userDocData }, auth: { uid: authUid } };
    userAllowed = isDirector() || isSuperAdmin() || (
      isSetupOpen() &&
      request.resource.data.role === 'superadmin' &&
      existsAfter('_setup/config')
    );
  }

  // Setup config rule evaluation
  let setupAllowed = false;
  if (setupDocData) {
    const docId = 'config';
    const request = { resource: { data: setupDocData }, auth: { uid: authUid } };

    // Evaluate if user existsAfter to safely call getAfter
    const userExistsAfter = existsAfter(`users/${request.auth.uid}`);

    setupAllowed = docId === 'config' && !exists('_setup/config') &&
      userExistsAfter &&
      getAfter(`users/${request.auth.uid}`).data.role === 'superadmin';
  }

  return {
    userAllowed: userDocData ? userAllowed : null,
    setupAllowed: setupDocData ? setupAllowed : null
  };
}

console.log('🛡️  Running Security Rule Verification for Setup Atomicity (CRIT-01)...\n');

const cases = [
  {
    name: 'Valid Atomic Batch Setup (Allowed)',
    isSetupOpenInit: true,
    isBatch: true,
    authUid: 'admin1',
    userDocData: { role: 'superadmin' },
    setupDocData: { status: 'locked' },
    expectedUser: true,
    expectedSetup: true,
  },
  {
    name: 'Sequential / Non-atomic user creation (DENIED)',
    isSetupOpenInit: true,
    isBatch: false, // setupDocData is NOT going to be created in the same batch
    authUid: 'admin2',
    userDocData: { role: 'superadmin' },
    setupDocData: null,
    expectedUser: false,
    expectedSetup: null,
  },
  {
    name: 'Setup config created without user (DENIED)',
    isSetupOpenInit: true,
    isBatch: false,
    authUid: 'admin3',
    userDocData: null,
    setupDocData: { status: 'locked' },
    expectedUser: null,
    expectedSetup: false,
  },
  {
    name: 'Database not empty (Setup already complete) (DENIED)',
    isSetupOpenInit: false,
    isBatch: true,
    authUid: 'admin4',
    userDocData: { role: 'superadmin' },
    setupDocData: { status: 'locked' },
    expectedUser: false,
    expectedSetup: false,
  }
];

let passed = 0;
let failed = 0;

cases.forEach((c) => {
  const result = checkSetupRule(c);

  let match = true;
  if (c.userDocData && result.userAllowed !== c.expectedUser) match = false;
  if (c.setupDocData && result.setupAllowed !== c.expectedSetup) match = false;

  if (match) {
    passed++;
    console.log(`✅ ${c.name}: PASSED`);
  } else {
    failed++;
    console.error(`❌ ${c.name}: FAILED (Got User:${result.userAllowed}/Setup:${result.setupAllowed}, Expected User:${c.expectedUser}/Setup:${c.expectedSetup})`);
  }
});

console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);

if (failed > 0) process.exit(1);
