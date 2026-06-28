/**
 * scripts/verify_setup_rules_mock.js
 * Mocks the Firestore Security Rules logic for setup config creation (atomic batching).
 */

class DocumentContext {
  constructor(data) {
    this.data = data;
  }
}

function checkSetupRule(testCase) {
  const {
    actorRole,
    actorId,
    setupExistsInitial,
    setupExistsAfter,
    userExistsAfter,
    userAfterData
  } = testCase;

  // Mocks
  const request = {
    auth: { uid: actorId },
    resource: { data: userAfterData || {} },
  };

  // Mock database state
  const exists = (path) => {
    if (path === '/databases/$(database)/documents/_setup/config') return setupExistsInitial;
    return false;
  };

  const existsAfter = (path) => {
    if (path === '/databases/$(database)/documents/_setup/config') return setupExistsAfter;
    if (path === '/databases/$(database)/documents/users/$(request.auth.uid)') return userExistsAfter;
    return false;
  };

  const getAfter = (path) => {
    if (path === '/databases/$(database)/documents/users/$(request.auth.uid)') return new DocumentContext(userAfterData);
    return null;
  }

  const isSetupOpen = () => !exists('/databases/$(database)/documents/_setup/config');
  const isDirector = () => actorRole === 'director';
  const isSuperAdmin = () => actorRole === 'superadmin';

  // Rule for users creation
  // allow create: if isDirector() || isSuperAdmin() || (isSetupOpen() && request.resource.data.role == 'superadmin' && existsAfter(/databases/$(database)/documents/_setup/config));
  const usersCreateAllowed = isDirector() || isSuperAdmin() || (isSetupOpen() && request.resource.data.role === 'superadmin' && existsAfter('/databases/$(database)/documents/_setup/config'));

  // Rule for _setup/config creation
  // allow create: if !exists(/databases/$(database)/documents/_setup/config) && existsAfter(/databases/$(database)/documents/users/$(request.auth.uid)) && getAfter(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin';
  const setupCreateAllowed = !exists('/databases/$(database)/documents/_setup/config') && existsAfter('/databases/$(database)/documents/users/$(request.auth.uid)') && getAfter('/databases/$(database)/documents/users/$(request.auth.uid)') !== null && getAfter('/databases/$(database)/documents/users/$(request.auth.uid)').data.role === 'superadmin';

  return { usersCreateAllowed, setupCreateAllowed: setupExistsAfter ? setupCreateAllowed : false };
}

console.log('🛡️  Running Security Rule Verification for Setup Config...\n');

const cases = [
  {
    name: 'Atomic creation of superadmin and setup config (allowed)',
    actorRole: 'none',
    actorId: 'newUser',
    setupExistsInitial: false,
    setupExistsAfter: true,
    userExistsAfter: true,
    userAfterData: { role: 'superadmin' },
    expectedUsersCreate: true,
    expectedSetupCreate: true,
  },
  {
    name: 'Creation of superadmin without atomic setup config (DENIED)',
    actorRole: 'none',
    actorId: 'newUser',
    setupExistsInitial: false,
    setupExistsAfter: false,
    userExistsAfter: true,
    userAfterData: { role: 'superadmin' },
    expectedUsersCreate: false,
    expectedSetupCreate: false,
  },
  {
    name: 'Creation of setup config without atomic superadmin user (DENIED)',
    actorRole: 'none',
    actorId: 'newUser',
    setupExistsInitial: false,
    setupExistsAfter: true,
    userExistsAfter: false,
    userAfterData: null,
    expectedUsersCreate: false,
    expectedSetupCreate: false,
  },
  {
    name: 'Creation of superadmin when setup config already exists (DENIED)',
    actorRole: 'none',
    actorId: 'newUser',
    setupExistsInitial: true,
    setupExistsAfter: true,
    userExistsAfter: true,
    userAfterData: { role: 'superadmin' },
    expectedUsersCreate: false,
    expectedSetupCreate: false,
  }
];

let passed = 0;
let failed = 0;

cases.forEach((c) => {
  const { usersCreateAllowed, setupCreateAllowed } = checkSetupRule(c);

  if (usersCreateAllowed === c.expectedUsersCreate && setupCreateAllowed === c.expectedSetupCreate) {
    passed++;
    console.log(`✅ ${c.name}: PASSED`);
  } else {
    failed++;
    console.error(`❌ ${c.name}: FAILED (Expected usersCreate: ${c.expectedUsersCreate}, got ${usersCreateAllowed}. Expected setupCreate: ${c.expectedSetupCreate}, got ${setupCreateAllowed})`);
  }
});

console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);

if (failed > 0) process.exit(1);
