// scripts/verify_setup_rules.cjs

// Mock data
const attacker = { uid: 'attacker', role: 'none' };

// Helpers
function getMockAuth(user) { return { auth: { uid: user.uid } }; }
function isSetupOpen(dbEmpty) { return dbEmpty; }

function checkVulnerableRule(user, role, dbEmpty, configExistsAfter) {
  const isDirector = user.role === 'director';
  const isSuperAdmin = user.role === 'superadmin';
  return isDirector || isSuperAdmin || (
    isSetupOpen(dbEmpty) &&
    role === 'superadmin' &&
    configExistsAfter
  );
}

console.log('Testing Rule: existsAfter validation for setup.\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`✅ ${message}`);
  } else {
    failed++;
    console.error(`❌ ${message}`);
  }
}

// 1. Database is empty (setup mode) AND config created in batch
assert(checkVulnerableRule(attacker, 'superadmin', true, true) === true, 'Scenario 1: Setup mode with atomic batch writes (Allowed)');

// 2. Database is empty (setup mode) BUT config NOT created in batch (Race condition attempt)
assert(checkVulnerableRule(attacker, 'superadmin', true, false) === false, 'Scenario 2: Setup mode without atomic lock doc creation (Blocked)');

// 3. Database is NOT empty (setup closed)
assert(checkVulnerableRule(attacker, 'superadmin', false, false) === false, 'Scenario 3: Setup closed (Blocked)');

console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);

if (failed > 0) process.exit(1);
