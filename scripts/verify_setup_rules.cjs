/**
 * scripts/verify_setup_rules.cjs
 * Mocks the Firestore Security Rules logic for setup rule verification.
 */

class RulesMock {
  constructor(writes = []) {
    this.db = {
      '_setup/config': false // Starts without lock
    };
    this.writes = writes;
  }

  existsAfter(path) {
    // simulated getAfter/existsAfter logic
    const docPath = path.replace(/.*?\/documents\//, '');
    const willBeWritten = this.writes.some(w => w.path === docPath);
    return willBeWritten || this.db[docPath];
  }

  isSetupOpen() {
    return !this.db['_setup/config'];
  }

  checkCreateRule(request) {
    return (this.isSetupOpen() &&
            request.resource.data.role === 'superadmin' &&
            this.existsAfter('/databases/$(database)/documents/_setup/config'));
  }
}

console.log('🛡️  Running Security Rule Verification for Setup Atomicity...\n');

const cases = [
  {
    name: 'Superadmin creation WITH lock in batch (allowed)',
    writes: [
      { path: 'users/admin1', data: { role: 'superadmin' } },
      { path: '_setup/config', data: { status: 'locked' } }
    ],
    request: { resource: { data: { role: 'superadmin' } } },
    expected: true,
  },
  {
    name: 'Superadmin creation WITHOUT lock in batch (DENIED)',
    writes: [
      { path: 'users/admin1', data: { role: 'superadmin' } }
    ],
    request: { resource: { data: { role: 'superadmin' } } },
    expected: false,
  }
];

let passed = 0;
let failed = 0;

cases.forEach((c) => {
  const mock = new RulesMock(c.writes);
  const allowed = mock.checkCreateRule(c.request);

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
