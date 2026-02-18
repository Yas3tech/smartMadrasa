/**
 * scripts/verify_homework_rules.js
 * Mocks the Firestore Security Rules logic for Homework to demonstrate the vulnerability and verify the fix.
 */

function checkHomeworkRule(testCase, useFix = false) {
  const { actorRole, actorId, teacherClassIds, method, oldData, newData } = testCase;

  // Mocks
  const request = {
    auth: { uid: actorId },
    resource: { data: newData },
  };
  const resource = { data: oldData };

  // Helper functions
  const isAuthenticated = () => request.auth != null;
  const getUserData = () => ({ role: actorRole, classIds: teacherClassIds || [] });
  const isDirector = () => actorRole === 'director';
  const isSuperAdmin = () => actorRole === 'superadmin';
  const isTeacher = () => actorRole === 'teacher';

  // --- VULNERABLE LOGIC (Current) ---
  if (!useFix) {
    // allow write: if isTeacher() || isDirector() || isSuperAdmin();
    // (write covers create, update, delete)
    return isTeacher() || isDirector() || isSuperAdmin();
  }

  // --- SECURE LOGIC (Proposed Fix) ---

  const isTeacherForClass = (classId) => isTeacher() && getUserData().classIds.includes(classId);

  // allow create
  if (method === 'create') {
    return isDirector() || isSuperAdmin() || isTeacherForClass(request.resource.data.classId);
  }

  // allow update
  if (method === 'update') {
    return (
      isDirector() ||
      isSuperAdmin() ||
      (isTeacherForClass(request.resource.data.classId) &&
        resource.data.classId === request.resource.data.classId)
    );
  }

  // allow delete
  if (method === 'delete') {
    // In delete, request.resource is null in real Firestore, so we check resource.data
    return isDirector() || isSuperAdmin() || isTeacherForClass(resource.data.classId);
  }

  return false;
}

console.log('🛡️  Running Security Rule Verification for Homework...\n');

const cases = [
  {
    name: 'Teacher creates homework for their OWN class',
    actorRole: 'teacher',
    actorId: 'teacher1',
    teacherClassIds: ['classA', 'classB'],
    method: 'create',
    oldData: null,
    newData: { classId: 'classA', title: 'HW1' },
    shouldBeAllowed: true,
  },
  {
    name: 'Teacher creates homework for OTHER class (VULNERABILITY)',
    actorRole: 'teacher',
    actorId: 'teacher1',
    teacherClassIds: ['classA'],
    method: 'create',
    oldData: null,
    newData: { classId: 'classB', title: 'HW2' }, // ClassB not in teacher's classes
    shouldBeAllowed: false, // Should be denied, but current rules allow it
  },
  {
    name: 'Teacher updates homework for their OWN class',
    actorRole: 'teacher',
    actorId: 'teacher1',
    teacherClassIds: ['classA'],
    method: 'update',
    oldData: { classId: 'classA', title: 'HW1' },
    newData: { classId: 'classA', title: 'HW1 Updated' },
    shouldBeAllowed: true,
  },
  {
    name: 'Teacher moves homework to OTHER class (VULNERABILITY)',
    actorRole: 'teacher',
    actorId: 'teacher1',
    teacherClassIds: ['classA'],
    method: 'update',
    oldData: { classId: 'classA', title: 'HW1' },
    newData: { classId: 'classB', title: 'HW1' },
    shouldBeAllowed: false,
  },
  {
    name: 'Teacher moves homework to another class they TEACH',
    actorRole: 'teacher',
    actorId: 'teacher1',
    teacherClassIds: ['classA', 'classB'],
    method: 'update',
    oldData: { classId: 'classA', title: 'HW1' },
    newData: { classId: 'classB', title: 'HW1' },
    // Should be denied because we don't want accidental class swaps
    shouldBeAllowed: false,
  },
  {
    name: 'Teacher deletes homework for their OWN class',
    actorRole: 'teacher',
    actorId: 'teacher1',
    teacherClassIds: ['classA'],
    method: 'delete',
    oldData: { classId: 'classA', title: 'HW1' },
    newData: null,
    shouldBeAllowed: true,
  },
  {
    name: 'Teacher deletes homework for OTHER class (VULNERABILITY)',
    actorRole: 'teacher',
    actorId: 'teacher1',
    teacherClassIds: ['classA'],
    method: 'delete',
    oldData: { classId: 'classB', title: 'HW1' },
    newData: null,
    shouldBeAllowed: false,
  },
];

console.log('--- Phase 1: Verify Vulnerability (Current Rules) ---');
let vulnerabilityConfirmed = false;
cases.forEach((c) => {
  const allowed = checkHomeworkRule(c, false); // useFix = false
  const isVulnerable = allowed === true && c.shouldBeAllowed === false;

  if (isVulnerable) {
    console.log(`⚠️  ${c.name}: ALLOWED (Vulnerability Confirmed)`);
    if (c.name.includes('VULNERABILITY')) vulnerabilityConfirmed = true;
  } else if (allowed === c.shouldBeAllowed) {
    console.log(`✅ ${c.name}: Correctly handled as ${allowed}`);
  } else {
    console.log(`ℹ️  ${c.name}: Result ${allowed}`);
  }
});

if (vulnerabilityConfirmed) {
  console.log(
    '\n🚨 VULNERABILITY CONFIRMED: Teachers can access/modify homework for classes they do not teach.\n'
  );
} else {
  console.log('\n❓ Vulnerability NOT confirmed. Check logic.\n');
}

console.log('--- Phase 2: Verify Fix (Proposed Rules) ---');
let passed = 0;
let failed = 0;

cases.forEach((c) => {
  const allowed = checkHomeworkRule(c, true); // useFix = true

  if (allowed === c.shouldBeAllowed) {
    passed++;
    console.log(`✅ ${c.name}: PASSED`);
  } else {
    failed++;
    console.error(`❌ ${c.name}: FAILED (Expected ${c.shouldBeAllowed}, got ${allowed})`);
  }
});

console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);

if (failed > 0) process.exit(1);
