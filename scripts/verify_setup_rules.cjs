const assert = require('assert');

function isSetupOpen() {
  return false; // Mock implementation since we are testing atomic rules not dependent on this helper
}

function checkCreateRule(request, isSetupOpenMock) {
  const isDirector = false;
  const isSuperAdmin = false;
  const hasSetupConfig = request.hasSetupConfig;
  const isSetupConfigCreatedInBatch = request.isSetupConfigCreatedInBatch;

  // The updated rule logic:
  return isDirector || isSuperAdmin || (!hasSetupConfig && request.resource.data.role === 'superadmin' && isSetupConfigCreatedInBatch);
}

console.log('🛡️  Running Security Rule Verification for Setup Atomicity...\n');

let passed = true;

const test1 = checkCreateRule({ hasSetupConfig: false, resource: { data: { role: 'superadmin' } }, isSetupConfigCreatedInBatch: true }, true);
if (!test1) { passed = false; console.error('❌ Failed: Should allow creation when DB is empty and setup config is created in batch'); }
else console.log('✅ Passed: Allow atomic superadmin creation');

const test2 = checkCreateRule({ hasSetupConfig: false, resource: { data: { role: 'superadmin' } }, isSetupConfigCreatedInBatch: false }, true);
if (test2) { passed = false; console.error('❌ Failed: Should deny creation if setup config is not created in the same batch'); }
else console.log('✅ Passed: Deny non-atomic superadmin creation');

const test3 = checkCreateRule({ hasSetupConfig: true, resource: { data: { role: 'superadmin' } }, isSetupConfigCreatedInBatch: true }, false);
if (test3) { passed = false; console.error('❌ Failed: Should deny creation if DB is not empty'); }
else console.log('✅ Passed: Deny creation when DB is already configured');

if (!passed) process.exit(1);
