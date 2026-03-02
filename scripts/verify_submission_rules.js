/**
 * scripts/verify_submission_rules.js
 * Mocks the Firestore Security Rules logic for Homework Submissions to demonstrate the vulnerability and verify the fix.
 */

function checkSubmissionRule(testCase, useFix = false) {
  const { actorRole, actorId, studentClassId, homeworkClassId, method } = testCase;

  // Mocks
  const request = {
    auth: { uid: actorId },
    resource: {
      data: {
        studentId: actorId, // claiming to be the student
        content: 'My Homework Submission',
      },
    },
  };

  // Mock getUserData
  const getUserData = () => {
    if (actorRole === 'student') return { role: 'student', classId: studentClassId };
    if (actorRole === 'parent') return { role: 'parent', childrenIds: [actorId] }; // simplified for parent
    return { role: actorRole };
  };

  const isAuthenticated = () => request.auth != null;
  const isStudent = () => actorRole === 'student';
  const isParent = () => actorRole === 'parent';

  // Mock get() for homework parent document
  const getHomeworkData = () => {
    return { classId: homeworkClassId };
  };

  // --- VULNERABLE LOGIC (Current) ---
  if (!useFix) {
    if (method === 'create') {
      return (
        isAuthenticated() &&
        ((isStudent() && request.resource.data.studentId == request.auth.uid) ||
          (isParent() && getUserData().childrenIds.includes(request.resource.data.studentId)))
      );
    }
    return false;
  }

  // --- SECURE LOGIC (Proposed Fix) ---
  if (method === 'create') {
    return (
      isAuthenticated() &&
      ((isStudent() &&
        request.resource.data.studentId == request.auth.uid &&
        // NEW CHECK: Verify student belongs to the class of the homework
        getUserData().classId == getHomeworkData().classId) ||
        (isParent() && getUserData().childrenIds.includes(request.resource.data.studentId)))
      // Parent check omitted for simplicity/scope of this fix, or can be added if we mock child data lookup
    );
  }

  return false;
}

console.log('🛡️  Running Security Rule Verification for Homework Submissions...\n');

const cases = [
  {
    name: 'Student submits to homework for THEIR OWN class',
    actorRole: 'student',
    actorId: 'student1',
    studentClassId: 'classA',
    homeworkClassId: 'classA',
    method: 'create',
    shouldBeAllowed: true,
  },
  {
    name: 'Student submits to homework for OTHER class (VULNERABILITY)',
    actorRole: 'student',
    actorId: 'student1',
    studentClassId: 'classA',
    homeworkClassId: 'classB', // Target homework is in Class B
    method: 'create',
    shouldBeAllowed: false, // Should be DENIED
  },
];

console.log('--- Phase 1: Verify Vulnerability (Current Rules) ---');
let vulnerabilityConfirmed = false;
cases.forEach((c) => {
  const allowed = checkSubmissionRule(c, false); // useFix = false
  // For the vulnerability case: allowed=true (bad), shouldBeAllowed=false.
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
    '\n🚨 VULNERABILITY CONFIRMED: Students can submit homework to classes they are not in.\n'
  );
} else {
  console.log('\n❓ Vulnerability NOT confirmed. Check logic.\n');
}

console.log('--- Phase 2: Verify Fix (Proposed Rules) ---');
let passed = 0;
let failed = 0;

cases.forEach((c) => {
  const allowed = checkSubmissionRule(c, true); // useFix = true

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
