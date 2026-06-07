/**
 * scripts/verify_setup_rules_exists_after.cjs
 * Mocks the Firestore Security Rules logic for setup and user creation.
 */

function checkSetupRule(testCase) {
  const { isSetupExists, operation, collection, requestData, hasBatchedSetupConfig } = testCase;

  // Mock exists() for setup config
  const exists = (path) => {
    if (path === '/databases/$(database)/documents/_setup/config') {
      return isSetupExists;
    }
    return false;
  };

  const existsAfter = (path) => {
    if (path === '/databases/$(database)/documents/_setup/config') {
      // existsAfter is true if it already existed before transaction OR if it is being written in this transaction
      return isSetupExists || hasBatchedSetupConfig;
    }
    return false;
  };

  const getAfter = (path) => {
    if (path === '/databases/$(database)/documents/_setup/config' && hasBatchedSetupConfig) {
      return { data: { status: 'locked' } };
    }
    return null;
  }


  const isSetupOpen = () => !exists('/databases/$(database)/documents/_setup/config');

  // Mocks
  const request = {
    resource: { data: requestData },
  };

  // The actual rule logic being tested:

  // match /_setup/{docId}
  // allow create: if !exists(/databases/$(database)/documents/_setup/config);

  // match /users/{userId}
  // allow create: if isDirector() || isSuperAdmin() || (isSetupOpen() && request.resource.data.role == 'superadmin' && existsAfter(/databases/$(database)/documents/_setup/config));

  let allowed = false;

  if (collection === '_setup') {
    if (operation === 'create') {
        allowed = isSetupOpen();
    }
  } else if (collection === 'users') {
    if (operation === 'create') {
        // Assume unauthenticated for this critical path test
        const isDirector = () => false;
        const isSuperAdmin = () => false;

        allowed = isDirector() || isSuperAdmin() || (isSetupOpen() && request.resource.data.role === 'superadmin' && existsAfter('/databases/$(database)/documents/_setup/config'));
    }
  }

  return { allowed };
}

console.log('🛡️  Running Security Rule Verification for Setup with existsAfter...\n');

const cases = [
  {
    name: 'Unauthenticated user creates superadmin when setup is open AND writes setup config (Batch allowed)',
    isSetupExists: false,
    operation: 'create',
    collection: 'users',
    requestData: { role: 'superadmin' },
    hasBatchedSetupConfig: true,
    expected: true,
  },
  {
    name: 'Unauthenticated user creates superadmin when setup is open BUT DOES NOT write setup config (DENIED)',
    isSetupExists: false,
    operation: 'create',
    collection: 'users',
    requestData: { role: 'superadmin' },
    hasBatchedSetupConfig: false,
    expected: false,
  },
  {
    name: 'Unauthenticated user creates student when setup is open (DENIED)',
    isSetupExists: false,
    operation: 'create',
    collection: 'users',
    requestData: { role: 'student' },
    hasBatchedSetupConfig: true,
    expected: false,
  },
];

let passed = 0;
let failed = 0;

cases.forEach((c) => {
  const { allowed } = checkSetupRule(c);

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
